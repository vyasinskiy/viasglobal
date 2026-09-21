---
name: keepa-category-finder-playwright
description: Автоматизированная выгрузка каталога корневой категории (Root Category) из Keepa Product Finder через Playwright без расхода API токенов со сквозным сохранением в базу данных.
---

# Навык: Keepa Category Finder Playwright

Этот навык автоматизирует выгрузку товаров корневой категории из раздела **Keepa Product Finder** (`https://keepa.com/#!finder`) с использованием Playwright и сохраненной браузерной сессии Google Chrome.

Он работает **абсолютно бесплатно** (0 токенов Keepa API), поддерживает **выгрузку порциями по 5000 строк с переходом по страницам пагинации** и **автоматически сохраняет все данные в базу данных** через `backend/scripts/parse-keepa.ts` (создает/обновляет бренды, производителей, продавцов, ASIN, снапшоты цен и связывает выгрузку).

---

## Авторизация в Keepa (разово)

Навык автоматически использует сессию из:
- `.agents/skills/keepa-brand-finder-playwright/auth/storage_state.json`
- `.agents/skills/keepa-seller-finder-playwright/auth/storage_state.json`
- `.agents/skills/fetch-keepa-viewer/auth/storage_state.json`

Если сессия отсутствует или устарела, запустите скрипт сохранения сессии:

```bash
cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/save-session.ts
```

---

## Автоматическая выгрузка и сохранение в БД

Запуск выгрузки каталога категории:

```bash
cd backend && npx tsx ../.agents/skills/keepa-category-finder-playwright/scripts/fetch-category-finder.ts <название_или_id_категории> [--pages N] [--no-parse]
```

### Примеры использования:

1. **По названию категории с пагинацией (по умолчанию 2 страницы по 5000 = до 10 000 товаров)**:
   ```bash
   cd backend && npx tsx ../.agents/skills/keepa-category-finder-playwright/scripts/fetch-category-finder.ts "Jardín"
   ```

2. **Выгрузка 1 страницы (до 5000 товаров)**:
   ```bash
   cd backend && npx tsx ../.agents/skills/keepa-category-finder-playwright/scripts/fetch-category-finder.ts "Jardín" --pages 1
   ```

3. **По Category ID из базы данных (KeepaAllowedCategory)**:
   ```bash
   cd backend && npx tsx ../.agents/skills/keepa-category-finder-playwright/scripts/fetch-category-finder.ts 1571259031
   ```

4. **Только скачивание файлов без записи в БД** (флаг `--no-parse`):
   ```bash
   cd backend && npx tsx ../.agents/skills/keepa-category-finder-playwright/scripts/fetch-category-finder.ts "Jardín" --no-parse
   ```

---

## Что происходит под капотом

1. **Фиксация начального состояния БД**: Перед импортом скрипт считывает общее количество записей в таблицах `ASIN`, `Brand`, `Manufacturer`, `ASINSnapshot` и `KeepaExport`.
2. **Поиск ID категории**: Если передан ID или имя, скрипт проверяет совпадения в таблице `KeepaAllowedCategory` в БД.
3. **UI автоматизация Keepa**:
   - Открывается `https://keepa.com/#!finder`.
   - Вводится название категории в фильтр *"Root category"* (`#autocomplete-rootCategory`).
   - Выбирается вариант в выпадающем списке автодополнения.
   - **Автоматически применяются стандартные оптовые Wholesale-фильтры**:
     * **Двухчастная выгрузка Sales Rank (Обход лимита 10 000 строк Keepa)**:
       - **Часть 1**: Sales Rank `1 - 25 000` (файлы `..._rank1_25k_page1.xlsx`, `..._rank1_25k_page2.xlsx`)
       - **Часть 2**: Sales Rank `25 001 - 50 000` (файлы `..._rank25k_50k_page1.xlsx`, `..._rank25k_50k_page2.xlsx`)
     * **Buy Box Price**: от `15 €` до `100 €` (`#numberFrom-BUY_BOX_SHIPPING_current` / `#numberTo-BUY_BOX_SHIPPING_current`)
     * **New Offer Count**: от `3` до `15` продавцов (`#numberFrom-COUNT_NEW_current` / `#numberTo-COUNT_NEW_current`)
     * *(Фильтр Amazon Out of Stock строго отключен)*
   - Нажимается кнопка *"FIND PRODUCTS"*.
   - Ожидается формирование таблицы результатов.
   - **Лимит строк таблицы (5000 rows)**: переключать меню строк (`#tool-row-menu li[data-value="5000"]`) в максимальный режим.
   - **Обязательное ожидание стабилизации и защита от плейсхолдеров (Анти-0 rows экспорт)**:
     * При переключении на 5000 строк и при клике `Next` Keepa отображает скелетон-плейсхолдеры (`- 0 - -`) в течение 15–25 секунд.
- **Контроль квоты токенов Keepa (Quota / Tokens Left)**:
  * Каждая выгрузка 5000 строк списывает квоту токенов аккаунта. Текущий процент квоты отображается в тулбаре (`#widget__bucket_quota`, например, `Quota: 5%`).
  * При исчерпании квоты (0% или предупреждение в диалоге экспорта) Keepa блокирует скачивание Excel.
  * Скрипт обязан проверять квоту перед выгрузкой и в диалоге экспорта: при нехватке токенов скрипт останавливается и **явно выводит пользователю текущий остаток квоты и сообщение о необходимости подождать восстановления токенов** (квота пополняется Keepa поминутно).
4. **Фаза 1: Сбор и сохранение всех страниц выгрузки на диск**:
   - Для каждой части (`1-25k` и `25k-50k`):
     * Для каждой страницы (от `1` до `2`):
       - Проверяется статус квоты в тулбаре Keepa.
       - Ожидается полное исчезновение оверлея загрузки и появление строк.
       - Нажимается кнопка *"Export"*.
       - В диалоге экспорта активируется радиокнопка *"All active columns"* (`#allCh-radio`).
       - Скачивается файл `.xlsx` с суффиксом диапазона и страницы.
       - Нажимается кнопка *"Next"* (`div[ref="btNext"]`) для перехода к следующей порции из 5000 товаров.
   - **Браузер завершает работу и закрывается (`browser.close()`) только после того, как все файлы сохранены на диск.**
5. **Промежуточный шаг: Краткое самари и проверка глазами**:
   - ИИ выводит список скачанных файлов, их размер, количество строк и диапазон.
   - **ИИ останавливается и запрашивает подтверждение у пользователя**, чтобы разработчик мог открыть и визуально проверить полученные таблицы перед внесением изменений в БД.
6. **Фаза 2: Последовательный импорт файлов в БД и итоговое сравнение**:
   - Только после явного подтверждения пользователя запускается последовательный импорт файлов через `backend/scripts/parse-keepa.ts`.
   - Делается контрольный замер строк в базе данных до и после.
   - Выводится наглядный отчет о количестве реально добавленных записей (было → стало → прирост `+X`).
