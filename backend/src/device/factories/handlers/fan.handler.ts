import { Injectable, BadRequestException } from '@nestjs/common';
import { DeviceStatus, DeviceType } from '@prisma/client';
import { AddDeviceDto, EditDeviceDto } from '../../dto';
import { PrismaClient } from '@prisma/client';
import { IDeviceHandler, PrismaTransactionClient } from '../interface/device-handler.interface';
import { ScheduleService } from 'src/schedule/schedule.service';

@Injectable()
export class FanDeviceHandler implements IDeviceHandler {
  constructor(
    private readonly scheduleService: ScheduleService,
  ) { }

  async createSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: AddDeviceDto): Promise<void> {
    await prisma.fan.create({
      data: {
        fanId: deviceId,
        speed: parseFloat(data.speed || '0'),
      },
    });
  }


  async updateSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: EditDeviceDto): Promise<void> {
    if (data.fan) {
      await prisma.fan.update({
        where: { fanId: deviceId },
        data: data.fan,
      });
    }
  }

  async getSpecifics(prisma: PrismaClient | PrismaTransactionClient, deviceId: string): Promise<any | null> {
    return prisma.fan.findUnique({ where: { fanId: deviceId } });
  }

  async toggleStatus(
    prisma: PrismaTransactionClient,
    device: { deviceId: string; status: DeviceStatus; type: DeviceType }
  ): Promise<DeviceStatus> {
    const newStatus = device.status === DeviceStatus.ACTIVE ? DeviceStatus.INACTIVE : DeviceStatus.ACTIVE;

    
    
    
    

    if (newStatus === DeviceStatus.ACTIVE) {
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60000); 

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