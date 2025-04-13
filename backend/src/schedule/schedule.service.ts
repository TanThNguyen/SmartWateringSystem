import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma, Schedule, DeviceStatus, DeviceType, Severity } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateScheduleDto, FindAllSchedulesDto, GetSchedulesRequestDto, ScheduleInfoDto } from "./dto";

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { AdafruitService } from "src/adafruit/adafruit.service";

import { LOG_EVENT, LogEventPayload } from 'src/log/dto';
import { NOTIFICATION_EVENT, NotificationEventPayload, NotificationEventContext } from "src/notification/dto";
import { EventEmitter2 } from "@nestjs/event-emitter";

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
    private eventEmitter: EventEmitter2,
  ) { }
  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    let createdSchedule: Schedule | null = null;
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

      if (endTimeDate.isBefore(dayjs()) && repeatDays === 0) {
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

      createdSchedule = await this.prisma.schedule.create({
        data: {
          deviceId,
          startTime: startTimeDate.toDate(),
          endTime: endTimeDate.toDate(),
          repeatDays,
          isActive,
        },
      });

      // --- BỔ SUNG LOG & NOTIFICATION ---
      const logPayloadSuccess: LogEventPayload = {
        deviceId: deviceId,
        eventType: Severity.INFO,
        description: `Lịch trình mới (ID: ${createdSchedule.scheduleId}) được tạo cho thiết bị '${device.name}'.`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);

      // // Tùy chọn: Gửi thông báo cho admin hoặc người liên quan
      // const notiContext: NotificationEventContext = { deviceId: deviceId, scheduleId: createdSchedule.scheduleId };
      // const notiPayload: NotificationEventPayload = {
      //   severity: Severity.INFO,
      //   messageTemplate: `Lịch trình mới (ID: {{scheduleId}}) đã được tạo cho thiết bị {{deviceId}}.`,
      //   context: notiContext
      //   // explicitRecipientIds: [...] // Chỉ định người nhận nếu cần
      // };
      // this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
      // --- KẾT THÚC BỔ SUNG ---

      return createdSchedule;

    } catch (error) {

      // --- BỔ SUNG LOG LỖI ---
      const logPayloadError: LogEventPayload = {
        deviceId: createScheduleDto.deviceId,
        eventType: Severity.ERROR,
        description: `Lỗi khi tạo lịch trình cho thiết bị ${createScheduleDto.deviceId}: ${error.message}`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadError);
      // --- KẾT THÚC BỔ SUNG ---

      throw new InternalServerErrorException(error.message);
    }
  }

  async createScheduleWithSimpleValidation(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    let createdSchedule: Schedule | null = null;
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

      createdSchedule = await this.prisma.schedule.create({
        data: {
          deviceId,
          startTime: startTimeDate.toDate(),
          endTime: endTimeDate.toDate(),
          repeatDays,
          isActive,
        },
      });

      // --- BỔ SUNG LOG & NOTIFICATION ---
      const logPayloadSuccess: LogEventPayload = {
        deviceId: deviceId,
        eventType: Severity.INFO,
        description: `Lịch trình mới (ID: ${createdSchedule.scheduleId}) được tạo cho thiết bị '${device.name}'.`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);

      // // Tùy chọn: Gửi thông báo cho admin hoặc người liên quan
      // const notiContext: NotificationEventContext = { deviceId: deviceId, scheduleId: createdSchedule.scheduleId };
      // const notiPayload: NotificationEventPayload = {
      //   severity: Severity.INFO,
      //   messageTemplate: `Lịch trình mới (ID: {{scheduleId}}) đã được tạo cho thiết bị {{deviceId}}.`,
      //   context: notiContext
      //   // explicitRecipientIds: [...] // Chỉ định người nhận nếu cần
      // };
      // this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
      // --- KẾT THÚC BỔ SUNG ---

      return createdSchedule;
    } catch (error) {

      // --- BỔ SUNG LOG LỖI ---
      const logPayloadError: LogEventPayload = {
        deviceId: createScheduleDto.deviceId,
        eventType: Severity.ERROR,
        description: `Lỗi khi tạo lịch trình cho thiết bị ${createScheduleDto.deviceId}: ${error.message}`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadError);
      // --- KẾT THÚC BỔ SUNG ---

      throw new InternalServerErrorException(error.message);
    }
  }

  async toggleIsActive(scheduleId: string): Promise<Schedule> {
    let schedule: Schedule | null = null;
    try {
      schedule = await this.prisma.schedule.findUnique({ where: { scheduleId } });
      if (!schedule) throw new NotFoundException(`Không tìm thấy Schedule với ID: ${scheduleId}`);

      if (!schedule.isActive) {
        const existingSchedules = await this.prisma.schedule.findMany({
          where: {
            deviceId: schedule.deviceId,
            isActive: true,
            scheduleId: { not: scheduleId }
          }
        });

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
        include: { device: { select: { name: true } } }
      });

      this.logger.log(`Schedule ${scheduleId} isActive toggled to ${updatedSchedule.isActive}`);

      // --- BỔ SUNG LOG ---
      const logPayload: LogEventPayload = {
        deviceId: updatedSchedule.deviceId,
        eventType: Severity.INFO,
        description: `Trạng thái kích hoạt của lịch trình ${scheduleId} cho thiết bị '${updatedSchedule.device.name}' đã được chuyển thành ${updatedSchedule.isActive}.`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayload);
      // --- KẾT THÚC BỔ SUNG ---

      this.checkSchedulesAndApplyStatus().catch(err => {
        this.logger.error(`Lỗi khi kiểm tra lịch trình sau khi toggle ${scheduleId}:`, err);
      });

      return updatedSchedule;
    } catch (error) {

      // --- BỔ SUNG LOG LỖI ---
      const logPayloadError: LogEventPayload = {
        deviceId: schedule?.deviceId ?? undefined, // Lấy deviceId nếu có
        eventType: Severity.ERROR,
        description: `Lỗi khi thay đổi trạng thái kích hoạt của lịch trình ${scheduleId}: ${error.message}`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadError);
      // --- KẾT THÚC BỔ SUNG ---

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
    let scheduleToDelete: Schedule | null = null;
    try {
      scheduleToDelete = await this.prisma.schedule.findUnique({
        where: { scheduleId },
      });
      if (!scheduleToDelete) throw new NotFoundException(`Không tìm thấy Schedule với ID: ${scheduleId}`);

      const deletedSchedule = await this.prisma.schedule.delete({
        where: { scheduleId },
        include: { device: { select: { name: true } } }
      });

      // --- BỔ SUNG LOG ---
      const logPayload: LogEventPayload = {
        deviceId: deletedSchedule.deviceId,
        eventType: Severity.INFO,
        description: `Lịch trình ${scheduleId} cho thiết bị '${deletedSchedule.device.name}' đã được xóa.`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayload);
      // --- KẾT THÚC BỔ SUNG ---

      this.checkSchedulesAndApplyStatus().catch(err => {
        this.logger.error(`Lỗi khi kiểm tra lịch trình sau khi xóa ${scheduleId}:`, err.message, err.stack);
      });

      return scheduleToDelete;
    } catch (error) {
      // --- BỔ SUNG LOG LỖI ---
      const logPayloadError: LogEventPayload = {
        deviceId: scheduleToDelete?.deviceId ?? undefined,
        eventType: Severity.ERROR,
        description: `Lỗi khi xóa lịch trình ${scheduleId}: ${error.message}`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadError);
      // --- KẾT THÚC BỔ SUNG ---
      this.logger.error(`Lỗi khi xóa Schedule ${scheduleId}:`, error);
      throw new InternalServerErrorException(error.message);
    }
  }


  @Cron(CronExpression.EVERY_MINUTE)
  // @Cron('*/10 * * * * *')
  async handleCron() {
    this.logger.debug(`Running scheduled check (${this.localTimezone})...`);
    try {
      await this.checkSchedulesAndApplyStatus();
    } catch (error) {
      // Log lỗi xảy ra trong quá trình kiểm tra định kỳ
      this.logger.error('Lỗi không mong muốn trong quá trình kiểm tra lịch trình định kỳ:', error.message, error.stack);
      // --- BỔ SUNG LOG LỖI & NOTIFICATION ( cho Admin) ---
      const logPayloadError: LogEventPayload = {
        eventType: Severity.ERROR,
        description: `Lỗi nghiêm trọng trong CRON job kiểm tra lịch trình: ${error.message}`
      };
      this.eventEmitter.emit(LOG_EVENT, logPayloadError);

      const notiPayload: NotificationEventPayload = {
        severity: Severity.ERROR,
        messageTemplate: `Lỗi CRON job kiểm tra lịch trình: {{errorMessage}}`,
        context: { errorMessage: error.message }
      };
      this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
      // --- KẾT THÚC BỔ SUNG ---
    }
  }

  async checkSchedulesAndApplyStatus(): Promise<void> {
    const now = dayjs().tz(this.localTimezone);
    const deviceShouldBeActiveMap = new Map<string, boolean>();
    const potentiallyFinishedOneTimeSchedules = new Map<string, string>();

    const activeSchedules = await this.prisma.schedule.findMany({
      where: { isActive: true },
      select: { scheduleId: true, deviceId: true, startTime: true, endTime: true, repeatDays: true }
    });

    for (const schedule of activeSchedules) {
      let shouldBeActiveNow = false;
      const scheduleStartTime = dayjs(schedule.startTime);
      const scheduleEndTime = dayjs(schedule.endTime);

      if (schedule.repeatDays === 0) { // One-time schedule
        const nowUtc = dayjs.utc();
        if (nowUtc.isSameOrAfter(scheduleStartTime) && nowUtc.isBefore(scheduleEndTime)) {
          shouldBeActiveNow = true;
        } else if (nowUtc.isSameOrAfter(scheduleEndTime)) {
          potentiallyFinishedOneTimeSchedules.set(schedule.scheduleId, schedule.deviceId);
        }
      } else { // Repeating schedule
        const currentDayOfWeek = now.day(); // Use local day for checking repeatDays flag
        const isTodayScheduled = (schedule.repeatDays & (1 << currentDayOfWeek)) !== 0;

        if (isTodayScheduled) {
          const currentTimeMinutes = now.hour() * 60 + now.minute();
          const startTimeLocal = dayjs(schedule.startTime).tz(this.localTimezone);
          const endTimeLocal = dayjs(schedule.endTime).tz(this.localTimezone);
          const startTimeMinutes = startTimeLocal.hour() * 60 + startTimeLocal.minute();
          const endTimeMinutes = endTimeLocal.hour() * 60 + endTimeLocal.minute();

          if (startTimeMinutes <= endTimeMinutes) { // Schedule does not cross midnight
            shouldBeActiveNow = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
          } else { // Schedule crosses midnight (e.g., 10 PM to 2 AM)
            shouldBeActiveNow = currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
          }
        }
      }

      if (shouldBeActiveNow) {
        deviceShouldBeActiveMap.set(schedule.deviceId, true);
      }
    }

    const scheduledDeviceIds = new Set(activeSchedules.map(s => s.deviceId));
    const activePumpFanDevices = await this.prisma.device.findMany({
      where: {
        type: { in: [DeviceType.PUMP, DeviceType.FAN] },
        status: DeviceStatus.ACTIVE
      },
      select: { deviceId: true }
    });
    const activePumpFanDeviceIds = new Set(activePumpFanDevices.map(d => d.deviceId));

    const allRelevantDeviceIds = [...new Set([...scheduledDeviceIds, ...activePumpFanDeviceIds])];

    if (allRelevantDeviceIds.length === 0) {
      this.logger.debug('Không có thiết bị liên quan (từ lịch trình active hoặc đang ACTIVE) để kiểm tra.');
      if (potentiallyFinishedOneTimeSchedules.size > 0) {
        await this.deactivateFinishedSchedules(potentiallyFinishedOneTimeSchedules, new Map()); // Pass empty map
      }
      return;
    }

    const currentDevices = await this.prisma.device.findMany({
      where: { deviceId: { in: allRelevantDeviceIds } },
      select: { deviceId: true, status: true, name: true, type: true }, // Include type
    });
    // const initialDeviceStatuses = new Map(currentDevices.map(d => [d.deviceId, d.status]));
    const finalDeviceStatuses = new Map<string, DeviceStatus>(); // To track the final state for deactivation check

    const updates: Prisma.PrismaPromise<any>[] = [];
    const adafruitCommands: {
      feedName: string;
      value: string;
      deviceId: string;
      deviceName: string;
      originalStatus: DeviceStatus;
      desiredStatus: DeviceStatus;
    }[] = [];

    for (const device of currentDevices) {
      const deviceId = device.deviceId;
      const currentStatus = device.status;
      const desiredStatus = deviceShouldBeActiveMap.get(deviceId) === true ? DeviceStatus.ACTIVE : DeviceStatus.INACTIVE;
      finalDeviceStatuses.set(deviceId, desiredStatus); // Store final decision

      if (currentStatus !== desiredStatus) {
        this.logger.log(`Updating Device ${deviceId} (${device.name}) status: ${currentStatus} -> ${desiredStatus}`);

        // --- BỔ SUNG LOG CHO VIỆC THAY ĐỔI TRẠNG THÁI ---
        const logPayload: LogEventPayload = {
          deviceId: deviceId,
          eventType: Severity.INFO,
          description: `Trạng thái thiết bị '${device.name}' được cập nhật thành ${desiredStatus} bởi lịch trình.`
        };
        this.eventEmitter.emit(LOG_EVENT, logPayload);
        // --- KẾT THÚC BỔ SUNG ---

        updates.push(
          this.prisma.device.update({
            where: { deviceId: deviceId },
            data: { status: desiredStatus },
          })
        );

        if (device.type === DeviceType.PUMP || device.type === DeviceType.FAN) {
          const deviceSuffixMatch = device.name.match(/(kv\d+)$/); // Assuming 'kv' prefix like 'pumpkv1', 'fankv1'
          const deviceSuffix = deviceSuffixMatch ? deviceSuffixMatch[1] : null; // Get 'kv1' part

          if (deviceSuffix) {
            const commandBase = { deviceId, deviceName: device.name, originalStatus: currentStatus, desiredStatus };
            if (desiredStatus === DeviceStatus.ACTIVE) {
              adafruitCommands.push({ ...commandBase, feedName: `auto${deviceSuffix}`, value: 'MAN' });
              adafruitCommands.push({ ...commandBase, feedName: device.name, value: 'ON' });
            } else {
              adafruitCommands.push({ ...commandBase, feedName: device.name, value: 'OFF' });
              adafruitCommands.push({ ...commandBase, feedName: `auto${deviceSuffix}`, value: 'AUTO' });
            }
          } else {
            this.logger.warn(`Could not extract suffix (like kv1) from device name ${device.name} for Adafruit commands.`);
          }
        }
      } else {
        finalDeviceStatuses.set(deviceId, currentStatus);
      }
    }

    if (updates.length > 0) {
      try {
        await this.prisma.$transaction(updates);
        this.logger.log(`Successfully updated status for ${updates.length} devices in DB.`);
      } catch (error) {
        this.logger.error('Error updating device statuses in DB transaction:', error.message, error.stack);

        // --- BỔ SUNG LOG LỖI DB ---
        const logPayloadError: LogEventPayload = {
          eventType: Severity.ERROR,
          description: `Lỗi DB khi cập nhật trạng thái thiết bị theo lịch trình: ${error.message}`
        };
        this.eventEmitter.emit(LOG_EVENT, logPayloadError);
        // --- KẾT THÚC BỔ SUNG ---

        potentiallyFinishedOneTimeSchedules.clear();
      }
    } else {
      this.logger.debug('No device status changes required in DB.');
    }

    for (const cmd of adafruitCommands) {
      try {
        await this.retrySendFeedData(cmd.feedName, cmd.value);
        this.logger.debug(`Successfully sent command ${cmd.value} to ${cmd.feedName} for device ${cmd.deviceId}`);
      } catch (error) {
        this.logger.error(`Failed to send command ${cmd.value} to ${cmd.feedName} after retries: ${error.message}`, error.stack);

        // --- BỔ SUNG LOG LỖI & NOTIFICATION ADAFRUIT ---
        const errorMsg = `Gửi lệnh ${cmd.value} đến ${cmd.feedName} thất bại sau khi thử lại: ${error.message}`;
        this.logger.error(errorMsg, error.stack);

        const logPayloadError: LogEventPayload = {
          deviceId: cmd.deviceId,
          eventType: Severity.ERROR,
          description: `Lỗi Adafruit cho thiết bị '${cmd.feedName}': ${errorMsg}`
        };
        this.eventEmitter.emit(LOG_EVENT, logPayloadError);

        const notiContext: NotificationEventContext = { deviceId: cmd.deviceId, errorMessage: errorMsg };
        const notiPayload: NotificationEventPayload = {
          severity: Severity.ERROR,
          messageTemplate: `Lỗi giao tiếp Adafruit với thiết bị {{deviceId}}: {{errorMessage}}`,
          context: notiContext
        };
        this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
        // --- KẾT THÚC BỔ SUNG ---

        const originalStatus = cmd.originalStatus;
        this.logger.warn(`Attempting DB rollback for Device ${cmd.deviceId} (${cmd.deviceName}) to its original status: ${originalStatus} due to Adafruit command failure.`);
        try {
          await this.prisma.device.update({
            where: { deviceId: cmd.deviceId },
            data: { status: originalStatus }, // Revert to original status
          });
          this.logger.log(`Successfully rolled back DB status for Device ${cmd.deviceId} to ${originalStatus}.`);

          // Update the final status map to reflect the rollback
          finalDeviceStatuses.set(cmd.deviceId, originalStatus);

          // Log rollback success
          const logPayloadRollback: LogEventPayload = {
            deviceId: cmd.deviceId,
            eventType: Severity.WARNING, // Use WARN for rollback event
            description: `Trạng thái thiết bị '${cmd.deviceName}' được khôi phục về ${originalStatus} do lỗi gửi lệnh Adafruit ('${cmd.value}' to '${cmd.feedName}').`
          };
          this.eventEmitter.emit(LOG_EVENT, logPayloadRollback);

        } catch (rollbackError) {
          this.logger.error(`CRITICAL: Failed to roll back DB status for Device ${cmd.deviceId} to ${originalStatus} after Adafruit failure. DB might be inconsistent. Rollback error: ${rollbackError.message}`, rollbackError.stack);
          // Log and Notify about the rollback *failure* - this is serious
          const logPayloadRollbackFail: LogEventPayload = {
            deviceId: cmd.deviceId,
            eventType: Severity.ERROR, // ERROR because rollback failed
            description: `LỖI KHÔI PHỤC NGHIÊM TRỌNG: Không thể khôi phục trạng thái (${originalStatus}) cho thiết bị '${cmd.deviceName}' sau lỗi Adafruit. Lỗi rollback DB: ${rollbackError.message}`
          };
          this.eventEmitter.emit(LOG_EVENT, logPayloadRollbackFail);

          const notiContextRollbackFail: NotificationEventContext = { deviceId: cmd.deviceId, errorMessage: rollbackError.message};
          const notiPayloadRollbackFail: NotificationEventPayload = {
            severity: Severity.ERROR, // Use CRITICAL for failed rollback
            messageTemplate: `LỖI KHÔI PHỤC DB: Không thể rollback trạng thái thiết bị {{deviceId}} về {{originalStatus}} sau lỗi Adafruit. Lỗi DB: {{errorMessage}}. Cần kiểm tra thủ công!`,
            context: notiContextRollbackFail,
            // TODO: Notify ADMINS specifically?
          };
          this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayloadRollbackFail);
        }
      }
    }

    await this.deactivateFinishedSchedules(potentiallyFinishedOneTimeSchedules, finalDeviceStatuses);
  }

  private async deactivateFinishedSchedules(
    potentiallyFinishedSchedules: Map<string, string>,
    finalDeviceStatuses: Map<string, DeviceStatus>
  ): Promise<void> {
    const schedulesToDeactivate: string[] = [];
    if (potentiallyFinishedSchedules.size > 0) {
      for (const [scheduleId, deviceId] of potentiallyFinishedSchedules.entries()) {
        if (finalDeviceStatuses.get(deviceId) === DeviceStatus.INACTIVE) {
          schedulesToDeactivate.push(scheduleId);
        }
      }

      if (schedulesToDeactivate.length > 0) {
        this.logger.log(`Deactivating ${schedulesToDeactivate.length} completed one-time schedules...`);
        try {
          const result = await this.prisma.schedule.updateMany({
            where: { scheduleId: { in: schedulesToDeactivate }, isActive: true }, // Ensure we only update active ones
            data: { isActive: false },
          });
          this.logger.log(`Successfully deactivated ${result.count} schedules.`);

          // --- TÙY CHỌN: BỔ SUNG LOG CHO VIỆC HỦY KÍCH HOẠT ---
          if (result.count > 0) {
            const logPayload: LogEventPayload = {
              eventType: Severity.INFO,
              description: `Đã tự động hủy kích hoạt ${result.count} lịch trình một lần đã hoàn thành. IDs: ${schedulesToDeactivate.join(', ')}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayload);
          }
          // --- KẾT THÚC BỔ SUNG ---

        } catch (error) {
          this.logger.error('Error deactivating one-time schedules:', error.message, error.stack);

          // --- BỔ SUNG LOG LỖI ---
          const logPayloadError: LogEventPayload = {
            eventType: Severity.ERROR,
            description: `Lỗi khi hủy kích hoạt lịch trình một lần: ${error.message}. IDs: ${schedulesToDeactivate.join(', ')}`
          };
          this.eventEmitter.emit(LOG_EVENT, logPayloadError);
          // --- KẾT THÚC BỔ SUNG ---

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