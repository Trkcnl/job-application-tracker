import os
import base64
import asyncio
from bs4 import BeautifulSoup
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from motor.motor_asyncio import AsyncIOMotorClient

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify']

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client.job_tracker_db
collection = db.applications

def get_gmail_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return build('gmail', 'v1', credentials=creds)

def extract_email_body(payload):
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8')
            elif part['mimeType'] == 'text/html':
                data = part['body'].get('data')
                if data:
                    html_content = base64.urlsafe_b64decode(data).decode('utf-8')
                    soup = BeautifulSoup(html_content, 'html.parser')
                    return soup.get_text()
    else:
        data = payload['body'].get('data')
        if data:
            return base64.urlsafe_b64decode(data).decode('utf-8')
    return ""

def is_rejection_email(text):
    text_lower = text.lower()
    rejection_keywords = [
        "regret",
        "unfortunately",
        "other candidates",
        "not moving forward",
        "pursue other candidates",
        "decided to proceed with other",
        "not be moving forward"
    ]
    return any(keyword in text_lower for keyword in rejection_keywords)

async def check_and_update_applications():
    service = get_gmail_service()
    
    results = service.users().messages().list(userId='me', q='is:unread', maxResults=50).execute()
    messages = results.get('messages', [])

    if not messages:
        return

    active_apps = await collection.find({"status": {"$in": ["Applied", "Interviewing"]}}).to_list(1000)
    company_names = {app['company'].lower(): app['_id'] for app in active_apps}

    for message in messages:
        msg = service.users().messages().get(userId='me', id=message['id'], format='full').execute()
        headers = msg['payload'].get('headers', [])
        
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "")
        sender = next((h['value'] for h in headers if h['name'] == 'From'), "")
        
        body = extract_email_body(msg['payload'])
        full_text = f"{subject} {body}"

        is_job_related = False
        matched_company = None
        matched_app_id = None
        
        for company_name, app_id in company_names.items():
            if company_name in full_text.lower() or company_name in sender.lower():
                is_job_related = True
                matched_company = company_name
                matched_app_id = app_id
                break

        if is_job_related:
            try:
                service.users().messages().modify(
                    userId='me', id=message['id'],
                    body={'removeLabelIds': ['UNREAD']}
                ).execute()
            except Exception:
                pass

            if is_rejection_email(full_text):
                await collection.update_one(
                    {"_id": matched_app_id}, 
                    {"$set": {"status": "Rejected", "notes": "Automatically marked as rejected via email."}}
                )
                del company_names[matched_company]

if __name__ == '__main__':
    asyncio.run(check_and_update_applications())
