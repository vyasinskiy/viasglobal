import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { EmailSyncService } from '../src/distributors/email-sync.service';

// Загружаем переменные окружения из ecommerce/backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Инициализация подключения к базе данных через адаптер pg
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('====================================================');
  console.log('📧 Запуск синхронизации почтового ящика (Hostinger)');
  console.log('====================================================');

  const args = process.argv.slice(2);
  let limit = 30;
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10);
  }

  // Создаем экземпляр сервиса
  const service = new EmailSyncService(prisma as any);

  try {
    const results = await service.syncInbox(limit);

    console.log(`\n✅ Синхронизация завершена. Всего обработано: ${results.length} писем.`);
    console.log('----------------------------------------------------');

    const matched = results.filter((r) => r.distributorId);
    console.log(`🔗 Сопоставлено с дистрибьюторами в БД: ${matched.length}`);

    for (const item of results) {
      const distInfo = item.distributorName ? `[${item.distributorName}]` : '[Неизвестный контрагент]';
      const statusIcon = item.isNew ? '🆕' : '🔄';
      const attachIcon = item.hasAttachments ? '📎' : ' ';
      console.log(`${statusIcon} ${attachIcon} ${distInfo} От: ${item.fromName || item.fromEmail} | Тема: "${item.subject}"`);
      if (item.savedAttachments.length > 0) {
        console.log(`   📂 Сохранены вложения: ${item.savedAttachments.join(', ')}`);
      }
    }
    console.log('====================================================');
  } catch (error: any) {
    console.error('❌ Ошибка синхронизации почты:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
