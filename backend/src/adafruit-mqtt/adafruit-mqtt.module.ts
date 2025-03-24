import { Module } from '@nestjs/common';
import { AdafruitMqttController } from './adafruit-mqtt.controller';
import { AdafruitMqttService } from './adafruit-mqtt.service';

@Module({
  controllers: [AdafruitMqttController],
  providers: [AdafruitMqttService]
})
export class AdafruitMqttModule {}
