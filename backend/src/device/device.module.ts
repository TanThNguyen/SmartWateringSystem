import { Module, forwardRef } from '@nestjs/common';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DeviceFactory } from './factories/device.factory';
import { PumpDeviceHandler } from './factories/handlers/pump.handler';
import { FanDeviceHandler } from './factories/handlers/fan.handler';
import { MoistureSensorDeviceHandler } from './factories/handlers/moisture.handler';
import { DHT20SensorDeviceHandler } from './factories/handlers/dht20.handler';
import { SimpleDeviceHandler } from './factories/handlers/simple.handler';
import { AdafruitModule } from 'src/adafruit/adafruit.module';
import { ScheduleModule } from 'src/schedule/schedule.module';


@Module({
  imports: [
    PrismaModule,
    ScheduleModule,
    forwardRef(() => AdafruitModule),
  ],
  controllers: [DeviceController],
  providers: [
    DeviceService,
    DeviceFactory,
    PumpDeviceHandler,
    FanDeviceHandler,
    MoistureSensorDeviceHandler,
    DHT20SensorDeviceHandler,
    SimpleDeviceHandler,
  ],
  exports: [DeviceService],
})
export class DeviceModule {}
