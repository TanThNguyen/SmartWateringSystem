import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config'; // ConfigService không cần import trực tiếp ở đây trừ khi dùng trong AppModule provider
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NestScheduleModule.forRoot(), // <-- THÊM DÒNG NÀY ĐỂ KHỞI TẠO LẬP LỊCH
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
    MyCustomScheduleModule, // Import module chứa Service/Controller Schedule của bạn
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
export class AppModule {}