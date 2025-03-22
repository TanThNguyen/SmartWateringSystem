import { Injectable, OnModuleInit } from "@nestjs/common";
import { scheduleQueue } from "../helper/bull.config";
// import * as moment from "moment-timezone";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ScheduleService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    console.log("🔄 Checking schedules and enqueueing jobs...");
    await this.enqueueAllSchedules();
  }

  async enqueueAllSchedules() {
    const schedules = await this.prisma.schedule.findMany({
      where: { isActive: true },
    });

    for (const schedule of schedules) {
      await this.scheduleJob(schedule);
    }
  }

  async scheduleJob(schedule: any) {
    const { deviceId, startTime, endTime } = schedule;
    
    // Chuyển thời gian sang timestamp UTC
    // const startTimestamp = moment(startTime).unix();
    // const endTimestamp = moment(endTime).unix();
    // const nowTimestamp = moment().unix();

    // if (startTimestamp > nowTimestamp) {
    //   await scheduleQueue.add(
    //     `start-${deviceId}`,
    //     { deviceId, action: "turn_on" },
    //     { delay: (startTimestamp - nowTimestamp) * 1000 }
    //   );
    //   console.log(`✅ Scheduled start job for ${deviceId} at ${startTime}`);
    // }

    // if (endTimestamp > nowTimestamp) {
    //   await scheduleQueue.add(
    //     `stop-${deviceId}`,
    //     { deviceId, action: "turn_off" },
    //     { delay: (endTimestamp - nowTimestamp) * 1000 }
    //   );
    //   console.log(`✅ Scheduled stop job for ${deviceId} at ${endTime}`);
    // }
  }
}
