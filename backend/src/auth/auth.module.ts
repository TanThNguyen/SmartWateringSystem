import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
// import { LocalStrategy } from './strategy/local.strategy';
import { JwtStrategy } from './strategy';

@Module({
  imports: [
    UserModule,
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRED')
        },
      }),
      inject: [ConfigService]
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // LocalStrategy,
    JwtStrategy
  ]
})
export class AuthModule { }
