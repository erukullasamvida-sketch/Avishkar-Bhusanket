from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: int
    location_id: int
    location_name: str | None
    severity: Literal["HIGH", "CRITICAL"]
    title: str
    message: str
    status: Literal["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]
    created_at: datetime
    risk_score: float | None
    probability: float | None
    risk_timestamp: datetime | None
    acknowledged_at: datetime | None
    resolved_at: datetime | None
    response_recommendation: str