import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { LogService } from './log.service';
import { FindAllLogsDto, GetLogsRequestDto } from './dto';

@Controller('log')
export class LogController {
    constructor(private readonly logService: LogService) {}

    @Get('all')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    async getAll(@Query() query: GetLogsRequestDto): Promise<FindAllLogsDto> {
        return await this.logService.getAll(query);
    }

}