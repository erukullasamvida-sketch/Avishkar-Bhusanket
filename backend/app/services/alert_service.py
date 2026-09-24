from sqlmodel import Session, select

from ..models.alert import Alert


_SEVERITY_RANK = {
	"HIGH": 1,
	"CRITICAL": 2,
}


def evaluate_alert_condition(
	session: Session,
	location_id: int,
	location_name: str,
	risk_level: str,
):
	normalized_level = risk_level.upper()
	severity = normalized_level if normalized_level in _SEVERITY_RANK else None

	if severity is None:
		return {"created": False, "reused": False, "alert": None}

	active_alerts = session.exec(
		select(Alert).where(
			Alert.location_id == location_id,
			Alert.status == "ACTIVE",
		)
	).all()

	for alert in active_alerts:
		existing_severity = alert.severity.upper()
		if _SEVERITY_RANK.get(existing_severity, 0) >= _SEVERITY_RANK[severity]:
			return {"created": False, "reused": True, "alert": alert}

	risk_label = risk_level.title()
	response_wording = {
		"HIGH": "Immediate monitoring is recommended.",
		"CRITICAL": "Immediate monitoring and response are recommended.",
	}
	alert = Alert(
		location_id=location_id,
		title=f"{risk_label} Landslide Risk Detected",
		message=(
			f"AI risk prediction for {location_name} indicates {risk_label} risk. "
			f"{response_wording[severity]}"
		),
		severity=severity,
		status="ACTIVE",
	)
	session.add(alert)
	session.commit()
	session.refresh(alert)

	return {"created": True, "reused": False, "alert": alert}
