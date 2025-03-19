import { Module } from '@nestjs/common';
import { AdafruitController } from './adafruit.controller';
import { AdafruitService } from './adafruit.service';

@Module({
  controllers: [AdafruitController],
  providers: [AdafruitService]
})
export class AdafruitModule {}
