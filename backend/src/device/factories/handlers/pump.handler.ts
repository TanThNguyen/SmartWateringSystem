import { Injectable, BadRequestException } from '@nestjs/common';
import { DeviceStatus, DeviceType } from '@prisma/client';
import { AddDeviceDto, EditDeviceDto } from '../../dto';
import { PrismaClient } from '@prisma/client';
import { IDeviceHandler, PrismaTransactionClient } from '../interface/device-handler.interface';
import { ScheduleService } from 'src/schedule/schedule.service';

@Injectable()
export class PumpDeviceHandler implements IDeviceHandler {
  constructor(
    private readonly scheduleService: ScheduleService,
  ) { }
  async createSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: AddDeviceDto): Promise<void> {
    // Pump không yêu cầu trường đặc biệt nào trong AddDeviceDto hiện tại
    await prisma.pump.create({
      data: { pumpId: deviceId }, // mode, isRunning có giá trị default trong schema
    });
  }

  async updateSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: EditDeviceDto): Promise<void> {
    if (data.pump) {
      await prisma.pump.update({
        where: { pumpId: deviceId },
        data: data.pump, // Cập nhật các trường từ PumpAttributes trong DTO
      });
    }
  }

  async getSpecifics(prisma: PrismaClient | PrismaTransactionClient, deviceId: string): Promise<any | null> {
    return prisma.pump.findUnique({ where: { pumpId: deviceId } });
  }

  async toggleStatus(
    prisma: PrismaTransactionClient,
    device: { deviceId: string; status: DeviceStatus; type: DeviceType }
  ): Promise<DeviceStatus> {
    const newStatus = device.status === DeviceStatus.ACTIVE ? DeviceStatus.INACTIVE : DeviceStatus.ACTIVE;

    // await prisma.device.update({
    //   where: { deviceId: device.deviceId },
    //   data: { status: newStatus },
    // });

    if (newStatus === DeviceStatus.ACTIVE) {
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60000); // 30 phút sau

      await this.scheduleService.createScheduleWithSimpleValidation({
        deviceId: device.deviceId,
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
        repeatDays: 0,
        isActive: true,
      });
    } else {
      const now = new Date();
      const activeSchedules = await prisma.schedule.findMany({
        where: { deviceId: device.deviceId, isActive: true },
      });

      for (const schedule of activeSchedules) {
        if (schedule.startTime <= now && schedule.endTime >= now) {
          if (schedule.repeatDays === 0) {
            await this.scheduleService.toggleIsActive(schedule.scheduleId);
          } else {
            throw new BadRequestException(
              'Hãy thay đổi trạng thái của lịch trình trước khi tắt thiết bị.'
            );
          }
        }
      }
    }
    return newStatus;
  }

}