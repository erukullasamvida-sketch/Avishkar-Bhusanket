from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models.alert import Alert
from ..models.location import Location
from ..models.report import FieldReport
from ..models.risk import RiskRecord

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)


@router.get("/summary")
def analytics_summary(session: Session = Depends(get_session)):
    locations = session.exec(
        select(Location).where(Location.monitored == True)
    ).all()
    latest_risks = []
    for location in locations:
        risk = session.exec(
            select(RiskRecord)
            .where(RiskRecord.location_id == location.id)
            .order_by(RiskRecord.created_at.desc())
        ).first()
        if risk:
            latest_risks.append(risk)

    reports = session.exec(select(FieldReport)).all()
    alerts = session.exec(select(Alert)).all()
    return {
        "total_events": len(reports),
        "critical_events": sum(1 for alert in alerts if alert.severity.lower() == "critical"),
        "high_risk_events": sum(
            1 for risk in latest_risks if risk.risk_level in {"High", "Critical"}
        ),
        "average_risk": round(
            sum(risk.risk_score for risk in latest_risks) / len(latest_risks),
            1,
        ) if latest_risks else 0,
    }