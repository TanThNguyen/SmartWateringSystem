import { Module } from "@nestjs/common";
import { ScheduleService } from "./schedule.service";
import { ScheduleController } from "./schedule.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { AdafruitModule } from "src/adafruit/adafruit.module";

@Module({
  imports: [PrismaModule, AdafruitModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
