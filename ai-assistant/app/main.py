from fastapi import FastAPI, HTTPException
from .models import DecisionRequest, DecisionResponse, SensorData, ConfigurationData
from .rule_engine import check_urgent_conditions, make_normal_decision
import os
import logging

APP_PORT = int(os.getenv('PORT', 8001))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Smart Garden AI Decision Service",
    description="API để đưa ra quyết định tưới nước hoặc bật quạt.",
    version="0.2.0",
)

@app.get("/health", tags=["Health Check"])
async def health_check():
    logger.info("Health check endpoint called.")
    return {"status": "ok", "port": APP_PORT}

@app.post("/decide", response_model=DecisionResponse, tags=["Decision Making"])
async def decide_action(request: DecisionRequest):
    context_id = request.locationId
    logger.info(f"--- Nhận yêu cầu quyết định cho context: {context_id} ---")
    logger.debug(f"Dữ liệu cảm biến nhận được: {request.sensorData}")
    logger.debug(f"Cấu hình nhận được: {request.configuration}")

    try:
        urgent_decision = check_urgent_conditions(request.sensorData, request.configuration)

        if urgent_decision:
            logger.info(f"==> Quyết định GẤP được đưa ra cho context {context_id}: {urgent_decision}")
            return urgent_decision
        else:
            logger.info(f"Không có điều kiện gấp, thực hiện kiểm tra bình thường cho context {context_id}...")
            normal_decision = make_normal_decision(request.sensorData, request.configuration)
            logger.info(f"==> Quyết định BÌNH THƯỜNG được đưa ra cho context {context_id}: {normal_decision}")
            return normal_decision

    except Exception as e:
        logger.exception(f"!!! Lỗi nghiêm trọng khi xử lý quyết định cho context {context_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi máy chủ nội bộ khi xử lý quyết định cho context {context_id}: {e}"
        )