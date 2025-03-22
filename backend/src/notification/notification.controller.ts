import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { CreateNotiDto, FindAllNotisDto, OneNotiRequestDto } from './dto';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService
  ) { }

  @Post('add')
  async add(@Body() data: CreateNotiDto): Promise<string> {
    return await this.notificationService.create(data);
  }

  @Get('all')
  async getAll(@GetUser() user: User): Promise<FindAllNotisDto> {
    return await this.notificationService.getAll(user.userId);
  }

  @Get('one')
  async getOneNoti(
    @GetUser() user: User,
    @Query() query: OneNotiRequestDto,
  ): Promise<String> {
    return this.notificationService.getOne(user.userId, query.notificationId);
  }

  @Get('unread-count')
  async getUnreadCount(@GetUser() user: User): Promise<number> {
    return await this.notificationService.getUnreadCount(user.userId);
  }
}
