import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { userId: string; email: string }) {
    console.log('JWT_SECRET:', this.configService.get<string>('JWT_SECRET'));
    
    const user = await this.prismaService.user.findUnique({
      where: { userId: payload.userId },
      select: {
        userId: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${payload.userId} not found.`);
    }

    return user;
  }
}
