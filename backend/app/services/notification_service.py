import logging
import os
import re

import requests


logger = logging.getLogger(__name__)
_E164_PHONE = re.compile(r"\+[1-9]\d{7,14}\Z")


class NotificationConfigurationError(Exception):
    def __init__(self, variable_name: str):
        self.variable_name = variable_name
        super().__init__(variable_name)


def get_alert_notifications_enabled(user_id: str, access_token: str) -> bool | None:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_PUBLISHABLE_KEY")
    if not supabase_url or not supabase_key:
        logger.error(
            "Cannot read alert notification preference: "
            "Supabase backend configuration is missing"
        )
        return None

    try:
        response = requests.get(
            f"{supabase_url.rstrip('/')}/rest/v1/settings",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {access_token}",
            },
            params={
                "select": "sms_notifications",
                "user_id": f"eq.{user_id}",
            },
            timeout=10,
        )
    except requests.RequestException as exc:
        logger.warning(
            "Cannot read alert notification preference; notifications skipped (%s)",
            type(exc).__name__,
        )
        return None

    if not response.ok:
        logger.warning(
            "Cannot read alert notification preference; notifications skipped (HTTP %s)",
            response.status_code,
        )
        return None

    try:
        settings = response.json()
    except ValueError:
        logger.warning("Cannot read alert notification preference; response was invalid")
        return None

    if not isinstance(settings, list):
        logger.warning("Cannot read alert notification preference; response was invalid")
        return None
    if not settings:
        return False

    enabled = (
        settings[0].get("sms_notifications")
        if isinstance(settings[0], dict)
        else None
    )
    if not isinstance(enabled, bool):
        logger.warning("Cannot read alert notification preference; setting was invalid")
        return None
    return enabled


def send_sms(
    recipient_phone: str,
    severity: str,
    title: str,
    message: str,
    location_name: str,
) -> None:
    validate_recipient_phone(recipient_phone)
    raise NotificationConfigurationError("SMS notification provider is not configured")


def send_whatsapp(
    recipient_phone: str,
    severity: str,
    title: str,
    message: str,
    location_name: str,
) -> None:
    validate_recipient_phone(recipient_phone)
    raise NotificationConfigurationError(
        "WhatsApp notification provider is not configured"
    )


def validate_recipient_phone(recipient_phone: str) -> None:
    if not _E164_PHONE.fullmatch(recipient_phone):
        raise ValueError("Recipient phone is not a valid international number")


def send_alert_notifications(
    recipient_phone: str,
    severity: str,
    title: str,
    message: str,
    alert_id: int,
    location_name: str,
) -> dict[str, bool]:
    results: dict[str, bool] = {}
    if severity.upper() not in {"HIGH", "CRITICAL"}:
        logger.info(
            "Notifications skipped for alert %s: severity is not HIGH or CRITICAL",
            alert_id,
        )
        return {"sms": False, "whatsapp": False}

    for channel, sender in (
        ("SMS", send_sms),
        ("WhatsApp", send_whatsapp),
    ):
        try:
            sender(
                recipient_phone,
                severity,
                title,
                message,
                location_name,
            )
        except NotificationConfigurationError as exc:
            logger.error(
                "%s notification skipped for alert %s: %s",
                channel,
                alert_id,
                str(exc),
            )
            results[channel.lower()] = False
        except ValueError as exc:
            logger.error(
                "%s notification skipped for alert %s (%s)",
                channel,
                alert_id,
                str(exc),
            )
            results[channel.lower()] = False
        else:
            logger.info("%s notification accepted for alert %s", channel, alert_id)
            results[channel.lower()] = True
    return results
