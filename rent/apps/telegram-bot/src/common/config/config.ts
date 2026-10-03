import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
  QUEUE_NAME: z.string().default('accruals_notifications'),
  ACCOUNTANT_QUEUE: z.string().default('accountant_queue'),
  WATCHER_QUEUE: z.string().default('watcher_queue'),
  SUPER_ADMIN_TELEGRAM_ID: z.string().optional(),
  TZ: z.string().default('Europe/Madrid'),
  // Ключи API для финансового AI-ассистента (STT + LLM)
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().default('https://api.deepseek.com'),
  OPENAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

const raw = schema.parse(process.env);

export const config = {
  ...raw,
};
