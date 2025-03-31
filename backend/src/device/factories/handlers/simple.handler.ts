import { Injectable } from '@nestjs/common';
import { AddDeviceDto, EditDeviceDto } from '../../dto';
import { DeviceStatus, DeviceType, PrismaClient } from '@prisma/client';
import { IDeviceHandler, PrismaTransactionClient } from '../interface/device-handler.interface';

@Injectable()
export class SimpleDeviceHandler implements IDeviceHandler {
  async createSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: AddDeviceDto): Promise<void> {
    return Promise.resolve();
  }

  async updateSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: EditDeviceDto): Promise<void> {
    return Promise.resolve();
  }

  async getSpecifics(prisma: PrismaClient | PrismaTransactionClient, deviceId: string): Promise<any | null> {
    return Promise.resolve(null);
  }

  async toggleStatus(prisma: PrismaTransactionClient, device: { deviceId: string; status: DeviceStatus; type: DeviceType }): Promise<DeviceStatus> {
    const newStatus = device.status === DeviceStatus.ACTIVE ? DeviceStatus.INACTIVE : DeviceStatus.ACTIVE;

    await prisma.device.update({
      where: { deviceId: device.deviceId },
      data: { status: newStatus },
    });
    return newStatus;
  }
}