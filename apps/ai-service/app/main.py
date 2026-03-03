from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.endpoints import router as ai_router

load_dotenv()

app = FastAPI(title="Licensly AI/ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router, prefix="/api/ai", tags=["ai"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "licensly-ai"}
