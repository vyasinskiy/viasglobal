import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().default(3005),
  DATABASE_URL: z.string(),
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
  ACCOUNTANT_QUEUE: z.string().default('accountant_queue'),
  SUPER_ADMIN_TELEGRAM_ID: z.string().optional(),
});

const env = configSchema.parse(process.env);

export const config = {
  ...env,
};
