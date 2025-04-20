import os
import logging
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from typing import Optional

from .rule_engine import (
    check_urgent_conditions,
    check_normal_fan_conditions,
    make_normal_pump_decision_rules,
    ACTION_PUMP_ON, ACTION_FAN_ON, ACTION_NONE, ACTION_PUMP_OFF, ACTION_FAN_OFF,
    URGENCY_NORMAL, URGENCY_URGENT,
    DEFAULT_PUMP_DURATION_S, DEFAULT_FAN_DURATION_S
)
from .models import DecisionRequest, SensorData, ConfigurationData, DecisionResponse, CombinedDecisionResponse

APP_PORT = int(os.getenv('PORT', 8001))

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ml_model = None
scaler = None

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, '..', 'models_trained')
MODEL_PATH = os.path.join(MODEL_DIR, 'pump_random_forest.joblib')
SCALER_PATH = os.path.join(MODEL_DIR, 'pump_scaler.joblib')


async def load_model_on_startup():
    global ml_model, scaler
    logger.info("--- Starting model and scaler loading ---")
    try:
        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
            logger.info(f"Scaler loaded from: {SCALER_PATH}")
        else:
            logger.error(f"ERROR: Scaler file not found at {SCALER_PATH}.")
            scaler = None

        if scaler and os.path.exists(MODEL_PATH):
            ml_model = joblib.load(MODEL_PATH)
            logger.info(f"ML Model loaded from: {MODEL_PATH}")
        elif scaler:
            logger.error(f"ERROR: Model file not found at {MODEL_PATH}.")
            ml_model = None
        else:
            ml_model = None

    except Exception as e:
        logger.exception(f"Critical error loading model or scaler: {e}")
        ml_model = None
        scaler = None

    if ml_model and scaler:
        logger.info("--- Model and scaler are ready ---")
    else:
        logger.warning("--- ML Model or scaler not available. Using Rule Engine as fallback for pump. ---")


app = FastAPI(
    title="Smart Garden AI Decision Service",
    description="API for making watering and fan decisions (ML optional).",
    version="0.4.0",
    on_startup=[load_model_on_startup]
)


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Smart Garden AI Decision Service!"}

@app.get("/health", tags=["Health Check"])
async def health_check():
    model_status = "loaded" if ml_model and scaler else "not loaded (using rules for pump)"
    logger.info("Health check endpoint called.")
    return {"status": "run", "port": APP_PORT, "ml_model_status": model_status}


@app.post("/decide", response_model=CombinedDecisionResponse, tags=["Decision Making"])
async def decide_action(request: DecisionRequest):
    context_id = request.locationId
    logger.info(f"--- Received decision request for context: {context_id} ---")
    logger.debug(f"Received sensor data: {request.sensorData}")
    logger.debug(f"Received configuration: {request.configuration}")

    pump_decision = DecisionResponse(action=ACTION_PUMP_OFF, duration=0, urgency=URGENCY_NORMAL)
    fan_decision = DecisionResponse(action=ACTION_FAN_OFF, duration=0, urgency=URGENCY_NORMAL)

    try:
        urgent_decision_result = check_urgent_conditions(
            request.sensorData, request.configuration)

        urgent_pump = None
        urgent_fan = None
        if urgent_decision_result:
            logger.info(f"Urgent condition detected: {urgent_decision_result}")
            if urgent_decision_result.action == ACTION_PUMP_ON:
                urgent_pump = urgent_decision_result
            elif urgent_decision_result.action == ACTION_FAN_ON:
                urgent_fan = urgent_decision_result

        # --- Determine PUMP action ---
        if urgent_pump:
            pump_decision = urgent_pump
            logger.info(f"==> PUMP decision (URGENT): {pump_decision}")
        else:
            logger.info("No urgent pump condition, checking normal...")
            pump_decided_by_ml = False
            if ml_model and scaler:
                logger.info("Attempting pump prediction with ML model...")
                try:
                    sensor_dict = request.sensorData.model_dump()
                    soil_moisture = sensor_dict['soilMoisture']
                    temperature = sensor_dict['temperature']
                    humidity = sensor_dict['humidity']

                    soil_moisture_processed = soil_moisture
                    features_array = np.array(
                        [[soil_moisture_processed, temperature, humidity]])
                    features_scaled = scaler.transform(features_array)

                    prediction = ml_model.predict(features_scaled)
                    pump_action_ml = prediction[0]

                    if pump_action_ml == 1:
                        logger.info(f"ML model predicts: PUMP ON")
                        # Safely get pumpDuration from config, fallback to default
                        pump_duration_config = getattr(request.configuration, 'pumpDuration', DEFAULT_PUMP_DURATION_S)
                        pump_decision = DecisionResponse(
                            action=ACTION_PUMP_ON,
                            duration=pump_duration_config,
                            urgency=URGENCY_NORMAL
                        )
                        pump_decided_by_ml = True
                    else:
                        logger.info(f"ML model predicts: PUMP OFF. Will check rules if necessary.")

                except Exception as ml_err:
                    logger.error(
                        f"Error during ML pump prediction: {ml_err}. Falling back to rule engine.")

            if not pump_decided_by_ml:
                if not (ml_model and scaler):
                     logger.warning("ML Model not available. Using rule engine for pump.")
                logger.info("Checking pump with Rule Engine...")
                pump_rule_decision = make_normal_pump_decision_rules(
                    request.sensorData, request.configuration)
                if pump_rule_decision.action == ACTION_PUMP_ON:
                    logger.info(f"==> PUMP decision (Rule): {pump_rule_decision}")
                    pump_decision = pump_rule_decision
                else:
                    logger.info(f"Pump decision (Rule): PUMP OFF")


        # --- Determine FAN action ---
        if urgent_fan:
            fan_decision = urgent_fan
            logger.info(f"==> FAN decision (URGENT): {fan_decision}")
        else:
            logger.info("No urgent fan condition, checking normal with Rule Engine...")
            fan_rule_decision = check_normal_fan_conditions(
                request.sensorData, request.configuration)
            if fan_rule_decision:
                logger.info(f"==> FAN decision (Rule): {fan_rule_decision}")
                fan_decision = fan_rule_decision
            else:
                logger.info(f"Fan decision (Rule): FAN OFF")


        # --- Create combined response ---
        final_response = CombinedDecisionResponse(
            pump_action=pump_decision.action,
            pump_duration=pump_decision.duration,
            pump_urgency=pump_decision.urgency,
            fan_action=fan_decision.action,
            fan_duration=fan_decision.duration,
            fan_urgency=fan_decision.urgency,
        )

        logger.info(f"==> FINAL decision for context {context_id}: {final_response}")
        return final_response

    except Exception as e:
        logger.exception(
            f"!!! Critical error processing decision for context {context_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error processing decision for context {context_id}: {str(e)}"
        )