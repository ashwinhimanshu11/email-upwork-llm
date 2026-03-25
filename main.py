from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer
import ollama
from ollama import AsyncClient
import json
import asyncio
import datetime

app = FastAPI()

# --- CORS CONFIG ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RESOURCE INITIALIZATION ---
print("🧠 Loading Embedding Model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def get_db_conn():
    conn = psycopg2.connect("dbname=postgres user=gts")
    register_vector(conn)
    return conn

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    prompt: str
    history: List[ChatMessage]
    model: str = "gemma3:4b"
    top_k: int = 8
    date_range: List[str]
    filter_sender: Optional[str] = None

@app.get("/stats")
async def get_stats():
    conn = get_db_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT count(*) FROM mail_storage;")
        count = cur.fetchone()[0]
        return {"total_emails": count}
    except: return {"total_emails": 0}
    finally:
        cur.close()
        conn.close()

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    conn = get_db_conn()
    cur = conn.cursor()
    
    try:
        # 1. VECTORIZE PROMPT
        loop = asyncio.get_event_loop()
        query_vector = await loop.run_in_executor(None, lambda: embedding_model.encode(req.prompt).tolist())
        
        # 2. IDENTIFY ALL CRITICAL TERMS
        words = [w.strip('?.,!"') for w in req.prompt.split() if len(w) > 3]
        critical_terms = [w for w in words if w[0].isupper() or w.lower() in ['maithili', 'muzaffarnagar', 'konkani', 'sunil', 'syed', 'uber']]

        sql_query = "SELECT subject, sender, date_sent, body_content FROM mail_storage WHERE 1=1"
        sql_params = []

        # 3. BROAD HYBRID FILTER (The "DOT-CONNECTOR")
        if critical_terms or req.filter_sender:
            if req.filter_sender:
                sql_query += " AND (sender ILIKE %s)"
                sql_params.append(f"%{req.filter_sender}%")
            
            if critical_terms:
                term_clauses = []
                for term in critical_terms:
                    term_clauses.append("(body_content ILIKE %s OR subject ILIKE %s OR sender ILIKE %s)")
                    sql_params.extend([f"%{term}%", f"%{term}%", f"%{term}%"])
                # Uses OR logic so multiple topics can enter the context
                sql_query += f" AND ({' OR '.join(term_clauses)})"
        else:
            # Fallback to date range for general queries
            start_date = req.date_range[0] if (req.date_range and len(req.date_range) > 0) else "1900-01-01"
            end_date = req.date_range[1] if (req.date_range and len(req.date_range) > 1) else str(datetime.date.today())
            sql_query += " AND date_sent::date >= %s AND date_sent::date <= %s"
            sql_params.extend([start_date, end_date])

        # 4. RANK & LIMIT
        sql_query += " ORDER BY embedding <=> %s::vector LIMIT %s"
        sql_params.extend([query_vector, req.top_k])
        
        cur.execute(sql_query, tuple(sql_params))
        rows = cur.fetchall()

        # 5. CONTEXT BUILDING
        context = ""
        sources = []
        for i, row in enumerate(rows):
            context += f"\n[Email {i+1}] From: {row[1]} | Subj: {row[0]}\nBody: {row[3][:1500]}\n"
            sources.append({"subject": row[0], "sender": row[1], "date": str(row[2]), "snippet": row[3][:400]})

        history_context = "\n".join([f"{m.role.upper()}: {m.content}" for m in req.history[-6:]])
        
        # 6. REFINED SYSTEM PROMPT
        llm_prompt = f"""You are an expert executive assistant. 
        Synthesize a detailed answer using the provided EMAILS. 
        Connect dots between different people and projects if they appear together in the context.
        
        HISTORY: {history_context}
        EMAILS: {context}
        Question: {req.prompt}
        Answer:"""

        async def generate_response():
            yield json.dumps({"type": "sources", "data": sources}) + "\n"
            client = AsyncClient()
            stream = await client.chat(
                model=req.model, 
                messages=[{'role': 'user', 'content': llm_prompt}], 
                stream=True, 
                options={"num_thread": 8, "num_ctx": 8192, "temperature": 0.1}
            )
            async for chunk in stream:
                if 'message' in chunk and 'content' in chunk['message']:
                    yield json.dumps({"type": "chunk", "data": chunk['message']['content']}) + "\n"

        return StreamingResponse(generate_response(), media_type="application/x-ndjson")

    except Exception as e:
        print(f"❌ Server Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)