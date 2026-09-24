from typing import Optional

from fastapi import APIRouter, Depends
from sqlmodel import Session, func, or_, select

from ..database import get_session
from ..models.location import Location


router = APIRouter(
    prefix="/api/locations",
    tags=["Locations"],
)


@router.get("")
def get_locations(
    search: Optional[str] = None,
    session: Session = Depends(get_session),
):
    statement = select(Location).where(Location.monitored == True)

    normalized_search = search.strip().lower() if search else ""
    if normalized_search:
        pattern = f"%{normalized_search}%"
        statement = statement.where(
            or_(
                func.lower(Location.name).like(pattern),
                func.lower(Location.district).like(pattern),
            )
        )

    return session.exec(statement.order_by(Location.id)).all()