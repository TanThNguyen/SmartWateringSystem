import { Module } from '@nestjs/common';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService], // Vẫn export nếu cần truy vấn log từ module khác
})
export class LogModule {}