from fastapi import APIRouter

router = APIRouter(
    prefix="/api/sensors",
    tags=["Sensors"]
)


@router.get("")
def get_sensors():

    return [
        {
            "name": "Weather Station",
            "type": "Weather",
            "status": "CONNECTED"
        },
        {
            "name": "Soil Moisture Sensor",
            "type": "Soil Moisture",
            "status": "CONNECTED"
        },
        {
            "name": "Satellite Feed",
            "type": "Satellite",
            "status": "CONNECTED"
        },
        {
            "name": "Terrain DEM",
            "type": "Terrain",
            "status": "AVAILABLE"
        }
    ]