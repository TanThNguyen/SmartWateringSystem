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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    NotificationModule,
    LogModule,
    ConfigurationModule,
    DeviceModule,
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
