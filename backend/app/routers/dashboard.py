from fastapi import APIRouter
from sqlmodel import Session, select

from ..database import engine
from ..models.location import Location
from ..models.risk import RiskRecord
from ..models.alert import Alert


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("")
def get_dashboard():
    with Session(engine) as session:

        locations = session.exec(
            select(Location).where(Location.monitored == True)
        ).all()

        risks = session.exec(
            select(RiskRecord)
        ).all()

        alerts = session.exec(
            select(Alert)
        ).all()

        high_risk_zones = sum(
            1 for risk in risks
            if risk.risk_level in ["High", "Critical"]
        )

        critical_zones = sum(
            1 for risk in risks
            if risk.risk_level == "Critical"
        )

        active_alerts = sum(
            1 for alert in alerts
            if alert.status == "ACTIVE"
        )

        if risks:
            average_risk = round(
                sum(r.risk_score for r in risks) / len(risks),
                1
            )
        else:
            average_risk = 0

        return {
            "monitored_locations": len(locations),
            "high_risk_zones": high_risk_zones,
            "critical_zones": critical_zones,
            "active_alerts": active_alerts,
            "average_risk_score": average_risk,
            "system_status": "OPERATIONAL"
        }