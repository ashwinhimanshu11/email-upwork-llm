import streamlit as st
import psycopg2
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer
import ollama
import datetime

# --- PAGE CONFIG ---
st.set_page_config(page_title="Executive Mail Assistant", page_icon="vault", layout="wide")

# --- PREMIUM STYLING ---
st.markdown("""
    <style>
    .stApp { background-color: #0e1117; }
    .stChatInputContainer { padding-bottom: 20px; }
    .streamlit-expanderHeader { font-weight: 600; color: #4CAF50; }
    [data-testid="stSidebar"] { background-color: #161b22; border-right: 1px solid #30363d; }
    div[data-testid="stMetricValue"] { color: #58a6ff; }
    </style>
    """, unsafe_allow_html=True)

# --- DATABASE & MODEL SETUP ---
@st.cache_resource
def init_resources():
    conn = psycopg2.connect("dbname=postgres user=gts")
    register_vector(conn)
    model = SentenceTransformer('all-MiniLM-L6-v2')
    return conn, model

conn, embedding_model = init_resources()

def get_email_count():
    try:
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM mail_storage;")
        count = cur.fetchone()[0]
        cur.close()
        return count
    except: return 0

# --- SIDEBAR DASHBOARD ---
with st.sidebar:
    st.title("⚙️ System Status")
    st.metric(label="Emails in Local Vault", value=f"{get_email_count():,}")
    st.caption("100% Local processing on Intel i9.")
    st.divider()
    st.subheader("🎯 Precision Filters")
    filter_sender = st.text_input("Filter by Sender/Domain:")
    today = datetime.date.today()
    date_range = st.date_input("Date Range:", value=(today - datetime.timedelta(days=365), today), max_value=today)
    st.divider()
    st.subheader("Search Parameters")
    top_k = st.slider("Context Depth (Emails):", 1, 15, 8) # Increased default for better context
    model_choice = st.selectbox("Intelligence Engine:", ["gemma3:4b", "llama3.2"])
    exact_match = st.checkbox("Require Exact Keyword Match", value=True) # Default to True to help with names

    if st.button("🗑️ Clear Conversation", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# --- MAIN UI ---
st.title("💼 Executive Mail Assistant")

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "sources" in message and message["sources"]:
            with st.expander("View Referenced Emails"):
                for idx, row in enumerate(message["sources"]):
                    st.markdown(f"**{idx+1}. {row[0]}**")
                    st.caption(f"From: {row[1]} | Date: {row[2]}")
                    st.markdown(f"> {row[3][:300]}...")
                    st.divider()

prompt = st.chat_input("Ask about your emails...")

if prompt:
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # 2. ADVANCED HYBRID RETRIEVAL
    with st.spinner("Searching vault..."):
        query_vector = embedding_model.encode(prompt).tolist()
        cur = conn.cursor()
        
        start_date, end_date = (date_range if len(date_range) == 2 else (date_range[0], date_range[0]))

        # Base SQL with date filtering
        sql_query = "SELECT subject, sender, date_sent, body_content FROM mail_storage WHERE date_sent::date >= %s AND date_sent::date <= %s"
        sql_params = [start_date, end_date]

        # KEYWORD OVERRIDE: If prompt is short (like a name) or contains specific handles
        if len(prompt.split()) < 4 or "@" in prompt or filter_sender:
            term = f"%{filter_sender if filter_sender else prompt}%"
            sql_query += " AND (sender ILIKE %s OR body_content ILIKE %s OR subject ILIKE %s)"
            sql_params.extend([term, term, term])

        sql_query += " ORDER BY embedding <=> %s::vector LIMIT %s"
        sql_params.extend([query_vector, top_k])
        
        cur.execute(sql_query, tuple(sql_params))
        rows = cur.fetchall()
        cur.close()

    # 3. CONTEXT BUILDING
    context = ""
    for i, row in enumerate(rows):
        context += f"\n[Email {i+1}] From: {row[1]} | Subj: {row[0]}\nBody: {row[3][:2000]}\n" # More body content for deep-dives
    
    # 4. CHAT HISTORY (Last 6 messages)
    history_context = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in st.session_state.messages[-7:-1]])
    if not history_context: history_context = "Starting new conversation."

    # 5. DYNAMIC INTENT PROMPT
    llm_prompt = f"""You are an expert executive assistant. 
    Use the history and provided emails to answer the user's current Question.

    RULES:
    1. If the user asks for a specific detail (like 'elaborate' or 'who sent it'): Provide a detailed response based ONLY on the provided emails.
    2. If multiple emails are relevant, summarize them as a list.
    3. If zero emails are relevant, say: "I cannot find relevant information in the retrieved documents."
    4. Resolve pronouns like "it", "that", or "him" using the History.

    HISTORY: {history_context}
    EMAILS: {context}
    Question: {prompt}
    Answer:"""

    # 6. GENERATION
    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        full_response = ""
        stream = ollama.chat(model=model_choice, messages=[{'role': 'user', 'content': llm_prompt}], stream=True, 
                             options={"num_thread": 8, "num_ctx": 12000, "temperature": 0.1})
        
        for chunk in stream:
            full_response += chunk['message']['content']
            response_placeholder.markdown(full_response + "▌")
        response_placeholder.markdown(full_response)
        
        with st.expander("View Referenced Emails"):
            for idx, row in enumerate(rows):
                st.markdown(f"**{idx+1}. {row[0]}**")
                st.caption(f"From: {row[1]} | Date: {row[2]}")
                st.markdown(f"> {row[3][:400]}...")
                st.divider()

    st.session_state.messages.append({"role": "assistant", "content": full_response, "sources": rows})