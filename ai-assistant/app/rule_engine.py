# ai-assistant/app/rule_engine.py
from typing import Optional
from .models import SensorData, ConfigurationData, DecisionResponse

ACTION_PUMP_ON = "PUMP_ON"
ACTION_FAN_ON = "FAN_ON"
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
        print(f"Logic (GẤP): Độ ẩm đất ({soil_moisture}% < {CRITICAL_SOIL_MOISTURE}%) -> Bật bơm")
        return DecisionResponse(action=ACTION_PUMP_ON, duration=URGENT_PUMP_DURATION_S, urgency=URGENCY_URGENT)

    if temperature > CRITICAL_TEMPERATURE or humidity > CRITICAL_HUMIDITY:
        print(f"Logic (GẤP): Nhiệt độ ({temperature}°C > {CRITICAL_TEMPERATURE}°C) hoặc Độ ẩm ({humidity}% > {CRITICAL_HUMIDITY}%) -> Bật quạt")
        return DecisionResponse(action=ACTION_FAN_ON, duration=URGENT_FAN_DURATION_S, urgency=URGENCY_URGENT)
    return None

def make_normal_decision(sensor_data: SensorData, config: ConfigurationData) -> DecisionResponse:
    soil_moisture = sensor_data.soilMoisture
    temperature = sensor_data.temperature
    humidity = sensor_data.humidity

    moisture_threshold = config.moistureThreshold
    temp_max = config.tempMax
    humidity_max = config.humidityMax

    temp_safety_margin = 2

    if temperature > temp_max or humidity > humidity_max:
        print(f"Logic (Bình thường): Nhiệt độ ({temperature}°C > {temp_max}°C) hoặc Độ ẩm ({humidity}% > {humidity_max}%) -> Bật quạt")
        return DecisionResponse(action=ACTION_FAN_ON, duration=DEFAULT_FAN_DURATION_S, urgency=URGENCY_NORMAL)

    if soil_moisture < moisture_threshold and temperature < (temp_max - temp_safety_margin):
        print(f"Logic (Bình thường): Độ ẩm đất ({soil_moisture}% < {moisture_threshold}%) và Nhiệt độ an toàn ({temperature}°C < {temp_max - temp_safety_margin}°C) -> Bật bơm")
        return DecisionResponse(action=ACTION_PUMP_ON, duration=DEFAULT_PUMP_DURATION_S, urgency=URGENCY_NORMAL)

    print("Logic: Các điều kiện đều ổn -> Không hành động")
    return DecisionResponse(action=ACTION_NONE, duration=0, urgency=URGENCY_NORMAL)