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

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )