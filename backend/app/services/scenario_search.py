import math

from ..ml.predict import predict_risk


# Search one feature at a time across the What-If form's supported ranges.
# Historical events remain fixed at the prepared baseline.
SEARCH_BOUNDS = {
    "rainfall_24h": {"min": 0.0, "max": 1000.0, "step": 50.0},
    "soil_moisture": {"min": 0.0, "max": 100.0, "step": 5.0},
    "slope": {"min": 0.0, "max": 90.0, "step": 10.0},
    "elevation": {"min": 0.0, "max": 9000.0, "step": 500.0},
    "ndvi": {"min": -1.0, "max": 1.0, "step": 0.1},
}
RISK_CLASS_ORDER = ("low", "moderate", "high", "critical")
MAX_CANDIDATE_EVALUATIONS = 100


def _risk_rank(risk_level: str) -> int:
    normalized = risk_level.strip().lower()
    try:
        return RISK_CLASS_ORDER.index(normalized)
    except ValueError as exc:
        raise ValueError(f"Unsupported risk class: {risk_level}") from exc


def _candidate_values(feature: str, baseline_value: float) -> list[float]:
    bounds = SEARCH_BOUNDS[feature]
    if not isinstance(baseline_value, (int, float)) or not math.isfinite(baseline_value):
        raise ValueError(f"Baseline feature '{feature}' must be finite and numeric")
    if not bounds["min"] <= baseline_value <= bounds["max"]:
        raise ValueError(
            f"Baseline feature '{feature}' must be between "
            f"{bounds['min']} and {bounds['max']}"
        )

    steps = int(round((bounds["max"] - bounds["min"]) / bounds["step"]))
    values = [
        round(bounds["min"] + index * bounds["step"], 10)
        for index in range(steps + 1)
    ]
    return [
        value
        for value in values
        if not math.isclose(value, baseline_value, rel_tol=0, abs_tol=1e-9)
    ]


def search_higher_risk_scenarios(
    baseline_features: dict,
    selected_features: list[str],
    target_class: str,
) -> dict:
    if not selected_features:
        raise ValueError("Select at least one feature to search")
    if len(selected_features) != len(set(selected_features)):
        raise ValueError("Selected search features must be unique")
    unsupported_features = set(selected_features) - set(SEARCH_BOUNDS)
    if unsupported_features:
        raise ValueError(
            "Unsupported search feature(s): "
            + ", ".join(sorted(unsupported_features))
        )

    baseline_prediction = predict_risk(baseline_features)
    baseline_rank = _risk_rank(baseline_prediction["risk_level"])
    target_rank = _risk_rank(target_class)
    normalized_target_class = RISK_CLASS_ORDER[target_rank]
    if normalized_target_class == "low":
        raise ValueError("Low is not a supported search target")
    if target_rank <= baseline_rank:
        return {
            "baseline": baseline_features,
            "baseline_prediction": baseline_prediction,
            "target_class": normalized_target_class,
            "scenario": None,
            "target_is_higher": False,
            "evaluated_candidates": 0,
            "candidate_limit": MAX_CANDIDATE_EVALUATIONS,
            "search_bounds": {
                feature: dict(SEARCH_BOUNDS[feature])
                for feature in SEARCH_BOUNDS
                if feature in selected_features
            },
        }

    candidates = [
        (feature, value)
        for feature in SEARCH_BOUNDS
        if feature in selected_features
        for value in _candidate_values(feature, baseline_features[feature])
    ]

    best_scenario = None
    evaluated_candidates = 0
    for feature, value in candidates:
        if evaluated_candidates >= MAX_CANDIDATE_EVALUATIONS:
            break
        scenario_features = {**baseline_features, feature: value}
        prediction = predict_risk(scenario_features)
        evaluated_candidates += 1
        candidate_class = RISK_CLASS_ORDER[_risk_rank(prediction["risk_level"])]
        if candidate_class != normalized_target_class:
            continue
        candidate_scenario = {
            "changed_feature": feature,
            "features": scenario_features,
            "prediction": prediction,
        }
        if (
            best_scenario is None
            or prediction["probability"] > best_scenario["prediction"]["probability"]
        ):
            best_scenario = candidate_scenario

    return {
        "baseline": baseline_features,
        "baseline_prediction": baseline_prediction,
        "target_class": normalized_target_class,
        "scenario": best_scenario,
        "target_is_higher": True,
        "evaluated_candidates": evaluated_candidates,
        "candidate_limit": MAX_CANDIDATE_EVALUATIONS,
        "search_bounds": {
            feature: dict(SEARCH_BOUNDS[feature])
            for feature in SEARCH_BOUNDS
            if feature in selected_features
        },
    }
