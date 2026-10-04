from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field


class Alert(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    location_id: int

    title: str
    message: str

    severity: str

    status: str = "ACTIVE"

    risk_record_id: Optional[int] = None

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )

    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
