import { Module } from "@nestjs/common";
import { ScheduleService } from "./schedule.service";
import { ScheduleController } from "./schedule.controller";
import { AdafruitService } from "../adafruit/adafruit.service";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
  imports: [PrismaModule, AdafruitService],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
