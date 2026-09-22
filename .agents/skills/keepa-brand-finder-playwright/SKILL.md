---
name: keepa-brand-finder-playwright
description: Автоматизированная выгрузка каталога бренда из Keepa Product Finder через Playwright без расхода API токенов со сквозным сохранением в базу данных.
---

# Навык: Keepa Brand Finder Playwright

Этот навык автоматизирует выгрузку товаров бренда из раздела **Keepa Product Finder** (`https://keepa.com/#!finder`) с использованием Playwright и сохраненной браузерной сессии Google Chrome.

Он работает **абсолютно бесплатно** (0 токенов Keepa API) и **автоматически сохраняет все данные в базу данных** через `backend/scripts/parse-keepa.ts` (создает/обновляет бренды, производителей, продавцов, ASIN, снапшоты цен и связывает выгрузку с `brandId`).

---

## Авторизация в Keepa (разово)

Навык автоматически использует сессию из `.agents/skills/keepa-seller-finder-playwright/auth/storage_state.json` или `.agents/skills/fetch-keepa-viewer/auth/storage_state.json`.

Если сессия отсутствует или устарела, запустите скрипт сохранения сессии:

```bash
cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/save-session.ts
```

---

## Автоматическая выгрузка и сохранение в БД

Запуск выгрузки каталога бренда:

```bash
cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts <название_или_id_бренда>
```

### Примеры использования:

1. **По названию бренда**:
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "NWOUIIAY"
   ```

2. **По ID бренда из базы данных**:
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts 123
   ```

3. **Только скачивание файла без записи в БД** (флаг `--no-parse`):
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "NWOUIIAY" --no-parse
   ```

---

## Что происходит под капотом

1. **Поиск ID бренда**: Если передан ID или имя бренда, скрипт выполняет `SELECT` к таблице `Brand` в БД для уточнения данных.
2. **UI автоматизация Keepa**:
   - Открывается `https://keepa.com/#!finder`.
   - Вводится название бренда в фильтр *"Brand"*.
   - Выбирается вариант в выпадающем списке автодополнения.
   - Нажимается кнопка *"FIND PRODUCTS"*.
   - Ожидается формирование таблицы результатов.
   - **Автоматически переключается лимит отображения таблицы на 5000 строк** (`.tool__row` -> `5000 rows`), гарантируя захват до 5000 товаров, а не 100 по умолчанию.
   - Нажимается кнопка *"Export"*.
   - Скачивается файл `.xlsx` в директорию `keepa/exports/`.
3. **Сохранение в БД**:
   - Скрипт сразу запускает `scripts/parse-keepa.ts` с полученным файлом.
   - Заполняются таблицы `Brand`, `Manufacturer`, `Seller`, `ASIN`, `ProductFinder` и `KeepaExport`.
   - Все новые ASIN бренда автоматически ставятся в очередь `RequestProductQueue` с приоритетом 50 для последующего сбора точных характеристик и метрик.
