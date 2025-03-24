import { Controller, Post, Body } from "@nestjs/common";
import { ScheduleService } from "./schedule.service";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("schedule")
export class ScheduleController {
  constructor(private readonly prisma: PrismaService, private readonly scheduleService: ScheduleService) {}

  @Post("create")
  async createSchedule(@Body() body: any) {
    const { deviceId, startTime, endTime } = body;

    const schedule = await this.prisma.schedule.create({
      data: { deviceId, startTime, endTime },
    });

    // Lên lịch ngay sau khi tạo
    await this.scheduleService.scheduleJob(schedule);
    
    return { message: "Schedule created and job enqueued!", schedule };
  }
}
