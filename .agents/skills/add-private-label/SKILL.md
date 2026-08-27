---
name: add-private-label
description: Генерирует скрипт миграции данных для добавления приватного лейбла (производитель + бренд) в БД. Активируется при фразе "добавь приватный лейбл" или "добавь связку".
---

# Инструкция для ИИ (add-private-label)

## Триггер активации
Этот навык должен активироваться, когда пользователь произносит фразу "добавь приватный лейбл", "добавь связку" или аналогичную по смыслу.

## Задача
Получить от пользователя данные о продавце (имя `sellerName` или `sellerId`) и бренде (имя `brandName` или `brandId`), после чего сгенерировать TypeScript-скрипт миграции данных (`data migration`) для добавления подтвержденной связки в таблицу `PrivateLabel` через Prisma.

## Алгоритм работы (Пошаговый опрос)
1. Если пользователь не указал продавца, спроси **только один вопрос**: "Укажите продавца (ID или имя):". Дождись ответа.
2. После получения продавца, задай **следующий вопрос**: "Укажите бренд (название или ID):". Дождись ответа.
3. Если оба значения уже получены, сгенерируй код скрипта по эталонному шаблону (см. ниже).
   
- **Гибкий поиск по ID или имени**: Поиск бренда осуществляется по `id` (если число) или `name`. Поиск продавца осуществляется по `id` (Seller ID) или `name`.
- **Никакого автосоздания сущностей**: Бренд и продавец уже должны присутствовать в БД. Если `Brand` или `Seller` не найдены, скрипт **обязан выбрасывать ошибку** (`throw new Error(...)`) и аварийно завершаться.
- **Подключение через адаптер pg**: Prisma Client обязательно инициализируется через `@prisma/adapter-pg`.
- **Составной ключ**: При `upsert` в поле `where` обязательно использовать составной ключ `brandId_sellerId`.
- **Формат `ANALYSIS_NOTES` (Заметки анализа)**: В поле `notes` / `ANALYSIS_NOTES` записываются **только главные юридические и статистические факты-доказательства связей и выводы** (например: совпадение страны регистрации юрлица и бренда, номер NIF/IVA на иностранную организацию-нерезидента под FBA, прямая связь контактов/email с брендом, семантическое совпадение названий, процент монопольного удержания Buy Box), а **НЕ сырые административные данные вроде физического адреса, индекса или телефона**.

### Эталонный шаблон генерируемого скрипта:
```typescript
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://viasuser:viaspassword@100.92.50.18:5432/viasglobal_db?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Входные параметры (могут быть ID или именем)
const TARGET_BRAND_INPUT = '<BRAND_INPUT>';
const TARGET_SELLER_INPUT = '<SELLER_INPUT>';

// Результаты и заметки анализа Private Label (данные о юрлице, VAT/IVA, удержании Buy Box)
const ANALYSIS_NOTES = `<ANALYSIS_NOTES_TEXT>`;

async function main() {
  try {
    console.log(`\n========================================================`);
    console.log(`🚀 Старт миграции данных: добавление связки Private Label`);
    console.log(`   Бренд: "${TARGET_BRAND_INPUT}"`);
    console.log(`   Продавец: "${TARGET_SELLER_INPUT}"`);
    console.log(`========================================================\n`);

    // 1. Поиск бренда в базе данных (по ID или имени)
    console.log(`[1/3] Поиск бренда "${TARGET_BRAND_INPUT}" в БД...`);
    const brandIdNum = Number(TARGET_BRAND_INPUT);
    const isBrandId = !isNaN(brandIdNum) && Number.isInteger(brandIdNum);

    const brand = await prisma.brand.findFirst({
      where: {
        OR: [
          ...(isBrandId ? [{ id: brandIdNum }] : []),
          { name: { equals: TARGET_BRAND_INPUT, mode: 'insensitive' } },
        ],
      },
    });

    if (!brand) {
      throw new Error(`Бренд "${TARGET_BRAND_INPUT}" не найден в базе данных!`);
    }
    console.log(`   ✅ Бренд найден: ${brand.name} (ID: ${brand.id})`);

    // 2. Поиск продавца (Seller) в базе данных (по Seller ID или имени)
    console.log(`[2/3] Поиск продавца "${TARGET_SELLER_INPUT}" в БД...`);
    const seller = await prisma.seller.findFirst({
      where: {
        OR: [
          { id: { equals: TARGET_SELLER_INPUT, mode: 'insensitive' } },
          { name: { equals: TARGET_SELLER_INPUT, mode: 'insensitive' } },
        ],
      },
    });

    if (!seller) {
      throw new Error(`Продавец "${TARGET_SELLER_INPUT}" не найден в базе данных!`);
    }
    console.log(`   ✅ Продавец найден: ${seller.name} (Seller ID: ${seller.id})`);

    // 3. Создание или обновление записи PrivateLabel
    console.log(`[3/3] Добавление связки в таблицу PrivateLabel...`);
    const privateLabel = await prisma.privateLabel.upsert({
      where: {
        brandId_sellerId: {
          brandId: brand.id,
          sellerId: seller.id,
        },
      },
      update: {
        notes: ANALYSIS_NOTES,
      },
      create: {
        brandId: brand.id,
        sellerId: seller.id,
        notes: ANALYSIS_NOTES,
      },
    });

    console.log(`\n✅ УСПЕШНО: Связка Private Label зафиксирована в БД (ID записи: ${privateLabel.id}).`);
    console.log(`   Заметки анализа сохранены в поле notes.`);
    console.log(`   Все товары бренда "${brand.name}" от продавца "${seller.name}" теперь будут фильтроваться как PRIVATE_LABEL.\n`);

  } catch (error: any) {
    console.error(`\n❌ Ошибка миграции данных: ${error.message}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
```

4. Имя файла должно содержать человекочитаемый текст и временной штамп: `backend/prisma/data-migrations/add-<brand>-private-label-YYYYMMDDHHMMSS.ts`.
5. Сразу используй инструмент `write_to_file` для создания скрипта в `backend/prisma/data-migrations/`.
6. Сообщи пользователю, что файл миграции создан, предоставь ссылку на него для просмотра и спроси: **выполнить этот скрипт миграции сейчас?**
7. **ВАЖНО**: Обязательно дожидайся ответа пользователя перед запуском скрипта!
8. Если пользователь согласен, выполни скрипт с помощью `run_command`: `npx tsx prisma/data-migrations/<файл>.ts`, находясь в директории `backend/`. Выведи результат пользователю.
