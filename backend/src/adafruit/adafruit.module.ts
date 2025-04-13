import { Module, forwardRef } from '@nestjs/common';
import { AdafruitController } from './adafruit.controller';
import { AdafruitService } from './adafruit.service';
import { DevicePollingService } from './device-polling.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LogModule } from 'src/log/log.module';
import { NotificationModule } from 'src/notification/notification.module';
import { DeviceModule } from 'src/device/device.module';
import { DecisionModule } from 'src/decision/decision.module';

@Module({
  imports: [
    PrismaModule,
    LogModule,
    NotificationModule,
    forwardRef(() => DecisionModule),
    forwardRef(() => DeviceModule),
  ],
  controllers: [AdafruitController],
  providers: [AdafruitService, DevicePollingService],
  exports: [AdafruitService, DevicePollingService],
})
export class AdafruitModule {}
