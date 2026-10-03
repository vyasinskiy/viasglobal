import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { config } from '../../common/config/config';
import { AiAgentService } from './ai-agent.service';
import { SpeechToTextService } from './speech-to-text.service';
import { DraftStorageService } from './draft-storage.service';

/**
 * Модуль финансового AI-ассистента
 */
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ACCOUNTANT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [config.RABBITMQ_URL],
          queue: config.ACCOUNTANT_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [AiAgentService, SpeechToTextService, DraftStorageService],
  exports: [AiAgentService, SpeechToTextService, DraftStorageService],
})
export class AiAgentModule {}
