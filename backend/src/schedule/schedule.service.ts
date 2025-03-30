import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma, Schedule, DeviceStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateScheduleDto } from "./dto";

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  private readonly localTimezone = "Asia/Ho_Chi_Minh";

  constructor(private readonly prisma: PrismaService) { }
  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const { deviceId, startTime, endTime, repeatDays, isActive } = createScheduleDto;
    const device = await this.prisma.device.findUnique({ where: { deviceId } });
    if (!device) throw new NotFoundException(`Không tìm thấy Device với ID: ${deviceId}`);

    const startTimeDate = dayjs(startTime); // Sử dụng dayjs để parse
    const endTimeDate = dayjs(endTime);

    // Sử dụng isBefore từ dayjs
    if (endTimeDate.isBefore(startTimeDate) || endTimeDate.isSame(startTimeDate)) {
      throw new BadRequestException('Thời gian kết thúc (endTime) phải sau thời gian bắt đầu (startTime).');
    }

    this.logger.log(`Tạo lịch trình cho Device ${deviceId}: ${startTimeDate.toISOString()} - ${endTimeDate.toISOString()}, repeat: ${repeatDays}`);
    return this.prisma.schedule.create({
      data: {
        deviceId,
        startTime: startTimeDate.toDate(),
        endTime: endTimeDate.toDate(),
        repeatDays,
        isActive,
      },
    });
  }

  async toggleIsActive(scheduleId: string): Promise<Schedule> {
    const schedule = await this.prisma.schedule.findUnique({ where: { scheduleId } });
    if (!schedule) throw new NotFoundException(`Không tìm thấy Schedule với ID: ${scheduleId}`);

    const updatedSchedule = await this.prisma.schedule.update({
      where: { scheduleId },
      data: { isActive: !schedule.isActive },
    });
    this.logger.log(`Schedule ${scheduleId} isActive toggled to ${updatedSchedule.isActive}`);
    this.checkSchedulesAndApplyStatus().catch(err => {
      this.logger.error(`Lỗi khi kiểm tra lịch trình sau khi toggle ${scheduleId}:`, err);
    });
    return updatedSchedule;
  }

  async findOne(scheduleId: string): Promise<Schedule> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { scheduleId },
      include: { device: true }
    });
    if (!schedule) throw new NotFoundException(`Không tìm thấy Schedule với ID: ${scheduleId}`);
    return schedule;
  }

  async findAll(): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      include: { device: true }
    });
  }

  async remove(scheduleId: string): Promise<Schedule> {
    const schedule = await this.prisma.schedule.findUnique({ where: { scheduleId } });
    if (!schedule) throw new NotFoundException(`Không tìm thấy Schedule với ID: ${scheduleId}`);

    const deletedSchedule = await this.prisma.schedule.delete({ where: { scheduleId } });
    this.checkSchedulesAndApplyStatus().catch(err => {
      this.logger.error(`Lỗi khi kiểm tra lịch trình sau khi xóa ${scheduleId}:`, err);
    });
    return deletedSchedule;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug(`Running scheduled check (${this.localTimezone})...`);
    try {
      await this.checkSchedulesAndApplyStatus();
    } catch (error) {
      this.logger.error('Lỗi không mong muốn trong quá trình kiểm tra lịch trình định kỳ:', error);
    }
  }

  async checkSchedulesAndApplyStatus(): Promise<void> {
    const now = dayjs().tz(this.localTimezone); 
    const deviceDesiredStatus = new Map<string, DeviceStatus>();
    const potentiallyFinishedOneTimeSchedules = new Map<string, string>();

    const activeSchedules = await this.prisma.schedule.findMany({
      where: { isActive: true },
    });

    if (activeSchedules.length === 0) {
      this.logger.debug('Không có lịch trình active nào.');
      return;
    }

    for (const schedule of activeSchedules) {
      let shouldBeActiveNow = false;
      const scheduleStartTime = dayjs(schedule.startTime);
      const scheduleEndTime = dayjs(schedule.endTime);

      if (schedule.repeatDays === 0) {
        if (now.isSameOrAfter(scheduleStartTime) && now.isBefore(scheduleEndTime)) {
          console.log("Vào rồi, tôi mệt");
          shouldBeActiveNow = true;
        } else if (now.isSameOrAfter(scheduleEndTime)) {
          potentiallyFinishedOneTimeSchedules.set(schedule.scheduleId, schedule.deviceId);
        }
      } else {
        const currentDayOfWeek = now.day();
        const isTodayScheduled = (schedule.repeatDays & (1 << currentDayOfWeek)) !== 0;

        if (isTodayScheduled) {
          const currentTimeMinutes = now.hour() * 60 + now.minute();
          const startTimeMinutes = scheduleStartTime.hour() * 60 + scheduleStartTime.minute();
          const endTimeMinutes = scheduleEndTime.hour() * 60 + scheduleEndTime.minute();
          this.logger.verbose(`Repeat Check: NowLocal=${currentTimeMinutes}, StartUTC=${startTimeMinutes}, EndUTC=${endTimeMinutes}`);

          if (startTimeMinutes <= endTimeMinutes) { 
            shouldBeActiveNow = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
          } else {
            shouldBeActiveNow = currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
          }
        }
      }

      if (shouldBeActiveNow) {
        deviceDesiredStatus.set(schedule.deviceId, DeviceStatus.ACTIVE);
      } else {
        if (!deviceDesiredStatus.has(schedule.deviceId)) {
          deviceDesiredStatus.set(schedule.deviceId, DeviceStatus.INACTIVE);
        }
      }
    } 

    const relevantDeviceIds = [...new Set(activeSchedules.map(s => s.deviceId))];
    const updatedDeviceStatuses = new Map<string, DeviceStatus>();

    if (relevantDeviceIds.length > 0) {
      const currentDevices = await this.prisma.device.findMany({
        where: { deviceId: { in: relevantDeviceIds } },
        select: { deviceId: true, status: true },
      });
      const initialDeviceStatuses = new Map(currentDevices.map(d => [d.deviceId, d.status]));
      const updates: Prisma.PrismaPromise<any>[] = [];

      for (const deviceId of relevantDeviceIds) {
        const desiredStatus = deviceDesiredStatus.get(deviceId) ?? DeviceStatus.INACTIVE;
        updatedDeviceStatuses.set(deviceId, desiredStatus);
        const currentStatus = initialDeviceStatuses.get(deviceId);

        if (currentStatus !== desiredStatus) {
          this.logger.log(`Updating Device ${deviceId} status: ${currentStatus} -> ${desiredStatus}`);
          updates.push(
            this.prisma.device.update({
              where: { deviceId: deviceId },
              data: { status: desiredStatus },
            })
          );
        }
      }

      if (updates.length > 0) {
        try {
          await this.prisma.$transaction(updates);
          this.logger.log(`Successfully updated status for ${updates.length} devices.`);
        } catch (error) {
          this.logger.error('Error updating device statuses:', error);
          potentiallyFinishedOneTimeSchedules.clear();
        }
      } else {
        currentDevices.forEach(d => updatedDeviceStatuses.set(d.deviceId, d.status));
        this.logger.debug('No device status changes required.');
      }
    } else {
      this.logger.debug('No devices related to active schedules.');
    }

    const schedulesToDeactivate: string[] = [];
    if (potentiallyFinishedOneTimeSchedules.size > 0) {
      for (const [scheduleId, deviceId] of potentiallyFinishedOneTimeSchedules.entries()) {
        if (updatedDeviceStatuses.get(deviceId) === DeviceStatus.INACTIVE) {
          schedulesToDeactivate.push(scheduleId);
        }
      }

      if (schedulesToDeactivate.length > 0) {
        this.logger.log(`Deactivating ${schedulesToDeactivate.length} completed one-time schedules...`);
        try {
          await this.prisma.schedule.updateMany({
            where: { scheduleId: { in: schedulesToDeactivate } },
            data: { isActive: false },
          });
        } catch (error) {
          this.logger.error('Error deactivating one-time schedules:', error);
        }
      }
    }
  }
}