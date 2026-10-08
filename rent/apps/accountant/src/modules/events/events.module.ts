import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { MeterSubmissionModule } from '../meter-submission/meter-submission.module';
import { config } from '../../common/config/config';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    MeterSubmissionModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [config.RABBITMQ_URL],
          queue: process.env.QUEUE_NAME || 'accruals_notifications',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
