import psycopg2
import csv
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# --- CONFIG ---
CSV_FILE = "client_report_final.csv" # Or client_report_parallel.csv depending on what your process script outputs

def ingest_data():
    print("🚀 Connecting to PostgreSQL...")
    conn = psycopg2.connect("dbname=postgres user=gts")
    cur = conn.cursor()

    print("🧠 Loading Embedding Model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

    try:
        with open(CSV_FILE, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
            if not rows:
                print("⚠️ CSV is empty. Nothing to ingest.")
                return

            print(f"📥 Vectorizing and Ingesting {len(rows)} emails into the vault...")
            
            for row in tqdm(rows, desc="Database Ingestion"):
                # Combine the AI's extracted data into a rich text block for better semantic search
                rich_body = f"Client: {row['Client_Name']} | Status: {row['Status']} | Summary: {row['Summary']}"
                
                # Generate the mathematical vector of this email
                embedding = model.encode(rich_body).tolist()
                
                # Insert into the database (Matching the columns your app.py expects)
                # We use trying to handle potential timestamp issues gracefully
                try:
                    cur.execute("""
                        INSERT INTO mail_storage (date_sent, sender, subject, body_content, embedding)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        row['Date'], 
                        row['Sender'], 
                        row['Subject'], 
                        rich_body, 
                        embedding
                    ))
                except Exception as db_err:
                    print(f"\n⚠️ Skipping row due to DB error: {db_err}")
                    conn.rollback()
                    continue
                
            conn.commit()
            print("\n✅ All emails successfully vectorized and stored in PostgreSQL!")
            
            # Optional: You can uncomment the lines below to automatically clear the CSV 
            # after a successful upload so you don't double-count them next time.
            # with open(CSV_FILE, 'w') as wipe_file:
            #     wipe_file.write("Date,Sender,Subject,Client_Name,Summary,Status\n")

    except FileNotFoundError:
        print(f"❌ Error: Could not find '{CSV_FILE}'. Did the Ollama processing script finish?")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    ingest_data()