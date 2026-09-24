FEATURE_NAMES = [
    "Rainfall",
    "Soil Moisture",
    "Slope",
    "Elevation",
    "Vegetation",
    "Historical Landslides"
]


def get_feature_importance(model):

    importances = model.feature_importances_

    total = sum(importances)

    result = []

    for name, value in zip(
        FEATURE_NAMES,
        importances
    ):

        percentage = (
            value / total
        ) * 100

        result.append({
            "name": name,
            "importance": round(
                percentage,
                2
            )
        })

    return sorted(
        result,
        key=lambda x: x["importance"],
        reverse=True
    )