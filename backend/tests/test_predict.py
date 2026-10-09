import unittest
from unittest.mock import Mock, patch

import pandas as pd

from app.ml.predict import FEATURES, model as trained_model, predict_risk


class PredictRiskTests(unittest.TestCase):
    def test_prediction_matches_trained_model_output(self) -> None:
        features = {
            "rainfall_24h": 12,
            "soil_moisture": 42,
            "slope": 20,
            "elevation": 1000,
            "ndvi": 0.5,
            "historical_events": 2,
        }
        model_input = pd.DataFrame([features])[FEATURES]
        expected_class = trained_model.predict(model_input)[0]
        expected_probability = trained_model.predict_proba(model_input)[0][
            list(trained_model.classes_).index(expected_class)
        ]

        result = predict_risk(features)

        self.assertEqual(result["risk_level"], expected_class)
        self.assertEqual(result["probability"], round(expected_probability, 3))

    @patch("app.ml.predict.model")
    def test_uses_one_probability_pass_and_returns_matching_prediction(
        self,
        model: Mock,
    ) -> None:
        model.classes_ = ["low", "moderate", "high", "critical"]
        model.predict_proba.return_value = [[0.1, 0.2, 0.6, 0.1]]

        result = predict_risk(
            {
                "rainfall_24h": 12,
                "soil_moisture": 42,
                "slope": 20,
                "elevation": 1000,
                "ndvi": 0.5,
                "historical_events": 2,
            }
        )

        model.predict_proba.assert_called_once()
        model.predict.assert_not_called()
        self.assertEqual(result["risk_level"], "high")
        self.assertEqual(result["probability"], 0.6)
        self.assertEqual(
            result["probabilities"],
            {
                "low": 0.1,
                "moderate": 0.2,
                "high": 0.6,
                "critical": 0.1,
            },
        )
        self.assertEqual(list(model.predict_proba.call_args.args[0].columns), FEATURES)

    @patch("app.ml.predict.model")
    def test_probability_tie_preserves_first_class_order(self, model: Mock) -> None:
        model.classes_ = ["low", "moderate", "high", "critical"]
        model.predict_proba.return_value = [[0.4, 0.4, 0.1, 0.1]]

        result = predict_risk(
            {
                "rainfall_24h": 12,
                "soil_moisture": 42,
                "slope": 20,
                "elevation": 1000,
                "ndvi": 0.5,
                "historical_events": 2,
            }
        )

        self.assertEqual(result["risk_level"], "low")
