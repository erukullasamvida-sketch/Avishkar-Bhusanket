from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field


class FieldReport(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    location_name: str

    latitude: float
    longitude: float

    report_type: str

    severity: str = "moderate"

    description: str

    image_url: Optional[str] = None

    status: str = "UNDER_VERIFICATION"

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )