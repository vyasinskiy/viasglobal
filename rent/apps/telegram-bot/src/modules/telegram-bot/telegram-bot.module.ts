import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TelegramBotController } from './telegram-bot.controller';
import { TelegramBotNotificationService } from './telegram-bot-notification.service';
import { TelegramBotInteractionService } from './telegram-bot-interaction.service';
import { AdminModule } from '../admin/admin.module';
import { AiAgentModule } from '../ai-agent/ai-agent.module';
import { config } from '../../common/config/config';

@Module({
  imports: [
    AdminModule,
    AiAgentModule,
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
      {
        name: 'WATCHER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [config.RABBITMQ_URL],
          queue: config.WATCHER_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [TelegramBotNotificationService, TelegramBotInteractionService],
  controllers: [TelegramBotController],
  exports: [TelegramBotNotificationService],
})
export class TelegramBotModule {}
