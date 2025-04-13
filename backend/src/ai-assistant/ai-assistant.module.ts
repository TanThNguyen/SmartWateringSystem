import { Module } from '@nestjs/common';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config'; 

@Module({
  imports: [
    HttpModule,
    ConfigModule, 
  ],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService] 
})
export class AiAssistantModule {}