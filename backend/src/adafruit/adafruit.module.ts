import { Module } from '@nestjs/common';
import { AdafruitController } from './adafruit.controller';
import { AdafruitService } from './adafruit.service';
import { DevicePollingService } from './device-polling.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LogModule } from 'src/log/log.module';
import { NotificationModule } from 'src/notification/notification.module';
import { DeviceModule } from 'src/device/device.module';

@Module({
  imports:[PrismaModule, LogModule, NotificationModule, DeviceModule],
  controllers: [AdafruitController],
  providers: [AdafruitService, DevicePollingService],
  exports: [AdafruitService, DevicePollingService]
})
export class AdafruitModule {}
