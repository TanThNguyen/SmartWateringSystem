import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma, Schedule, DeviceStatus, DeviceType } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateScheduleDto, FindAllSchedulesDto, GetSchedulesRequestDto } from "./dto";

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { AdafruitService } from "src/adafruit/adafruit.service";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  private readonly localTimezone = "Asia/Ho_Chi_Minh";

  constructor(
    private readonly prisma: PrismaService,
    private adafruitService: AdafruitService,
  ) { }
  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    try {
      const { deviceId, startTime, endTime, repeatDays, isActive } = createScheduleDto;
      const device = await this.prisma.device.findUnique({ where: { deviceId } });
      if (!device) throw new NotFoundException(`Không tìm thấy Device với ID: ${deviceId}`);

      if (repeatDays < 0 || repeatDays > 127) {
        throw new BadRequestException('repeatDays phải nằm trong khoảng 0-127.');
      }

      if (device.type !== DeviceType.PUMP && device.type !== DeviceType.FAN) {
        throw new BadRequestException('Thiết bị không hợp lệ. Chỉ hỗ trợ PUMP hoặc FAN.');
      }

      const startTimeDate = dayjs(startTime);
      const endTimeDate = dayjs(endTime);

      if (endTimeDate.isBefore(startTimeDate) || endTimeDate.isSame(startTimeDate)) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu.');
      }

      if (endTimeDate.isBefore(dayjs())) {
        throw new BadRequestException('Thời gian kết thúc phải lớn hơn thời gian hiện tại.');
      }

      const existingSchedules = await this.prisma.schedule.findMany({
        where: {
          deviceId,
          isActive: true,
        }
      });


      for (const schedule of existingSchedules) {
        const existingRepeatDays = schedule.repeatDays;

        if (existingRepeatDays === 0 && repeatDays === 0) {
          if (startTimeDate.isSame(schedule.startTime, 'day')) {
            throw new ConflictException('Đã có lịch trình trùng vào ngày này.');
          }
        }
        else if (existingRepeatDays === 0 && repeatDays !== 0) {
          const existingDayOfWeek = dayjs(schedule.startTime).day();
          if ((repeatDays & (1 << existingDayOfWeek)) !== 0) {
            if (startTimeDate.hour() === dayjs(schedule.startTime).hour() &&
              startTimeDate.minute() === dayjs(schedule.startTime).minute()) {
              throw new ConflictException('Lịch trình mới trùng giờ với lịch trình đã có trong ngày lặp.');
            }
          }
        }
        else if (existingRepeatDays !== 0 && repeatDays === 0) {
          const newDayOfWeek = startTimeDate.day();
          if ((existingRepeatDays & (1 << newDayOfWeek)) !== 0) {
            if (startTimeDate.hour() === dayjs(schedule.startTime).hour() &&
              startTimeDate.minute() === dayjs(schedule.startTime).minute()) {
              throw new ConflictException('Lịch trình mới trùng giờ với lịch trình có ngày lặp.');
            }
          }
        }
        else {
          if ((existingRepeatDays & repeatDays) !== 0) {
            if (startTimeDate.hour() === dayjs(schedule.startTime).hour() &&
              startTimeDate.minute() === dayjs(schedule.startTime).minute()) {
              throw new ConflictException('Đã có lịch trình trùng giờ và trùng ngày lặp.');
            }
          }
        }
      }


      return this.prisma.schedule.create({
        data: {
          deviceId,
          startTime: startTimeDate.toDate(),
          endTime: endTimeDate.toDate(),
          repeatDays,
          isActive,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async createScheduleWithSimpleValidation(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    try {
      const { deviceId, startTime, endTime, repeatDays, isActive } = createScheduleDto;
      const device = await this.prisma.device.findUnique({ where: { deviceId } });
      if (!device) throw new NotFoundException(`Không tìm thấy Device với ID: ${deviceId}`);

      if (repeatDays < 0 || repeatDays > 127) {
        throw new BadRequestException('repeatDays phải nằm trong khoảng 0-127.');
      }

      if (device.type !== DeviceType.PUMP && device.type !== DeviceType.FAN) {
        throw new BadRequestException('Thiết bị không hợp lệ. Chỉ hỗ trợ PUMP hoặc FAN.');
      }

      const startTimeDate = dayjs(startTime);
      const endTimeDate = dayjs(endTime);

      if (endTimeDate.isBefore(startTimeDate) || endTimeDate.isSame(startTimeDate)) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu.');
      }

      if (endTimeDate.isBefore(dayjs())) {
        throw new BadRequestException('Thời gian kết thúc phải lớn hơn thời gian hiện tại.');
      }

      return this.prisma.schedule.create({
        data: {
          deviceId,
          startTime: startTimeDate.toDate(),
          endTime: endTimeDate.toDate(),
          repeatDays,
          isActive,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async toggleIsActive(scheduleId: string): Promise<Schedule> {
    try {
      const schedule = await this.prisma.schedule.findUnique({ where: { scheduleId } });
      if (!schedule) throw new NotFoundException(`Không tìm thấy Schedule với ID: ${scheduleId}`);

      if (!schedule.isActive) {
        const existingSchedules = await this.prisma.schedule.findMany({
          where: {
            deviceId: schedule.deviceId,
            isActive: true,
          }
        });

        console.log(existingSchedules);

        for (const existing of existingSchedules) {
          const existingRepeatDays = existing.repeatDays;

          if (existingRepeatDays === 0 && schedule.repeatDays === 0) {
            if (dayjs(schedule.startTime).isSame(existing.startTime, 'day')) {
              throw new ConflictException('Bật lại lịch trình sẽ gây xung đột với lịch trình khác.');
            }
          } else if (existingRepeatDays === 0 && schedule.repeatDays !== 0) {
            console.log('hello world');
            const existingDayOfWeek = dayjs(existing.startTime).day();
            if ((schedule.repeatDays & (1 << existingDayOfWeek)) !== 0) {
              if (dayjs(schedule.startTime).hour() === dayjs(existing.startTime).hour() &&
                dayjs(schedule.startTime).minute() === dayjs(existing.startTime).minute()) {
                throw new ConflictException('Bật lại lịch trình sẽ gây xung đột theo ngày lặp.');
              }
            }
          } else if (existingRepeatDays !== 0 && schedule.repeatDays === 0) {
            const newDayOfWeek = dayjs(schedule.startTime).day();
            if ((existingRepeatDays & (1 << newDayOfWeek)) !== 0) {
              if (dayjs(schedule.startTime).hour() === dayjs(existing.startTime).hour() &&
                dayjs(schedule.startTime).minute() === dayjs(existing.startTime).minute()) {
                throw new ConflictException('Bật lại lịch trình sẽ gây xung đột theo ngày lặp.');
              }
            }
          } else {
            if ((existingRepeatDays & schedule.repeatDays) !== 0) {
              if (dayjs(schedule.startTime).hour() === dayjs(existing.startTime).hour() &&
                dayjs(schedule.startTime).minute() === dayjs(existing.startTime).minute()) {
                throw new ConflictException('Bật lại lịch trình sẽ gây xung đột theo giờ và ngày lặp.');
              }
            }
          }
        }
      }

      // Nếu không có xung đột → Cho phép bật
      const updatedSchedule = await this.prisma.schedule.update({
        where: { scheduleId },
        data: { isActive: !schedule.isActive },
      });

      this.logger.log(`Schedule ${scheduleId} isActive toggled to ${updatedSchedule.isActive}`);

      this.checkSchedulesAndApplyStatus().catch(err => {
        this.logger.error(`Lỗi khi kiểm tra lịch trình sau khi toggle ${scheduleId}:`, err);
      });

      return updatedSchedule;
    } catch (error) {
      this.logger.error(`Lỗi khi toggle Schedule ${scheduleId}:`, error);
      throw new InternalServerErrorException(error.message);
    }
  }



  async findOne(scheduleId: string): Promise<Schedule> {
    try {
      const schedule = await this.prisma.schedule.findUnique({
        where: { scheduleId },
        include: { device: true },
      });

      if (!schedule) {
        throw new NotFoundException(`Không tìm thấy Schedule với ID: ${scheduleId}`);
      }

      return schedule;
    } catch (error) {
      this.logger.error(`Lỗi khi lấy Schedule ${scheduleId}:`, error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(query: GetSchedulesRequestDto): Promise<FindAllSchedulesDto> {
    try {
      const { deviceId, isActive } = query;
      const page = Number(query.page) || 1;
      const items_per_page = Number(query.items_per_page) || 5;
      const skip = (page - 1) * items_per_page;

      const whereCondition: any = {};
      if (deviceId) whereCondition.deviceId = deviceId;
      if (typeof isActive === 'boolean') whereCondition.isActive = isActive;

      const [schedules, total] = await Promise.all([
        this.prisma.schedule.findMany({
          where: whereCondition,
          take: items_per_page,
          skip: skip,
          orderBy: { startTime: 'asc' },
          select: {
            scheduleId: true,
            deviceId: true,
            startTime: true,
            endTime: true,
            repeatDays: true,
            isActive: true,
          },
        }),
        this.prisma.schedule.count({ where: whereCondition }),
      ]);

      const lastPage = Math.ceil(total / items_per_page);
      const nextPage = page + 1 > lastPage ? null : page + 1;
      const prevPage = page - 1 < 1 ? null : page - 1;

      return {
        schedules,
        total,
        currentPage: page,
        nextPage,
        prevPage,
        lastPage,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách Schedule:`, error);
      throw new InternalServerErrorException('Đã xảy ra lỗi khi lấy danh sách Schedule!');
    }
  }


  async remove(scheduleId: string): Promise<Schedule> {
    try {
      const schedule = await this.prisma.schedule.findUnique({ where: { scheduleId } });
      if (!schedule) throw new NotFoundException(`Không tìm thấy Schedule với ID: ${scheduleId}`);

      const deletedSchedule = await this.prisma.schedule.delete({ where: { scheduleId } });

      this.checkSchedulesAndApplyStatus().catch(err => {
        this.logger.error(`Lỗi khi kiểm tra lịch trình sau khi xóa ${scheduleId}:`, err);
      });

      return deletedSchedule;
    } catch (error) {
      this.logger.error(`Lỗi khi xóa Schedule ${scheduleId}:`, error);
      throw new InternalServerErrorException(error.message);
    }
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
        select: { deviceId: true, status: true, name: true },
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

          const device = currentDevices.find(d => d.deviceId === deviceId);
          if (!device) {
            this.logger.warn(`Device ${deviceId} not found in currentDevices list.`);
            continue; // Bỏ qua vòng lặp nếu không tìm thấy thiết bị
          }

          const deviceSuffixMatch = device.name.match(/(kv\d+)$/);
          const deviceSuffix = deviceSuffixMatch ? deviceSuffixMatch[0] : '';

          try {
            if (desiredStatus === DeviceStatus.ACTIVE) {
              await this.retrySendFeedData(`auto${deviceSuffix}`, 'MAN');
              await this.retrySendFeedData(device.name, 'ON');
            } else {
              await this.retrySendFeedData(device.name, 'OFF');
              await this.retrySendFeedData(`auto${deviceSuffix}`, 'AUTO');
            }
          } catch (error) {
            this.logger.error(`Lỗi khi gửi dữ liệu đến Adafruit: ${error}`);
            throw error;
          }

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

  private async retrySendFeedData(feedName: string, value: string): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.adafruitService.sendFeedData(feedName, value);
        return;
      } catch (error) {
        attempt++;
        this.logger.warn(`Lỗi khi gửi dữ liệu đến Adafruit (thử lần ${attempt}): ${error}`);
        if (attempt === maxRetries) {
          throw new Error(`Gửi dữ liệu đến ${feedName} thất bại sau ${maxRetries} lần thử.`);
        }
      }
    }
  }
}