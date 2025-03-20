import { Controller, Post, Param, Body, Get, Query } from '@nestjs/common';
import { AdafruitMqttService } from './adafruit-mqtt.service';
import { Public } from 'src/auth/decorator';

@Controller('adafruit-mqtt')
export class AdafruitMqttController {
    constructor(private readonly adafruitMqttService: AdafruitMqttService) { }

    // @Post('send')
    // sendMessage(@Body() data: { feedName: string; value: string }) {
    //     this.adafruitMqttService.sendMessage(data.feedName, data.value);
    //     return { message: `📤 Sent value ${data.value} to feed ${data.feedName}` };
    // }


    // @Get('feed')
    // @Public()
    // getFeedData(@Query('feedName') feedName: string) {
    //     const value = this.adafruitMqttService.getLatestFeedValue(feedName);
    //     return { feedName, value };
    // }
    
}
