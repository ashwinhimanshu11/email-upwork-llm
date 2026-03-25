#!/bin/bash
echo "Starting Executive Mail Vault Sync..."

echo "Fetching new emails..."
python3 stage_emails.py

echo "Processing with Llama 3.1:8b..."
python3 process_staged_emails.py

echo "Saving to Database..."
python3 ingest_to_postgres.py

echo "Sync Complete! Your vault is up to date."