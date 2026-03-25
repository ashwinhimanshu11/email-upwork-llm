import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_total_emails():
    creds = None
    # We will save the new session as token_new.json so we don't overwrite your old one
    token_file = 'token_new.json'
    
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
        
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # This looks for your new credentials.json
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the new token
        with open(token_file, 'w') as token:
            token.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)

    print("🔍 Counting all messages in the new account...")
    
    total_count = 0
    next_page_token = None
    
    while True:
        results = service.users().messages().list(
            userId='me', 
            pageToken=next_page_token,
            maxResults=500 
        ).execute()
        
        messages = results.get('messages', [])
        total_count += len(messages)
        
        next_page_token = results.get('nextPageToken')
        if not next_page_token:
            break
            
        if total_count % 5000 == 0:
            print(f"Counting... {total_count} so far")

    print(f"\n✅ Total Emails in Account: {total_count}")

if __name__ == "__main__":
    get_total_emails()