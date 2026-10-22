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

Запуск выгрузки каталога бренда или производителя:

```bash
cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts <название_или_id> [опции]
```

### Доступные параметры:
- `--manufacturer`, `-m` — производить поиск и фильтрацию по полю **Manufacturer** (`#autocomplete-manufacturer`) вместо поля **Brand** (`#autocomplete-brand`).
- `--regex`, `-r` — режим регулярных выражений. Keepa автоматически получает префикс `regex:` (например, `regex:^COFAN.*` или `regex:ALFA DYSER.*`), что позволяет захватывать любые написания, вариации правовых форм (`S.L.`, `S.L.U.`) и опечатки.
- `--no-parse` — только выгрузить файл `.xlsx` без последующего автоматического импорта в базу данных.

### Примеры использования:

1. **По названию бренда**:
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "NWOUIIAY"
   ```

2. **По производителю (Manufacturer) с автоматическим выбором всех вариаций**:
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "COFAN" --manufacturer
   ```
   *(Keepa автоматически находит опцию «Select all» в выпадающем списке и выбирает одновременно `COFAN` и `COFAN (COFB0)`, исключая потерю товаров с вендор-кодами)*.

3. **По производителю через RegEx** (захват всех написаний и правовых форм):
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "ALFA DYSER.*" --manufacturer --regex
   ```

4. **По ID бренда из базы данных**:
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts 123
   ```

5. **Только скачивание файла без записи в БД** (флаг `--no-parse`):
   ```bash
   cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "NWOUIIAY" --no-parse
   ```

---

## Что происходит под капотом

1. **Поиск ID сущности**: Если передан ID или имя бренда/производителя, скрипт выполняет `SELECT` к соответствующей таблице (`Brand` или `Manufacturer`) в БД для уточнения данных.
2. **UI автоматизация Keepa**:
   - Открывается `https://keepa.com/#!finder`.
   - Вводится название в фильтр *"Brand"* (`#autocomplete-brand`) или *"Manufacturer"* (`#autocomplete-manufacturer`).
   - **Множественный выбор ("Select all")**: Если в выпадающем списке автодополнения Keepa есть пункт `Select all` (`li.ui-item-select-all`), скрипт кликает его, выбирая сразу все предложенные вариации (`value1###value2`).
   - **Режим RegEx**: Если активен флаг `--regex` (или запрос начинается с `regex:`), значение отправляется как регулярное выражение (`regex:...`) и подтверждается клавишей `Enter`.
   - **Прямой ввод**: Если точных совпадений в автодополнении нет, нажимается `Enter` для поиска по введённому тексту без сброса фильтра.
   - Нажимается кнопка *"FIND PRODUCTS"*.
   - Ожидается формирование таблицы результатов.
   - **Автоматически переключается лимит отображения таблицы на 5000 строк** (`.tool__row` -> `5000 rows`), гарантируя захват до 5000 товаров, а не 100 по умолчанию.
   - Нажимается кнопка *"Export"*.
   - Скачивается файл `.xlsx` в директорию `keepa/exports/`.
3. **Сохранение в БД**:
   - Скрипт сразу запускает `scripts/parse-keepa.ts` с полученным файлом.
   - Названия производителей автоматически очищаются от вендор-кодов (`COFAN (COFB0)` ➔ `COFAN`) и унифицируются по правовым формам через `normalizeManufacturerName`.
   - Заполняются таблицы `Brand`, `Manufacturer`, `Seller`, `ASIN`, `ProductFinder` и `KeepaExport`.
   - Все новые ASIN бренда/производителя автоматически ставятся в очередь `RequestProductQueue` с приоритетом 50 для последующего сбора точных характеристик и метрик.
