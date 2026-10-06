import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { json, urlencoded } = require('express');
import { AppModule } from './app.module';
import { config } from './common/config/config';
import { FileLogger } from './common/file-logger';

async function bootstrap() {
  const logger = new FileLogger('Accountant');
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Увеличиваем лимиты размера тела входящих JSON и URL-encoded запросов (до 50 МБ)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.RABBITMQ_URL],
      queue: config.ACCOUNTANT_QUEUE,
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(config.PORT);
  
  logger.log(`Accountant HTTP API is listening on port ${config.PORT}`);
  logger.log('Accountant RMQ Microservice is listening...');
}
bootstrap();
