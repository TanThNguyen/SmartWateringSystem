import { Controller, Post, Body, Patch, Param, ParseUUIDPipe, Get, Delete, HttpCode, HttpStatus, Put, Query } from "@nestjs/common";
import { ScheduleService } from "./schedule.service";
import { Schedule } from "@prisma/client";
import { CreateScheduleDto, FindAllSchedulesDto, GetSchedulesRequestDto } from "./dto";

@Controller("schedule")
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) { }

  @Post()
  async create(@Body() createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    return this.scheduleService.create(createScheduleDto);
  }

  @Put()
  async toggleIsActive(@Body() body: { scheduleId: string }): Promise<Schedule> {
    return this.scheduleService.toggleIsActive(body.scheduleId);
  }

  @Get()
  async findAll(@Query() query: GetSchedulesRequestDto): Promise<FindAllSchedulesDto> {
      return this.scheduleService.findAll(query);
  }
  

  @Get('findOne')
  async findOne(@Query() query: { scheduleId: string }): Promise<Schedule> {
    return this.scheduleService.findOne(query.scheduleId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async remove(@Body() body: { scheduleId: string }): Promise<Schedule> {
    return this.scheduleService.remove(body.scheduleId);
  }



  @Post('check-now')
  @HttpCode(HttpStatus.NO_CONTENT)
  async triggerCheck() {
    await this.scheduleService.checkSchedulesAndApplyStatus();
  }
}