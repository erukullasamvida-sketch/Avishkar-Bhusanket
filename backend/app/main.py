import os
from ipaddress import ip_address
from urllib.parse import urlsplit

from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from . import auth
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
    title="BHUSANKET API",
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
        "application": "BHUSANKET",
        "status": "operational",
        "version": "1.0.0"
    }


@app.post("/api/demo/session")
def create_local_demo_session(request: Request):
    client_host = request.client.host if request.client else ""
    origin = request.headers.get("origin", "")
    try:
        is_loopback = ip_address(client_host).is_loopback
    except ValueError:
        is_loopback = False

    try:
        origin_url = urlsplit(origin)
        origin_host = origin_url.hostname or ""
        origin_is_loopback = (
            origin_url.scheme == "http"
            and (
                origin_host == "localhost"
                or ip_address(origin_host).is_loopback
            )
        )
    except ValueError:
        origin_is_loopback = False

    if (
        not is_loopback
        or origin not in frontend_origins
        or not origin_is_loopback
    ):
        raise HTTPException(
            status_code=403,
            detail="Demo login is only available from an allowed local frontend",
        )

    return {
        "access_token": auth._local_demo_token,
        "token_type": "bearer",
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