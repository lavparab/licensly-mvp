import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env from monorepo root
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../../.env"))

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    pass # In production, raise Exception. Allowing pass for MVP startup

# Initialize Supabase Admin Client
def get_supabase() -> Client:
    return create_client(url, key)
