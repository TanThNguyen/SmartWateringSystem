import { Controller, Get, Logger, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiAssistantService, AiCircuitOpenError } from './ai-assistant.service'; 
import { Public } from 'src/auth/decorator';
import { AiDecisionRequestDto } from './dto';

@Controller('ai-assistant')
export class AiAssistantController {
    private readonly logger = new Logger(AiAssistantController.name);

    constructor(private readonly aiAssistantService: AiAssistantService) {}

    @Get('test-health')
    @Public() 
    @HttpCode(HttpStatus.OK) 
    async testAiServiceHealth() {
        this.logger.log('Nhận yêu cầu kiểm tra tình trạng dịch vụ AI...');
        try {
            const result = await this.aiAssistantService.checkAiServiceHealth();
            this.logger.log('Kiểm tra tình trạng dịch vụ AI thành công.');
            return {
                thongBao: 'Kiểm tra tình trạng dịch vụ AI thành công!',
                phanHoiTuAI: result,
            };
        } catch (error) {
            this.logger.error(`Kiểm tra tình trạng dịch vụ AI thất bại: ${error.message}`);
            throw error;
        }
    }

    @Post('test-decision') 
    @Public()
    @HttpCode(HttpStatus.OK)
    async testAiDecision(@Body() decisionRequestDto: AiDecisionRequestDto) {
        this.logger.debug(`Dữ liệu nhận được: ${JSON.stringify(decisionRequestDto)}`);

        try {
            const result = await this.aiAssistantService.getAiDecision(decisionRequestDto);
            return {
                thongBao: 'Lấy quyết định từ AI thành công!',
                quyetDinhAI: result,
            };
        } catch (error) {
            if (error instanceof AiCircuitOpenError) {
                this.logger.warn(`Lỗi lấy quyết định AI: Mạch đang mở (Circuit Open). Thông báo lỗi gốc: ${error.message}`);
                throw error;
            } else {
                this.logger.error(`Lỗi khi lấy quyết định AI: ${error.message}`, error.stack);
                throw error;
            }
        }
    }
}