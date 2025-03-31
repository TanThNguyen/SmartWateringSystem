import { Injectable, BadRequestException } from '@nestjs/common';
import { DeviceStatus, DeviceType } from '@prisma/client';
import { AddDeviceDto, EditDeviceDto } from '../../dto';
import { PrismaClient } from '@prisma/client';
import { IDeviceHandler, PrismaTransactionClient } from '../interface/device-handler.interface';

@Injectable()
export class DHT20SensorDeviceHandler implements IDeviceHandler {

  validateAddData(data: AddDeviceDto): void {
    if (!data.tempMinId || !data.tempMaxId || !data.humidityThresholdId) {
      throw new BadRequestException('Thiếu ID ngưỡng nhiệt độ tối thiểu, tối đa hoặc độ ẩm cho DHT20 Sensor!');
    }
    // Có thể thêm kiểm tra sự tồn tại của các config ID này
  }

  async createSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: AddDeviceDto): Promise<void> {
    this.validateAddData(data);
    await prisma.dHT20Sensor.create({
      data: {
        sensorId: deviceId,
        tempMinId: data.tempMinId!,
        tempMaxId: data.tempMaxId!,
        humidityThresholdId: data.humidityThresholdId!,
      },
    });
  }

  async updateSpecifics(prisma: PrismaTransactionClient, deviceId: string, data: EditDeviceDto): Promise<void> {
    if (data.dht20Sensor) {
      await prisma.dHT20Sensor.update({
        where: { sensorId: deviceId },
        data: data.dht20Sensor, // Cập nhật các threshold IDs
      });
    }
  }

   async getSpecifics(prisma: PrismaClient | PrismaTransactionClient, deviceId: string): Promise<any | null> {
       return prisma.dHT20Sensor.findUnique({
            where: { sensorId: deviceId },
            // Có thể include thêm các configuration nếu cần
            // include: { temperatureMin: true, temperatureMax: true, humidityThreshold: true }
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