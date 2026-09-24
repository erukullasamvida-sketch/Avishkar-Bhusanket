from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field


class RiskRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    location_id: int

    rainfall_24h: float
    soil_moisture: float
    slope: float
    elevation: float
    ndvi: float
    historical_events: int

    risk_score: float
    risk_level: str

    probability: float

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )