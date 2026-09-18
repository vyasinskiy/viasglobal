---
name: keepa-seller-finder-playwright
description: Автоматизированная выгрузка каталога продавца из Keepa Product Finder через Playwright без расхода API токенов со сквозным сохранением в базу данных.
---

# Навык: Keepa Seller Finder Playwright

Этот навык автоматизирует выгрузку товаров продавца из раздела **Keepa Product Finder** (`https://keepa.com/#!finder`) с использованием Playwright и сохраненной браузерной сессии Google Chrome. 

Он работает **абсолютно бесплатно** (0 токенов Keepa API) и **автоматически сохраняет все данные в базу данных** через `backend/scripts/parse-keepa.ts` (создает/обновляет продавца, бренды, производителей, ASIN, снапшоты цен и связывает выгрузку с `sellerId`).

---

## Авторизация в Keepa (разово)

Навык автоматически использует сессию из `.agents/skills/fetch-keepa-viewer/auth/storage_state.json` или собственной папки `auth/`.

Если сессия отсутствует или устарела, запустите:

```bash
cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/save-session.ts
```

1. Откроется браузер Google Chrome.
2. Войдите в аккаунт Keepa и выберите регион Испания (amazon.es).
3. Нажмите `ENTER` в терминале для сохранения сессии.

---

## Автоматическая выгрузка и сохранение в БД

Запуск выгрузки продавца:

```bash
cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/fetch-seller-finder.ts <sellerId_или_имя_продавца>
```

### Примеры использования:

1. **По Seller ID**:
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/fetch-seller-finder.ts A1O61CEYQ8IRTV
   ```

2. **По названию продавца** (скрипт сам найдет `sellerId` в БД):
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/fetch-seller-finder.ts "Theonoi"
   ```

3. **Только скачивание файла без записи в БД** (флаг `--no-parse`):
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/fetch-seller-finder.ts A1O61CEYQ8IRTV --no-parse
   ```

---

## Что происходит под капотом

1. **Поиск ID**: Если передано имя продавца, выполняется `SELECT` к таблице `Seller` для нахождения точного `sellerId`.
2. **UI автоматизация Keepa**:
   - Открывается `https://keepa.com/#!finder`.
   - Вводится `sellerId` в фильтр *"Specific seller(s) - seller ID"*.
   - Нажимается кнопка *"FIND PRODUCTS"*.
   - Ожидается формирование таблицы результатов.
   - **Автоматически переключается лимит отображения таблицы на 5000 строк** (`.tool__row` -> `5000 rows`), гарантируя захват до 5000 товаров, а не 100 по умолчанию.
   - Нажимается кнопка *"Export"*.
   - Скачивается файл `.xlsx` в директорию `keepa/exports/`.
3. **Сохранение в БД**:
   - Скрипт сразу запускает `scripts/parse-keepa.ts` с полученным файлом.
   - Заполняются таблицы `Seller`, `SellerSnapshot`, `Brand`, `Manufacturer`, `ASIN`, `ASINSnapshot` и `KeepaExport`.
