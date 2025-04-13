import { Controller, Post, Body, Logger, HttpCode, HttpStatus, ValidationPipe, UsePipes } from '@nestjs/common';
import { DecisionService, LatestSensorState } from './decision.service';
import { Public } from 'src/auth/decorator';
import { IsString, IsNotEmpty, ValidateNested, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer'; 

class TestDecisionStateDto implements LatestSensorState {
    @IsOptional()
    @IsNumber()
    soilMoisture?: number;

    @IsOptional()
    @IsNumber()
    temperature?: number;

    @IsOptional()
    @IsNumber()
    humidity?: number;

    @IsOptional()
    @Type(() => Date) 
    lastUpdate?: Date;
}

class TestDecisionRequestDto {
    @IsString()
    @IsNotEmpty()
    locationId: string;

    @ValidateNested()
    @Type(() => TestDecisionStateDto)
    @IsNotEmpty()
    currentState: TestDecisionStateDto;
}

@Controller('decision')
export class DecisionController {
    private readonly logger = new Logger(DecisionController.name);

    constructor(private readonly decisionService: DecisionService) {}

    @Post('test-process-location')
    @Public()
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    async testProcessLocation(@Body() testRequest: TestDecisionRequestDto) {
        this.logger.log(`Nhận yêu cầu kiểm thử processLocation cho locationId: ${testRequest.locationId}`);
        this.logger.debug(`Dữ liệu state nhận được: ${JSON.stringify(testRequest.currentState)}`);

        try {
            await this.decisionService.processSensorDataForDecision(
                testRequest.locationId,
                testRequest.currentState
            );

            this.logger.log(`Thực thi processSensorDataForDecision cho locationId: ${testRequest.locationId} hoàn tất.`);

            return {
                thongBao: `Yêu cầu xử lý cho location ${testRequest.locationId} đã được thực thi. Kiểm tra log để xem chi tiết quyết định và hành động.`,
            };
        } catch (error) {
            this.logger.error(`Lỗi trong quá trình testProcessLocation cho ${testRequest.locationId}: ${error.message}`, error.stack);
            throw error;
        }
    }
}