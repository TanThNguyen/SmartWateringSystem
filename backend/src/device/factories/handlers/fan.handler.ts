import { Injectable, BadRequestException } from '@nestjs/common';
import { DeviceStatus, DeviceType } from '@prisma/client';
import { AddDeviceDto, EditDeviceDto } from '../../dto';
import { PrismaClient } from '@prisma/client';
import { IDeviceHandler, PrismaTransactionClient } from '../interface/device-handler.interface';

@Injectable()
export class FanDeviceHandler implements IDeviceHandler {

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

  async toggleStatus(prisma: PrismaTransactionClient, device: { deviceId: string; status: DeviceStatus; type: DeviceType }): Promise<DeviceStatus> {
    const newStatus = device.status === DeviceStatus.ACTIVE ? DeviceStatus.INACTIVE : DeviceStatus.ACTIVE;

    await prisma.device.update({
      where: { deviceId: device.deviceId },
      data: { status: newStatus },
    });

    // Logic đặc biệt cho Fan khi toggle (tương tự Pump)
    // await prisma.fan.update({
    //     where: { fanId: device.deviceId },
    //     data: { isRunning: newStatus === DeviceStatus.ACTIVE }
    // });

    return newStatus;
  }
}