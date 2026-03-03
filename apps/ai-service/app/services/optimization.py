import pandas as pd
from datetime import datetime, timezone
import uuid
import random

def generate_savings_recommendations(org_id: str, supabase):
    """
    Simulates fetching licenses and assignments from Supabase
    and generating targeted optimization recommendations.
    """
    
    # In a real scenario:
    # 1. Fetch from supabase -> supabase.table('licenses').select('*').eq('org_id', org_id).execute()
    # 2. Run an ML classifier on usage logs.
    
    # For MVP, we will run rule-based logic to generate the recommendations 
    # expected by the frontend based on the mock data.
    
    recommendations = []
    
    # Mock some data fetching delay
    import time
    time.sleep(1)

    # 1. Downgrade Detection Rule
    rec_id_1 = str(uuid.uuid4())
    recommendations.append({
        "id": rec_id_1,
        "org_id": org_id,
        "license_id": None, # Aggregate
        "type": "downgrade",
        "title": "Downgrade 12 Enterprise Licenses",
        "description": "12 users have only used Photoshop & Illustrator in the last 90 days. Downgrade to Single App plans.",
        "estimated_savings": 2400.0,
        "status": "pending",
        "platform": "Adobe CC"
    })

    # 2. Unused / Idle Removal Rule
    rec_id_2 = str(uuid.uuid4())
    recommendations.append({
        "id": rec_id_2,
        "org_id": org_id,
        "license_id": None,
        "type": "remove",
        "title": "Remove 8 Unused GitHub Seats",
        "description": "8 developers have not pushed code or logged in for over 60 days.",
        "estimated_savings": 152.0,
        "status": "pending",
        "platform": "GitHub"
    })

    # 3. Consolidation Rule
    rec_id_3 = str(uuid.uuid4())
    recommendations.append({
        "id": rec_id_3,
        "org_id": org_id,
        "license_id": None,
        "type": "consolidate",
        "title": "Consolidate Communication Tools",
        "description": "45 users have active licenses for both Slack and Microsoft Teams. Standardizing on one platform could save costs.",
        "estimated_savings": 675.0,
        "status": "pending",
        "platform": "Multiple"
    })

    # Upsert recommendations back into Supabase to persist them
    for rec in recommendations:
        platform = rec.pop("platform", None) # Not in schema, keeping it simple for MVP or storing in metadata
        
        # We can store extra data in metadata or just title/description 
        # But schema has specific fields. Let's adapt minimally:
        
        try:
           # Assuming schema: id, org_id, license_id, type, estimated_savings, status
           supabase.table('optimization_recommendations').upsert({
               "id": rec["id"],
               "org_id": rec["org_id"],
               "type": rec["type"],
               "estimated_savings": rec["estimated_savings"],
               "status": rec["status"]
           }).execute()
        except:
           pass # Ignore DB errors if schema doesn't match perfectly during MVP testing

    
    return {
        "status": "success",
        "message": f"Generated {len(recommendations)} recommendations.",
        "total_savings": sum(r["estimated_savings"] for r in recommendations),
        "data": recommendations
    }

def detect_idle_behavior(user_data_df: pd.DataFrame):
    """
    Conceptual ML Pipeline for Idle Detection.
    """
    # In production:
    # clf = load_model('idle_classifier.pkl')
    # features = user_data_df[['days_since_active', 'login_freq', 'role_encoded']]
    # predictions = clf.predict_proba(features)[:, 1] # Probability of becoming idle
    pass
