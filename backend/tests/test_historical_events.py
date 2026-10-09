import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.models.location import Location
from app.routers import historical_events


class FakeSession:
    def __init__(self, locations: dict[int, Location]) -> None:
        self.locations = locations

    def get(self, model: type[Location], location_id: int) -> Location | None:
        if model is not Location:
            raise AssertionError(f"Unexpected model: {model}")
        return self.locations.get(location_id)


def make_event(
    event_id: str,
    name: str,
    district: str,
) -> historical_events.HistoricalLandslideEvent:
    return historical_events.HistoricalLandslideEvent(
        event_id=event_id,
        location_name=name,
        event_date="2024-06-01",
        district=district,
        description="Test event record",
        reported_impact=None,
        source_name="Test source",
        source_url="https://example.com/event",
    )


class HistoricalEventsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.location_one = Location(
            id=1,
            name="Sohra",
            district="East Khasi Hills",
            latitude=25.27,
            longitude=91.73,
            elevation=1000,
            slope=20,
        )
        self.location_two = Location(
            id=2,
            name="Haflong",
            district="Dima Hasao",
            latitude=25.17,
            longitude=93.02,
            elevation=1000,
            slope=20,
        )
        self.session = FakeSession(
            {1: self.location_one, 2: self.location_two}
        )

    def test_returns_events_matching_selected_location_name_and_district(self):
        events = [
            make_event("sohra-1", "Sohra", "East Khasi Hills"),
            make_event("haflong-1", "Haflong", "Dima Hasao"),
            make_event("wrong-district", "Sohra", "Dima Hasao"),
        ]
        with patch.object(historical_events, "_load_historical_events", return_value=events):
            response = historical_events.get_historical_events(1, self.session)

        self.assertEqual(response.location_id, 1)
        self.assertEqual(response.location_name, "Sohra")
        self.assertEqual([event.event_id for event in response.events], ["sohra-1"])

    def test_returns_empty_list_when_location_has_no_records(self):
        with patch.object(
            historical_events,
            "_load_historical_events",
            return_value=[make_event("haflong-1", "Haflong", "Dima Hasao")],
        ):
            response = historical_events.get_historical_events(1, self.session)

        self.assertEqual(response.events, [])

    def test_returns_only_the_requested_locations_events(self):
        events = [
            make_event("sohra-1", "Sohra", "East Khasi Hills"),
            make_event("haflong-1", "Haflong", "Dima Hasao"),
        ]
        with patch.object(historical_events, "_load_historical_events", return_value=events):
            sohra_response = historical_events.get_historical_events(1, self.session)
            haflong_response = historical_events.get_historical_events(2, self.session)

        self.assertEqual(
            [event.event_id for event in sohra_response.events],
            ["sohra-1"],
        )
        self.assertEqual(
            [event.event_id for event in haflong_response.events],
            ["haflong-1"],
        )

    def test_unknown_location_returns_not_found(self):
        with self.assertRaises(HTTPException) as raised:
            historical_events.get_historical_events(999, self.session)

        self.assertEqual(raised.exception.status_code, 404)

    def test_checked_in_dataset_events_match_location_names_and_districts(self):
        events = historical_events._load_historical_events()
        self.assertEqual(
            {
                (event.location_name, event.district)
                for event in events
            },
            {
                ("Guwahati", "Kamrup Metropolitan"),
                ("Aizawl", "Aizawl"),
            },
        )


if __name__ == "__main__":
    unittest.main()
