import ollama
import os
import csv
from tqdm import tqdm
from concurrent.futures import ProcessPoolExecutor, as_completed

# --- CONFIG ---
MODEL = "llama3.2"
STAGE_DIR = "staged_emails"
PROCESSED_DIR = "processed_emails"
CSV_FILE = "client_report_parallel.csv"
MAX_WORKERS = 6

def process_single_file(filename):
    """Function that runs on a single core for one email"""
    file_path = os.path.join(STAGE_DIR, filename)
    
    try:
        with open(file_path, "r", encoding='utf-8') as f:
            raw_text = f.read()

        prompt = f"""### INSTRUCTIONS:
        Analyze this email. Is it a business outreach or client inquiry?
        If NO, reply ONLY with the word: SKIP.
        
        If YES, write exactly one line with three parts separated by a PIPE (|).
        Part 1: The Client or Company Name.
        Part 2: A 15-word detailed summary of the BODY content (ignore the subject).
        Part 3: The Status (Outreach, In Progress, or Closed).

        ### EMAIL DATA:
        {raw_text[:2000]}

        ### RESPONSE (One pipe-separated line only):"""

        response = ollama.chat(
            model=MODEL, 
            messages=[{'role': 'user', 'content': prompt}],
            options={'temperature': 0}
        )
        result = response['message']['content'].strip()

        # Sanity Check to prevent placeholder hallucinations
        placeholders = ["NAME", "SUMMARY", "STATUS", "PART 1", "PART 2", "PART 3"]
        
        if "|" in result and "SKIP" not in result:
            if not any(p in result.upper() for p in placeholders):
                # Return the data to the main process for writing
                header_lines = raw_text.split('\n')
                data = {
                    'Date': header_lines[2].replace("DATE: ", ""),
                    'Sender': header_lines[1].replace("FROM: ", ""),
                    'Subject': header_lines[3].replace("SUBJ: ", ""),
                    'Client_Name': result.split('|')[0].strip(),
                    'Summary': result.split('|')[1].strip(),
                    'Status': result.split('|')[2].strip()
                }
                # Move file after successful extraction
                os.rename(file_path, os.path.join(PROCESSED_DIR, filename))
                return data

        # Move file even if skipped to keep the loop moving
        os.rename(file_path, os.path.join(PROCESSED_DIR, filename))
        return None

    except Exception as e:
        return f"Error on {filename}: {e}"

def main():
    if not os.path.exists(PROCESSED_DIR): os.makedirs(PROCESSED_DIR)
    
    files = [f for f in os.listdir(STAGE_DIR) if f.endswith(".txt")]
    if not files:
        print("✅ No files to process.")
        return

    keys = ['Date', 'Sender', 'Subject', 'Client_Name', 'Summary', 'Status']
    file_exists = os.path.isfile(CSV_FILE)

    print(f"🚀 Launching {MAX_WORKERS} parallel workers on i9 cores...")

    with open(CSV_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        if not file_exists: writer.writeheader()

        # Using ProcessPoolExecutor to distribute the load
        with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(process_single_file, fname): fname for fname in files}
            
            for future in tqdm(as_completed(futures), total=len(files), desc="Parallel Extraction"):
                result = future.result()
                if isinstance(result, dict):
                    writer.writerow(result)
                    f.flush() # Keep the CSV updated in real-time

if __name__ == "__main__":
    main()