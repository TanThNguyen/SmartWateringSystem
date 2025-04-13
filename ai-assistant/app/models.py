from pydantic import BaseModel, Field
from typing import Optional

class SensorData(BaseModel):
    soilMoisture: float = Field(...)
    temperature: float = Field(...)
    humidity: float = Field(...)

class ConfigurationData(BaseModel):
    moistureThreshold: float = Field(...)
    tempMin: Optional[float] = Field(None)
    tempMax: float = Field(...)
    humidityMax: float = Field(...)

class DecisionRequest(BaseModel):
    locationId: str = Field(...)
    sensorData: SensorData = Field(...)
    configuration: ConfigurationData = Field(...)

class DecisionResponse(BaseModel):
    action: str = Field(...)
    duration: int = Field(...)
    urgency: str = Field(...) 