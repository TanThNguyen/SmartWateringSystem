import { AiAction, AiDecisionRequestDto, AiDecisionResponseDto, AiUrgency } from "../dto"; // Import thêm AiUrgency nếu cần dùng ở nơi khác

export interface AiDecisionContext {
    request: AiDecisionRequestDto;
}

export interface AiDecisionSuccessPayload extends AiDecisionContext {
    response: AiDecisionResponseDto; 
}

export interface AiCircuitOpenPayload extends AiDecisionContext {
}

export interface AiDecisionFailurePayload extends AiDecisionContext {
    error: Error;
}

export const AI_DECISION_SUCCESS_EVENT = 'ai.decision.success';
export const AI_DECISION_CIRCUIT_OPEN_EVENT = 'ai.decision.circuit_open';
export const AI_DECISION_FAILURE_EVENT = 'ai.decision.failure';