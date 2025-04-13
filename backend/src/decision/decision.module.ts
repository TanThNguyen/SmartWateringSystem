import { Module, forwardRef } from '@nestjs/common';
import { DecisionService } from './decision.service';
import { AiAssistantModule } from '../ai-assistant/ai-assistant.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { DecisionController } from './decision.controller';

@Module({
  imports: [
    PrismaModule,
    AiAssistantModule,
    forwardRef(() => ScheduleModule), 
    ConfigModule, 
  ],
  controllers: [DecisionController],
  providers: [DecisionService],
  exports: [DecisionService]  
})
export class DecisionModule {}