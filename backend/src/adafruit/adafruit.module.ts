import { Module } from '@nestjs/common';
import { AdafruitController } from './adafruit.controller';
import { AdafruitService } from './adafruit.service';
import { DevicePollingService } from './device-polling.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  controllers: [AdafruitController],
  providers: [AdafruitService],//, DevicePollingService],
  exports: [AdafruitService],//, DevicePollingService]
})
export class AdafruitModule {}
