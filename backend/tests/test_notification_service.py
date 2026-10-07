import unittest
from unittest.mock import patch

from app.services import notification_service


class NotificationServiceTests(unittest.TestCase):
    @patch("app.services.notification_service.requests.post")
    def test_alert_notification_interfaces_do_not_send_without_a_provider(
        self,
        post_request,
    ) -> None:
        with self.assertLogs(
            "app.services.notification_service",
            level="ERROR",
        ) as captured:
            result = notification_service.send_alert_notifications(
                recipient_phone="+919876543210",
                severity="HIGH",
                title="Test",
                message="Test alert",
                alert_id=10,
                location_name="Test location",
            )

        self.assertEqual(result, {"sms": False, "whatsapp": False})
        self.assertEqual(len(captured.records), 2)
        post_request.assert_not_called()


if __name__ == "__main__":
    unittest.main()
