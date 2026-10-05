import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from .auth import require_supabase_auth
from .database import create_db_and_tables

from .routers import (
    dashboard,
    risk,
    prediction,
    alerts,
    reports,
    analytics,
    sensors,
    environmental,
    locations,
)


app = FastAPI(
    title="LandslideGuard API",
    description="AI-powered landslide early warning and risk monitoring API",
    version="1.0.0"
)

frontend_origins = {
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        (
            "http://localhost:5173,"
            "http://127.0.0.1:5173,"
            "http://localhost:8080,"
            "http://127.0.0.1:8080,"
            "https://unguided-enlighten-pawing.ngrok-free.dev"
        ),
    ).split(",")
    if origin.strip()
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(frontend_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.on_event("startup")
def startup():
    create_db_and_tables()


@app.get("/")
def root():
    return {
        "application": "LandslideGuard",
        "status": "operational",
        "version": "1.0.0"
    }


api_dependencies = [Depends(require_supabase_auth)]

app.include_router(dashboard.router, dependencies=api_dependencies)
app.include_router(risk.router, dependencies=api_dependencies)
app.include_router(prediction.router, dependencies=api_dependencies)
app.include_router(alerts.router, dependencies=api_dependencies)
app.include_router(reports.router, dependencies=api_dependencies)
app.include_router(analytics.router, dependencies=api_dependencies)
app.include_router(sensors.router, dependencies=api_dependencies)
app.include_router(environmental.router, dependencies=api_dependencies)
app.include_router(locations.router, dependencies=api_dependencies)