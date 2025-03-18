import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LogService } from './log.service';
import { CreateLogDto, FindAllLogsDto, GetLogsRequestDto } from './dto';

@Controller('log')
export class LogController {
    constructor(private readonly logService: LogService) { }

    @Get('all')
    async getAll(@Query() query: GetLogsRequestDto): Promise<FindAllLogsDto> {
        return await this.logService.getAll(query);
    }

    @Post('add')
    async addLog(@Body() logDto: CreateLogDto): Promise<String> {
        console.log(logDto);
        return await this.logService.create(logDto);
    }
}
