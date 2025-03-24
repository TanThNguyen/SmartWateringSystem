import { Controller, Get, Post, Param, Body, Query, Req, Res } from '@nestjs/common';
import { AdafruitService } from './adafruit.service';
import { Public } from 'src/auth/decorator';
import { Response, Request } from 'express';

@Controller('adafruit')
export class AdafruitController {
  constructor(private readonly adafruitService: AdafruitService) { }

  @Get('feed')
  @Public()
  async getFeedData(@Query('feedName') feedName: string) {
    console.log(feedName);
    return this.adafruitService.getFeedData(feedName);
  }
  @Post('set')
  @Public()
  async sendFeedData(@Body() body: { feedName: string; value: string }) {
    const { feedName, value } = body;
    console.log(feedName, ':', value);
    if (!feedName || !value) {
      throw new Error('❌ Missing feedName or value');
    }

    console.log(`📡 Sending to feed: ${feedName} - Value: ${value}`);
    return this.adafruitService.sendFeedData(feedName, value);
  }


  @Get('feed/latest')
  @Public()
  async getLatestFeedData(@Query('feedName') feedName: string) {
    return this.adafruitService.getLatestFeedData(feedName);
  }

  // Polling liên tục lấy dữ liệu mới nhất từ feed
  @Get('feed/polling')
  @Public()
  async startPolling(
    @Query('feedName') feedName: string,
    @Req() req: Request, // 🔹 THÊM DÒNG NÀY ĐỂ LẤY req
    @Res() res: Response
  ) {
    if (!feedName) {
      res.status(400).send({ error: 'Missing feedName query parameter' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    this.adafruitService.startPollingFeed(feedName, 10000, (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    });

    // 🔹 Đóng kết nối khi client ngắt
    req.on('close', () => {
      this.adafruitService.stopPollingFeed(feedName);
    });
  }

  @Get('sensor')
  async getSensorData(@Query('feedName') feedName: string) {
    return this.adafruitService.getSensorData(feedName);
  }

}
