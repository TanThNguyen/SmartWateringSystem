import { Injectable, BadRequestException } from '@nestjs/common';
import { DeviceStatus, DeviceType } from '@prisma/client';
import { AddDeviceDto, EditDeviceDto } from '../../dto';
import { PrismaClient } from '@prisma/client';
import { IDeviceHandler, PrismaTransactionClient } from '../interface/device-handler.interface';

@Injectable()
export class MoistureSensorDeviceHandler implements IDeviceHandler {

  validateAddData(data: AddDeviceDto): void {
    if (!data.thresholdId) {
      throw new BadRequestException('Thiếu ID ngưỡng độ ẩm (thresholdId) cho Moisture Sensor!');
    }
  }

  async createSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: AddDeviceDto): Promise<void> {
    this.validateAddData(data);
    await prisma.moistureSensor.create({
      data: {
        sensorId: deviceId,
        thresholdId: data.thresholdId!,
      },
    });
  }

  async updateSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: EditDeviceDto): Promise<void> {
    if (data.moistureSensor) {
      await prisma.moistureSensor.update({
        where: { sensorId: deviceId },
        data: data.moistureSensor, // Cập nhật thresholdId
      });
    }
  }

  async getSpecifics(prisma: PrismaClient | PrismaTransactionClient, deviceId: string): Promise<any | null> {
      return prisma.moistureSensor.findUnique({
          where: { sensorId: deviceId },
          // Có thể include thêm threshold nếu cần hiển thị thông tin config
          // include: { threshold: true }
       });
  }

  async toggleStatus(prisma: PrismaTransactionClient, device: { deviceId: string; status: DeviceStatus; type: DeviceType }): Promise<DeviceStatus> {
    if (device.status === DeviceStatus.ACTIVE) {
      throw new BadRequestException(
        'Không thể tắt thủ công cảm biến khi đang hoạt động. Trạng thái sẽ tự cập nhật khi mất kết nối.'
      );
    }

    const newStatus = DeviceStatus.ACTIVE; 

    await prisma.device.update({
      where: { deviceId: device.deviceId },
      data: { status: newStatus },
    });
    return newStatus;
  }
}