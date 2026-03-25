import psycopg2
import os

DB_PARAMS = "dbname=postgres user=gts"
STAGE_DIR = "staged_emails"
PROCESSED_DIR = "processed_emails"

def stage_emails():
    # Ensure our directories exist
    if not os.path.exists(STAGE_DIR):
        os.makedirs(STAGE_DIR)
    if not os.path.exists(PROCESSED_DIR):
        os.makedirs(PROCESSED_DIR)
    
    conn = psycopg2.connect(DB_PARAMS)
    cur = conn.cursor()
    
    # Only pull potential business emails
    cur.execute("""
        SELECT gmail_id, sender, subject, date_sent, body_content 
        FROM mail_storage 
        WHERE sender NOT ILIKE '%noreply%' 
        AND sender NOT ILIKE '%google.com%'
        AND sender NOT ILIKE '%classroom%';
    """)
    rows = cur.fetchall()
    
    new_staged_count = 0
    
    for gid, sender, subject, date, body in rows:
        
        # --- THE MEMORY FIX ---
        # Check if this email was already processed by the AI (checking both new and old naming formats)
        if os.path.exists(f"{PROCESSED_DIR}/{gid}.txt") or os.path.exists(f"{PROCESSED_DIR}/processed_{gid}.txt"):
            continue # Skip to the next email instantly!
            
        # Create a clean header for the AI for NEW emails
        content = f"ID: {gid}\nFROM: {sender}\nDATE: {date}\nSUBJ: {subject}\n\nBODY:\n{body}"
        
        with open(f"{STAGE_DIR}/{gid}.txt", "w", encoding='utf-8') as f:
            f.write(content)
            
        new_staged_count += 1
            
    if new_staged_count > 0:
        print(f"✅ Staged {new_staged_count} NEW emails in '{STAGE_DIR}/'")
    else:
        print(f"✅ Vault is up to date. 0 new emails staged.")
        
    conn.close()

if __name__ == "__main__":
    stage_emails()