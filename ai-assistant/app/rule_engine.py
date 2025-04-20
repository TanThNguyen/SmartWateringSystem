from typing import Optional
try:
    from .models import SensorData, ConfigurationData, DecisionResponse
except ImportError:
    from models import SensorData, ConfigurationData, DecisionResponse

ACTION_PUMP_ON = "PUMP_ON"
ACTION_FAN_ON = "FAN_ON"
ACTION_PUMP_OFF = "PUMP_OFF"
ACTION_FAN_OFF = "FAN_OFF"
ACTION_NONE = "NONE"

URGENCY_URGENT = "URGENT"
URGENCY_NORMAL = "NORMAL"

CRITICAL_SOIL_MOISTURE = 10
CRITICAL_TEMPERATURE = 40
CRITICAL_HUMIDITY = 95

URGENT_PUMP_DURATION_S = 600
URGENT_FAN_DURATION_S = 600
DEFAULT_PUMP_DURATION_S = 300
DEFAULT_FAN_DURATION_S = 300

def check_urgent_conditions(sensor_data: SensorData, config: ConfigurationData) -> Optional[DecisionResponse]:
    soil_moisture = sensor_data.soilMoisture
    temperature = sensor_data.temperature
    humidity = sensor_data.humidity

    if soil_moisture < CRITICAL_SOIL_MOISTURE:
        return DecisionResponse(action=ACTION_PUMP_ON, duration=URGENT_PUMP_DURATION_S, urgency=URGENCY_URGENT)

    if temperature > CRITICAL_TEMPERATURE or humidity > CRITICAL_HUMIDITY:
        return DecisionResponse(action=ACTION_FAN_ON, duration=URGENT_FAN_DURATION_S, urgency=URGENCY_URGENT)

    return None

def check_normal_fan_conditions(sensor_data: SensorData, config: ConfigurationData) -> Optional[DecisionResponse]:
    temperature = sensor_data.temperature
    humidity = sensor_data.humidity
    temp_max = config.tempMax
    humidity_max = config.humidityMax

    if temperature > temp_max or humidity > humidity_max:
        fan_duration_config = getattr(config, 'fanDuration', DEFAULT_FAN_DURATION_S)
        return DecisionResponse(action=ACTION_FAN_ON, duration=fan_duration_config, urgency=URGENCY_NORMAL)

    return None

def make_normal_pump_decision_rules(sensor_data: SensorData, config: ConfigurationData) -> DecisionResponse:
    soil_moisture = sensor_data.soilMoisture
    temperature = sensor_data.temperature
    moisture_threshold = config.moistureThreshold
    temp_max = config.tempMax
    temp_safety_margin = 2

    if soil_moisture < moisture_threshold and temperature < (temp_max - temp_safety_margin):
        pump_duration_config = getattr(config, 'pumpDuration', DEFAULT_PUMP_DURATION_S)
        return DecisionResponse(action=ACTION_PUMP_ON, duration=pump_duration_config, urgency=URGENCY_NORMAL)

    return DecisionResponse(action=ACTION_PUMP_OFF, duration=0, urgency=URGENCY_NORMAL)