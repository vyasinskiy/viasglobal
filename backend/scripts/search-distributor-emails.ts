import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Парсер аргументов командной строки
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let distributor: string | undefined;
  let query: string | undefined;
  let limit = 10;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--distributor' || args[i] === '-d') {
      distributor = args[++i];
    } else if (args[i] === '--query' || args[i] === '-q') {
      query = args[++i];
    } else if (args[i] === '--limit' || args[i] === '-l') {
      limit = parseInt(args[++i], 10) || 10;
    }
  }

  return { distributor, query, limit };
}

/**
 * Находит и форматирует абзацы или предложения, содержащие ключевые слова
 */
function extractHighlights(text: string | null, query?: string): string[] {
  if (!text) return [];
  if (!query) {
    // Если запрос не указан, берем первые 2-3 предложения
    return [text.substring(0, 300).replace(/\s+/g, ' ').trim()];
  }

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const highlights: string[] = [];

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    if (terms.some((t) => lineLower.includes(t))) {
      highlights.push(line);
    }
  }

  return highlights.slice(0, 5);
}

async function main() {
  const { distributor, query, limit } = parseArgs();

  console.log('====================================================');
  console.log('🔍 Поиск условий и переписки по базе данных писем');
  console.log(`Дистрибьютор: ${distributor || 'Все'}`);
  console.log(`Поисковый запрос / тема: ${query || 'Все письма'}`);
  console.log('====================================================\n');

  let distributorId: number | undefined;
  let distributorName: string | undefined;

  if (distributor) {
    const found = await prisma.distributor.findFirst({
      where: {
        name: { contains: distributor, mode: 'insensitive' },
      },
      include: {
        contacts: true,
      },
    });

    if (found) {
      distributorId = found.id;
      distributorName = found.name;
      console.log(`🏢 Найден дистрибьютор: ${found.name} (ID: ${found.id})`);
      if (found.contacts.length > 0) {
        console.log(
          `👥 Контакты: ${found.contacts.map((c) => `${c.name || 'Менеджер'} <${c.email}>`).join(', ')}`
        );
      }
      console.log('----------------------------------------------------');
    } else {
      console.log(`⚠️ Дистрибьютор "${distributor}" не найден в таблице Distributor.`);
    }
  }

  const whereClause: any = {};
  if (distributorId) {
    whereClause.distributorId = distributorId;
  }

  if (query) {
    whereClause.OR = [
      { subject: { contains: query, mode: 'insensitive' } },
      { bodyText: { contains: query, mode: 'insensitive' } },
      { fromEmail: { contains: query, mode: 'insensitive' } },
      { fromName: { contains: query, mode: 'insensitive' } },
    ];
  }

  const emails = await prisma.distributorEmail.findMany({
    where: whereClause,
    include: {
      distributor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: 'desc' },
    take: limit,
  });

  if (emails.length === 0) {
    console.log('📭 Подходящих писем в базе данных не найдено.');
    console.log('Совет: если переписка была получена недавно, выполните синхронизацию почты:');
    console.log('  cd backend && npx tsx scripts/sync-emails.ts');
  } else {
    console.log(`📬 Найдено писем: ${emails.length}\n`);

    for (let idx = 0; idx < emails.length; idx++) {
      const email = emails[idx];
      const dateStr = new Date(email.date).toLocaleString('ru-RU', { timeZone: 'Europe/Madrid' });
      const sender = email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail;

      console.log(`[#${idx + 1}] 📅 Дата: ${dateStr}`);
      console.log(`     👤 От: ${sender}`);
      console.log(`     🏢 Контрагент: ${email.distributor?.name || 'Не привязан'}`);
      console.log(`     🏷️ Тема: ${email.subject}`);

      if (email.hasAttachments && email.attachments) {
        const atts = email.attachments as any[];
        console.log(`     📎 Вложения (${atts.length}): ${atts.map((a) => a.filename).join(', ')}`);
      }

      const highlights = extractHighlights(email.bodyText, query);
      if (highlights.length > 0) {
        console.log('     💬 Фрагменты переписки / условия:');
        for (const h of highlights) {
          console.log(`        > ${h}`);
        }
      } else if (email.snippet) {
        console.log(`     💬 Превью: ${email.snippet}`);
      }
      console.log('----------------------------------------------------');
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main();
