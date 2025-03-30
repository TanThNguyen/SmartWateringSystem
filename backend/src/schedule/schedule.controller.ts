import { Controller, Post, Body, Patch, Param, ParseUUIDPipe, Get, Delete, HttpCode, HttpStatus } from "@nestjs/common";
import { ScheduleService } from "./schedule.service";
import { Schedule } from "@prisma/client"; // Import Schedule type
import { CreateScheduleDto } from "./dto";

@Controller("schedule")
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  async create(@Body() createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    // DTO sẽ tự động validate dữ liệu đầu vào nhờ ValidationPipe global hoặc cục bộ
    return this.scheduleService.create(createScheduleDto);
  }

  @Patch(':id/toggle')
  async toggleIsActive(
    @Param('id', ParseUUIDPipe) scheduleId: string
  ): Promise<Schedule> {
    return this.scheduleService.toggleIsActive(scheduleId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) scheduleId: string): Promise<Schedule> {
    return this.scheduleService.findOne(scheduleId);
  }

  @Get()
  async findAll(): Promise<Schedule[]> {
    return this.scheduleService.findAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK) // Trả về 200 OK thay vì 204 No Content mặc định của Delete nếu muốn trả về object đã xóa
  async remove(@Param('id', ParseUUIDPipe) scheduleId: string): Promise<Schedule> {
      return this.scheduleService.remove(scheduleId);
  }

  // (Optional) Endpoint để trigger kiểm tra thủ công (dùng để debug)
  @Post('check-now')
  @HttpCode(HttpStatus.NO_CONTENT)
  async triggerCheck() {
    await this.scheduleService.checkSchedulesAndApplyStatus();
  }
}