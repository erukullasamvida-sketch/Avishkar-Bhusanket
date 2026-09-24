import requests


def get_weather(
    latitude: float,
    longitude: float
):

    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "precipitation,rain,soil_moisture_0_to_7cm,temperature_2m,relative_humidity_2m",
        "forecast_days": 1,
        "timezone": "Asia/Kolkata"
    }

    response = requests.get(
        url,
        params=params,
        timeout=10
    )

    response.raise_for_status()

    return response.json()

def parse_environmental_data(data: dict):
    hourly = data["hourly"]

    return {
        "time": hourly["time"],
        "precipitation": hourly["precipitation"],
        "soil_moisture": hourly["soil_moisture_0_to_7cm"],
        "temperature": hourly["temperature_2m"],
        "humidity": hourly["relative_humidity_2m"],
    }