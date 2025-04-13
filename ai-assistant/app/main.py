import os
import logging
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from typing import Optional

# --- Imports từ các module cục bộ ---
from .rule_engine import (
    check_urgent_conditions,
    check_normal_fan_conditions,
    make_normal_pump_decision_rules,
    ACTION_PUMP_ON, ACTION_FAN_ON, ACTION_NONE,
    URGENCY_NORMAL, URGENCY_URGENT,
    DEFAULT_PUMP_DURATION_S, DEFAULT_FAN_DURATION_S
)
from .models import DecisionRequest, DecisionResponse, SensorData, ConfigurationData

APP_PORT = int(os.getenv('PORT', 8001))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ml_model = None
scaler = None

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, '..', 'models_trained')
MODEL_PATH = os.path.join(MODEL_DIR, 'pump_random_forest.joblib') # Hoặc pump_logistic_regression.joblib
SCALER_PATH = os.path.join(MODEL_DIR, 'pump_scaler.joblib')

async def load_model_on_startup():
    global ml_model, scaler
    logger.info("--- Bắt đầu tải mô hình và scaler ---")
    try:
        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
            logger.info(f"Scaler đã được tải từ: {SCALER_PATH}")
        else:
            logger.error(f"LỖI: Không tìm thấy file scaler tại {SCALER_PATH}.")
            scaler = None

        if scaler and os.path.exists(MODEL_PATH):
             ml_model = joblib.load(MODEL_PATH)
             logger.info(f"Mô hình ML đã được tải từ: {MODEL_PATH}")
        elif scaler:
             logger.error(f"LỖI: Không tìm thấy file mô hình tại {MODEL_PATH}.")
             ml_model = None
        else:
             ml_model = None

    except Exception as e:
        logger.exception(f"Lỗi nghiêm trọng khi tải mô hình hoặc scaler: {e}")
        ml_model = None
        scaler = None

    if ml_model and scaler:
        logger.info("--- Mô hình và scaler đã sẵn sàng ---")
    else:
        logger.warning("--- Mô hình ML hoặc scaler không khả dụng. Sử dụng Rule Engine làm fallback. ---")


app = FastAPI(
    title="Smart Garden AI Decision Service",
    description="API để đưa ra quyết định tưới nước hoặc bật quạt (có thể sử dụng ML).",
    version="0.3.0",
    on_startup=[load_model_on_startup]
)

@app.get("/health", tags=["Health Check"])
async def health_check():
    model_status = "loaded" if ml_model and scaler else "not loaded (using rules)"
    logger.info("Health check endpoint called.")
    return {"status": "ok", "port": APP_PORT, "ml_model_status": model_status}

@app.post("/decide", response_model=DecisionResponse, tags=["Decision Making"])
async def decide_action(request: DecisionRequest):
    context_id = request.locationId
    logger.info(f"--- Nhận yêu cầu quyết định cho context: {context_id} ---")
    logger.debug(f"Dữ liệu cảm biến nhận được: {request.sensorData}")
    logger.debug(f"Cấu hình nhận được: {request.configuration}")

    try:
        # --- 1. Kiểm tra điều kiện khẩn cấp ---
        urgent_decision = check_urgent_conditions(request.sensorData, request.configuration)
        if urgent_decision:
            logger.info(f"==> Quyết định GẤP được đưa ra cho context {context_id}: {urgent_decision}")
            return urgent_decision

        logger.info(f"Không có điều kiện gấp, thực hiện kiểm tra bình thường cho context {context_id}...")
        final_decision = None

        # --- 2. Ưu tiên sử dụng Model ML cho BƠM ---
        if ml_model and scaler:
            logger.info("Thử dự đoán bơm bằng mô hình ML...")
            try:
                sensor_dict = request.sensorData.dict()
                soil_moisture = sensor_dict['soilMoisture']
                temperature = sensor_dict['temperature']
                humidity = sensor_dict['airHumidity']

                soil_moisture_processed = soil_moisture / 10.0
                features_array = np.array([[soil_moisture_processed, temperature, humidity]])
                features_scaled = scaler.transform(features_array)

                prediction = ml_model.predict(features_scaled)
                pump_action_ml = prediction[0]

                if pump_action_ml == 1:
                    logger.info(f"Mô hình ML dự đoán: BẬT BƠM")
                    final_decision = DecisionResponse(
                        action=ACTION_PUMP_ON,
                        duration=DEFAULT_PUMP_DURATION_S,
                        urgency=URGENCY_NORMAL
                    )
                else:
                    logger.info(f"Mô hình ML dự đoán: TẮT BƠM. Tiếp tục kiểm tra quạt/bơm bằng rule...")

            except Exception as ml_err:
                logger.error(f"Lỗi khi dự đoán bằng ML: {ml_err}. Sử dụng rule engine làm fallback.")
        else:
            logger.warning("Mô hình ML không khả dụng. Sử dụng rule engine.")

        # --- 3. Nếu ML không quyết định bật bơm (hoặc không chạy) -> Kiểm tra Rules ---
        if final_decision is None:
            # --- 3a. Kiểm tra QUẠT bằng Rules ---
            fan_decision = check_normal_fan_conditions(request.sensorData, request.configuration)
            if fan_decision:
                logger.info(f"==> Quyết định QUẠT (Rule) được đưa ra: {fan_decision}")
                final_decision = fan_decision
            else:
                # --- 3b. Kiểm tra BƠM bằng Rules (Fallback) ---
                logger.info("Kiểm tra bơm bằng Rule Engine (fallback)...")
                pump_rule_decision = make_normal_pump_decision_rules(request.sensorData, request.configuration)
                if pump_rule_decision.action == ACTION_PUMP_ON:
                     logger.info(f"==> Quyết định BƠM (Rule) được đưa ra: {pump_rule_decision}")
                     final_decision = pump_rule_decision
                else:
                     logger.info(f"==> Không hành động nào cần thiết (Rule/ML).")
                     final_decision = DecisionResponse(action=ACTION_NONE, duration=0, urgency=URGENCY_NORMAL)

        logger.info(f"==> Quyết định CUỐI CÙNG được đưa ra cho context {context_id}: {final_decision}")
        return final_decision

    except Exception as e:
        logger.exception(f"!!! Lỗi nghiêm trọng khi xử lý quyết định cho context {context_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi máy chủ nội bộ khi xử lý quyết định cho context {context_id}: {e}"
        )