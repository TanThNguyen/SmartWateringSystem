import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MyJwtGuard } from './auth/guard';
import { NotificationModule } from './notification/notification.module';
import { LogModule } from './log/log.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { DeviceModule } from './device/device.module';
import { LocationModule } from './location/location.module';
// import { AdafruitMqttModule } from './adafruit-mqtt/adafruit-mqtt.module';
import { AdafruitModule } from './adafruit/adafruit.module';
import { RecordModule } from './record/record.module';
import { ScheduleModule as MyCustomScheduleModule } from './schedule/schedule.module'; // Đổi tên import để tránh trùng lặp (hoặc giữ nguyên nếu tên file khác)
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule'; // <-- IMPORT GÓI LẬP LỊCH
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { DecisionModule } from './decision/decision.module';
// import { MailerModule } from '@nestjs-modules/mailer';
// import { join } from 'path';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NestScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    AuthModule,
    UserModule,
    NotificationModule,
    LogModule,
    ConfigurationModule,
    DeviceModule,
    LocationModule,
    // AdafruitMqttModule,
    AdafruitModule,
    RecordModule,
    MyCustomScheduleModule,
    AiAssistantModule,
    DecisionModule,
    // MailerModule.forRootAsync({
    //   useFactory: async (configService: ConfigService) => ({
    //     transport: {
    //       host: configService.get<string>('HOSTMAIL'),
    //       port: configService.get<number>('PORTMAIL'),
    //       secure: true,
    //       auth: {
    //         user: configService.get<string>('MAILDEV_INCOMING_USER'),
    //         pass: configService.get<string>('MAILDEV_INCOMING_PASS')
    //       },
    //     },
    //     defaults: {
    //       from: '"No Reply" <no-reply@localhost>',
    //     },
    //     template: {
    //       dir: join(__dirname, '../mail/templates/'),
    //       adapter: new HandlebarsAdapter(),
    //       options: {
    //         strict: true,
    //       },
    //     },
    //   }),
    //   inject: [ConfigService]

    // }),

  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: MyJwtGuard,
    },
  ],
})
export class AppModule { }