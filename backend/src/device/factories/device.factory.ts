import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DeviceType } from '@prisma/client';

import { IDeviceHandler } from './interface/device-handler.interface.js';
import { PumpDeviceHandler } from './handlers/pump.handler.js';
import { FanDeviceHandler } from './handlers/fan.handler.js';
import { MoistureSensorDeviceHandler } from './handlers/moisture.handler.js';
import { DHT20SensorDeviceHandler } from './handlers/dht20.handler.js';
import { SimpleDeviceHandler } from './handlers/simple.handler.js';

@Injectable()
export class DeviceFactory {
  private handlers: Map<DeviceType, IDeviceHandler>;

  // Inject tất cả các handler cụ thể vào đây
  constructor(
    private readonly pumpHandler: PumpDeviceHandler,
    private readonly fanHandler: FanDeviceHandler,
    private readonly moistureHandler: MoistureSensorDeviceHandler,
    private readonly dht20Handler: DHT20SensorDeviceHandler,
    private readonly simpleHandler: SimpleDeviceHandler,
  ) {
    // Khởi tạo Map để dễ dàng lấy handler theo type
    this.handlers = new Map<DeviceType, IDeviceHandler>([
      [DeviceType.PUMP, this.pumpHandler],
      [DeviceType.FAN, this.fanHandler],
      [DeviceType.MOISTURE_SENSOR, this.moistureHandler],
      [DeviceType.DHT20_SENSOR, this.dht20Handler],
      [DeviceType.LCD, this.simpleHandler],
      [DeviceType.LED, this.simpleHandler],
    ]);
  }

  /**
   * Lấy handler phù hợp dựa trên DeviceType.
   * @param type - Loại thiết bị.
   * @returns Instance của IDeviceHandler.
   * @throws InternalServerErrorException nếu không tìm thấy handler cho type.
   */
  getHandler(type: DeviceType): IDeviceHandler {
    const handler = this.handlers.get(type);
    if (!handler) {
      // Trường hợp này không nên xảy ra nếu Map được khởi tạo đúng
      // và enum DeviceType không thay đổi đột ngột
      throw new InternalServerErrorException(`Không tìm thấy handler cho loại thiết bị: ${type}`);
    }
    return handler;
  }
}