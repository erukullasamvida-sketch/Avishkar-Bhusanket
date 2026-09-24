from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models.report import FieldReport
from ..schemas.report import FieldReportCreate


router = APIRouter(
    prefix="/api/reports",
    tags=["Field Reports"]
)


@router.post("")
def create_report(
    report: FieldReportCreate,
    session: Session = Depends(get_session),
):
    new_report = FieldReport(**report.model_dump())
    session.add(new_report)
    session.commit()
    session.refresh(new_report)
    return new_report


@router.get("")
def get_reports(session: Session = Depends(get_session)):
    return session.exec(
        select(FieldReport)
        .order_by(FieldReport.created_at.desc())
        .limit(50)
    ).all()