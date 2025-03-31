import { Injectable, BadRequestException } from '@nestjs/common';
import { DeviceStatus, DeviceType } from '@prisma/client';
import { AddDeviceDto, EditDeviceDto } from '../../dto';
import { PrismaClient } from '@prisma/client';
import { IDeviceHandler, PrismaTransactionClient } from '../interface/device-handler.interface';

@Injectable()
export class PumpDeviceHandler implements IDeviceHandler {
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

  async toggleStatus(prisma: PrismaTransactionClient, device: { deviceId: string; status: DeviceStatus; type: DeviceType }): Promise<DeviceStatus> {
    const newStatus = device.status === DeviceStatus.ACTIVE ? DeviceStatus.INACTIVE : DeviceStatus.ACTIVE;

    // Cập nhật trạng thái chung của Device
    await prisma.device.update({
      where: { deviceId: device.deviceId },
      data: { status: newStatus },
    });

    // Có thể thêm logic đặc biệt cho Pump ở đây nếu cần khi toggle
    // Ví dụ: Cập nhật trường isRunning trong bảng Pump nếu muốn đồng bộ
    // await prisma.pump.update({
    //     where: { pumpId: device.deviceId },
    //     data: { isRunning: newStatus === DeviceStatus.ACTIVE }
    // });
    // Lưu ý: Việc cập nhật isRunning có thể nên được xử lý bởi logic AUTO/MANUAL/SCHEDULED khác

    return newStatus;
  }
}