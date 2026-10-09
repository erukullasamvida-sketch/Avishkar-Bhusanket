import unittest
from datetime import datetime, timezone
from unittest.mock import Mock, patch

from sqlmodel import Session, SQLModel, create_engine, select

from app.models.alert import Alert
from app.models.environmental import EnvironmentalObservation
from app.models.location import Location
from app.models.risk import RiskRecord
from app.routers import prediction
from app.schemas.prediction import ScenarioSearchRequest
from app.services import prediction_service, scenario_search
from app.services.feature_preparation import prepare_features


def make_features() -> dict[str, float | int]:
    return {
        "rainfall_24h": 0.0,
        "soil_moisture": 42.0,
        "slope": 20.0,
        "elevation": 1000.0,
        "ndvi": 0.5,
        "historical_events": 2,
    }


def make_prediction(risk_level: str, probability: float = 0.8) -> dict:
    return {
        "risk_level": risk_level,
        "probability": probability,
        "probabilities": {risk_level: probability},
    }


class ScenarioSearchTests(unittest.TestCase):
    def predict_by_rainfall(self, features: dict) -> dict:
        rainfall = features["rainfall_24h"]
        if rainfall >= 500:
            return make_prediction("critical", 0.9)
        if rainfall >= 100:
            return make_prediction("high", 0.85)
        if rainfall >= 50:
            return make_prediction("moderate", 0.8)
        return make_prediction("low", 0.7)

    def test_prepared_soil_moisture_is_percentage_points(self) -> None:
        location = Location(
            id=1,
            name="Sohra",
            district="East Khasi Hills",
            latitude=25.27,
            longitude=91.73,
            elevation=1000,
            slope=20,
            ndvi=0.5,
            historical_events=2,
        )
        observation = EnvironmentalObservation(
            id=5,
            location_id=1,
            rainfall_24h=25,
            soil_moisture=0.42,
            observed_at=datetime.now(timezone.utc),
        )
        session = Mock()
        session.get.return_value = location
        session.exec.return_value.first.return_value = observation

        prepared = prepare_features(1, session)

        self.assertEqual(prepared["features"]["soil_moisture"], 42.0)
        self.assertLessEqual(prepared["features"]["soil_moisture"], 100)
        session.add.assert_not_called()
        session.commit.assert_not_called()

    @patch("app.services.scenario_search.predict_risk")
    def test_returns_exact_selected_target_and_changes_one_feature(
        self,
        predict_risk: Mock,
    ) -> None:
        predict_risk.side_effect = self.predict_by_rainfall

        result = scenario_search.search_higher_risk_scenarios(
            make_features(),
            ["rainfall_24h"],
            "high",
        )

        self.assertEqual(result["baseline_prediction"]["risk_level"], "low")
        self.assertEqual(result["target_class"], "high")
        self.assertEqual(result["scenario"]["prediction"]["risk_level"], "high")
        self.assertEqual(result["scenario"]["changed_feature"], "rainfall_24h")
        self.assertEqual(result["scenario"]["features"]["soil_moisture"], 42.0)
        self.assertEqual(result["scenario"]["features"]["historical_events"], 2)

    @patch.dict(
        "app.services.scenario_search.SEARCH_BOUNDS",
        {"rainfall_24h": {"min": 0.0, "max": 200.0, "step": 50.0}},
    )
    @patch("app.services.scenario_search.predict_risk")
    def test_selects_highest_probability_scenario_of_selected_exact_class(
        self,
        predict_risk: Mock,
    ) -> None:
        def predict(features: dict) -> dict:
            rainfall = features["rainfall_24h"]
            if rainfall == 0:
                return make_prediction("low")
            if rainfall in {50, 100}:
                return make_prediction("moderate", 0.6 if rainfall == 50 else 0.9)
            return make_prediction("high", 0.7 if rainfall == 150 else 0.95)

        predict_risk.side_effect = predict
        result = scenario_search.search_higher_risk_scenarios(
            make_features(),
            ["rainfall_24h"],
            "moderate",
        )

        self.assertEqual(result["scenario"]["features"]["rainfall_24h"], 100)
        self.assertEqual(result["scenario"]["prediction"]["risk_level"], "moderate")

    @patch("app.services.scenario_search.predict_risk")
    def test_baseline_classes_reject_targets_that_are_not_higher(
        self,
        predict_risk: Mock,
    ) -> None:
        for baseline_class, target_class, is_higher in [
            ("low", "moderate", True),
            ("low", "high", True),
            ("low", "critical", True),
            ("moderate", "high", True),
            ("moderate", "critical", True),
            ("high", "critical", True),
            ("moderate", "moderate", False),
            ("high", "high", False),
            ("high", "moderate", False),
            ("critical", "critical", False),
            ("critical", "high", False),
            ("critical", "moderate", False),
        ]:
            with self.subTest(baseline=baseline_class, target=target_class):
                predict_risk.reset_mock()
                predict_risk.return_value = make_prediction(baseline_class)
                result = scenario_search.search_higher_risk_scenarios(
                    make_features(),
                    ["rainfall_24h"],
                    target_class,
                )
                self.assertEqual(result["target_class"], target_class)
                self.assertEqual(result["target_is_higher"], is_higher)
                if not is_higher:
                    self.assertIsNone(result["scenario"])
                    self.assertEqual(result["evaluated_candidates"], 0)
                    self.assertEqual(predict_risk.call_count, 1)

    @patch("app.services.scenario_search.predict_risk")
    def test_missing_exact_target_returns_no_scenario(self, predict_risk: Mock) -> None:
        def predict(features: dict) -> dict:
            rainfall = features["rainfall_24h"]
            if rainfall == 0:
                return make_prediction("low")
            return make_prediction("moderate" if rainfall < 500 else "low")

        predict_risk.side_effect = predict

        result = scenario_search.search_higher_risk_scenarios(
            make_features(),
            ["rainfall_24h"],
            "critical",
        )

        self.assertIsNone(result["scenario"])
        self.assertTrue(result["target_is_higher"])
        self.assertGreater(result["evaluated_candidates"], 0)

    @patch("app.services.scenario_search.predict_risk")
    def test_search_results_are_deterministic(self, predict_risk: Mock) -> None:
        predict_risk.side_effect = self.predict_by_rainfall
        features = make_features()

        first = scenario_search.search_higher_risk_scenarios(
            features,
            ["rainfall_24h", "soil_moisture"],
            "critical",
        )
        second = scenario_search.search_higher_risk_scenarios(
            features,
            ["rainfall_24h", "soil_moisture"],
            "critical",
        )

        self.assertEqual(first, second)
        self.assertEqual(first["target_class"], "critical")
        self.assertEqual(first["scenario"]["prediction"]["risk_level"], "critical")

    def test_rejects_invalid_baseline_bounds_and_features(self) -> None:
        invalid_features = make_features()
        invalid_features["soil_moisture"] = 101
        with self.assertRaisesRegex(ValueError, "between 0.0 and 100.0"):
            scenario_search.search_higher_risk_scenarios(
                invalid_features,
                ["soil_moisture"],
                "high",
            )
        with self.assertRaisesRegex(ValueError, "Unsupported search feature"):
            scenario_search.search_higher_risk_scenarios(
                make_features(),
                ["historical_events"],
                "high",
            )

    @patch("app.services.scenario_search.MAX_CANDIDATE_EVALUATIONS", 3)
    @patch("app.services.scenario_search.predict_risk")
    def test_candidate_evaluation_limit_is_enforced(self, predict_risk: Mock) -> None:
        predict_risk.return_value = make_prediction("low")

        result = scenario_search.search_higher_risk_scenarios(
            make_features(),
            ["rainfall_24h", "soil_moisture"],
            "critical",
        )

        self.assertEqual(result["evaluated_candidates"], 3)
        self.assertEqual(result["candidate_limit"], 3)
        self.assertEqual(predict_risk.call_count, 4)
        self.assertLessEqual(
            result["evaluated_candidates"],
            result["candidate_limit"],
        )

    @patch("app.services.scenario_search.predict_risk")
    @patch("app.routers.prediction.prepare_features")
    @patch("app.services.prediction_service.evaluate_alert_condition")
    def test_simulation_search_has_no_database_or_alert_side_effects(
        self,
        evaluate_alert_condition: Mock,
        prepare: Mock,
        predict_risk: Mock,
    ) -> None:
        session = Mock()
        prepare.return_value = {"features": make_features()}
        predict_risk.return_value = make_prediction("low")

        prediction.search_prediction_scenarios(
            ScenarioSearchRequest(
                location_id=1,
                selected_features=["rainfall_24h"],
                target_class="high",
            ),
            session,
        )

        session.add.assert_not_called()
        session.commit.assert_not_called()
        evaluate_alert_condition.assert_not_called()

    @patch("app.routers.prediction.search_higher_risk_scenarios")
    @patch("app.routers.prediction.prepare_features")
    def test_scenario_search_route_passes_selected_target_class(
        self,
        prepare: Mock,
        search: Mock,
    ) -> None:
        features = make_features()
        prepare.return_value = {"features": features}
        search.return_value = {"target_class": "critical", "scenario": None}

        result = prediction.search_prediction_scenarios(
            ScenarioSearchRequest(
                location_id=1,
                target_class="critical",
                selected_features=["rainfall_24h"],
            ),
            Mock(),
        )

        self.assertEqual(result["target_class"], "critical")
        search.assert_called_once_with(features, ["rainfall_24h"], "critical")

    @patch("app.services.prediction_service.predict_risk")
    @patch("app.services.prediction_service.prepare_features")
    def test_actual_prediction_still_persists_risk_and_creates_then_reuses_alert(
        self,
        prepare: Mock,
        predict_risk: Mock,
    ) -> None:
        engine = create_engine("sqlite://")
        SQLModel.metadata.create_all(engine)
        features = make_features()
        with Session(engine) as session:
            location = Location(
                name="Sohra",
                district="East Khasi Hills",
                latitude=25.27,
                longitude=91.73,
                elevation=1000,
                slope=20,
                ndvi=0.5,
                historical_events=2,
            )
            session.add(location)
            session.commit()
            session.refresh(location)
            prepare.return_value = {
                "location_id": location.id,
                "observation_id": 10,
                "observed_at": datetime.now(timezone.utc),
                "features": features,
            }
            predict_risk.return_value = make_prediction("HIGH", 0.82)

            first = prediction_service.predict_location_risk(location.id, session)
            second = prediction_service.predict_location_risk(location.id, session)

            risk_records = session.exec(select(RiskRecord)).all()
            alerts = session.exec(select(Alert)).all()

        self.assertTrue(first["alert_created"])
        self.assertFalse(first["alert_reused"])
        self.assertFalse(second["alert_created"])
        self.assertTrue(second["alert_reused"])
        self.assertEqual(len(risk_records), 2)
        self.assertEqual(len(alerts), 1)
        self.assertEqual(risk_records[0].historical_events, 2)


if __name__ == "__main__":
    unittest.main()
