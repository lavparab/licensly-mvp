from fastapi import APIRouter, HTTPException, Depends
from app.services.optimization import generate_savings_recommendations
from app.utils.db import get_supabase
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/analyze/{org_id}")
async def analyze_organization(org_id: str):
    """
    Triggers a full organization-wide analysis to generate optimization recommendations.
    """
    try:
        supabase = get_supabase()
        results = generate_savings_recommendations(org_id, supabase)
        return results
    except Exception as e:
        logger.error(f"Analysis failed for {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/{org_id}")
async def get_recommendations(org_id: str):
    """
    Fetches the generated recommendations for an org.
    """
    try:
        supabase = get_supabase()
        response = supabase.table('optimization_recommendations').select('*').eq('org_id', org_id).eq('status', 'pending').execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/savings-estimate/{org_id}")
async def get_savings_estimate(org_id: str):
    """
    Sums the estimated savings.
    """
    try:
         supabase = get_supabase()
         response = supabase.table('optimization_recommendations').select('estimated_savings').eq('org_id', org_id).eq('status', 'pending').execute()
         total = sum(r.get('estimated_savings', 0) for r in response.data)
         return {"total_potential_savings": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
