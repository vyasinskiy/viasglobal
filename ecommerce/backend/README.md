## Персистентная приоритетная очередь Keepa API (`KeepaRequestQueue`)

Для предотвращения исчерпания токенов Keepa и потери задач при рестартах все HTTP-запросы к Keepa API обрабатываются через персистентную очередь в PostgreSQL:
- **`CRITICAL` (100)**: Интерактивные вызовы от пользователя (`POST /keepa/enqueue/:asin`). Выполняются первыми и имеют право расходовать токены из резерва.
- **`HIGH` (50)**: Экспорт витрины продавца или бренда (`exportBrand`, `exportSeller`).
- **`NORMAL` (10)**: Фоновый сбор сырых данных по товарам пачками (`enqueueNextWholesaleAsins`).
- **`LOW` (1)**: Массовый поиск по категориям Product Finder (`exportCategory`, `exportCategoryAll`).
- **Резерв в 10 токенов**: Задачи с приоритетом ниже `CRITICAL` запускаются только при балансе токенов `> 10 + cost`. Резерв всегда сохраняется для срочных задач.

## База данных и представления (Views)

В схеме Prisma и базе данных PostgreSQL созданы представления:
1. **`AsinView`** — для удобной выборки ASIN со штрихкодом производителя EAN (`asin`, `ean`, `brand`, `seller`, `buyBoxPrice`, `maxBuyPrice`).
2. **`PrivateLabelView`** — для просмотра подтвержденных связок бренд-продавец с подробными заметками анализа (`notes`).
3. **`CandidatesProductsView`** и **`WholesaleCandidatesView`** — сводный анализ каталога под оптовую закупку (Wholesale) со строгой группировкой **1 запись на бренд и производителя**. Все селлеры схлопнуты в единый список (`sellerNames`), выведена метрика числа селлеров (`sellerCount`), число чистых ASIN без фильтра (`cleanAsinCount`), причины отсева (`filterReasons`) и готовый список чистых ASIN (`cleanAsins`). `WholesaleCandidatesView` служит официальным алиасом для аналитики. Из обоих представлений **автоматически исключаются бренды в работе (`BrandStatus = 'CONTRACTED'`, например Safta, Cofan, Kuken)** и бренды без дистрибьюторов в ЕС (`NO_EU_DISTRIBUTOR`).
4. **`ContractedFilteredProductsView`** и **`ContractedAllProductsView`** — поштучный вывод товаров брендов в работе (`BrandStatus = 'CONTRACTED'`) с расчетом чистой оптовой цены закупки (`netPrice`), себестоимости с налогами (`grossPrice` / `costPrice`), комиссий Amazon (`amazonFees`), чистой прибыли (`netProfit`), ROI (%) и маржинальности (Margin %):
   - `ContractedFilteredProductsView`: со строгими оптовыми фильтрами (`BSR <= 100 000`, `Amazon <= 50%`, `BuyBox >= 10 €`).
   - `ContractedAllProductsView`: **все товары бренда в работе без фильтров**, включая новинки с `salesRank IS NULL`, товары с высоким BSR и позиции с низкой ценой.
   - **Колонки ликвидности и статуса расчета комиссий**:
     * `boughtInPastMonth` — число покупок за прошлый месяц по счетчику Amazon («X+ bought in past month»). Актуально при дате снапшота до 1 месяца.
     * `estimatedMonthlySales` — локальная оценка продаж в месяц по динамике падений ранга Keepa (`salesRankDropsLast90Days / 3`), локальный аналог Est. Sales от SellerAmp.
     * `feeStatus` — статус жизненного цикла расчета комиссий (`NULL`, `KEEPA_REQUESTED`, `KEEPA_SUCCESS`, `KEEPA_UNKNOWN`, `SUPPLIER_ENRICHING`, `SUPPLIER_SUCCESS`, `FAILED`).

Использование в SQL:
```sql
SELECT * FROM "AsinView";
SELECT * FROM "CandidatesProductsView";
SELECT * FROM "WholesaleCandidatesView"; -- Алиас CandidatesProductsView без брендов в работе
SELECT * FROM "ContractedFilteredProductsView" ORDER BY "boughtInPastMonth" DESC NULLS LAST, "netProfitPerUnit" DESC NULLS LAST;
SELECT * FROM "ContractedAllProductsView" ORDER BY "boughtInPastMonth" DESC NULLS LAST, "profitCoefficient" DESC NULLS LAST;
```

Использование через Prisma Client:
```typescript
const asins = await prisma.asinView.findMany();
const contractedFiltered = await prisma.contractedFilteredProductsView.findMany({
  orderBy: { netProfitPerUnit: 'desc' },
});
const contractedAll = await prisma.contractedAllProductsView.findMany({
  orderBy: { netProfitPerUnit: 'desc' },
});
```

## Снапшоты цен дистрибьюторов (`DistributorPriceSnapshot`) и расчет минимальной партии

Для учета динамики изменения цен в прайс-листах поставщиков создана модель `DistributorPriceSnapshot`:
- `priceNetto` — базовая оптовая цена из прайс-листа в евро без налогов.
- `costPrice` — итоговая расчетная себестоимость закупки с учетом испанских налогов (`priceNetto * 1.262`: 21% IVA + 5.2% Recargo de Equivalencia).
- `distributorId` — связь с поставщиком `Distributor`.
- `asinId` и `ean` — привязка к товару в нашей базе данных.
- `unitsPerBox` — физическая вместимость стандартной заводской упаковки / коробки в штуках (`EMBALAJE` у Cofan, `UNI CAJA STD` у Safta).
- `minBoxOrder` — минимальный объем партии закупки в **штуках** (total units). Вычисляется как `unitsPerBox * minBoxEnvases` (для поставщиков с кратностью заказа в коробках, например Cofan `ENVASE MÍNIMO`) либо равен прямому числу штук в коробке (для Safta, где заказ кратен стандартным коробкам).

### Логика расчета минимальной партии в представлениях `Contracted*View`:
В SQL-функциях `get_contracted_all_products` и `get_contracted_products`:
- **Стоимость минимальной партии брутто**: `minBoxOrderGross = costPrice * COALESCE(minBoxOrder, unitsPerBox, 1)`
- **Стоимость минимальной партии нетто**: `minBoxOrderNetto = priceNetto * COALESCE(minBoxOrder, unitsPerBox, 1)`
- **Чистая прибыль с минимальной партии**: `netProfitPerMinBoxOrder = netProfitPerUnit * COALESCE(minBoxOrder, unitsPerBox, 1)`
- **Коэффициент отдачи на капитал**: `profitCoefficient = netProfitPerMinBoxOrder / minBoxOrderGross` (показывает, сколько евро чистой прибыли генерирует каждый 1 евро, инвестированный в выкуп минимальной партии).

Импорт прайс-листа выполняется скриптом:
```bash
npx tsx scripts/import-distributor-prices.ts <путь_к_прайсу.xls> <Имя_дистрибьютора>
```
При импорте:
- Все сопоставленные ASIN автоматически добавляются в очередь запросов Keepa (`RequestProductQueue`) с наивысшим приоритетом `999999` для сбора свежих габаритов, FBA Fee и комиссий.
- Несопоставленные EAN (новинки фабрики, которых еще нет на Amazon) сохраняются в файл `ecommerce/contractors/<дистрибьютор>/unmatched_eans.txt` для анализа позиций под создание новых карточек с монопольным Buy Box. Повторная выгрузка через Keepa по ним не запускается, так как карточки физически отсутствуют на маркетплейсе.

Поиск и проверка закупочных цен по ASIN или EAN для навыка анализа товара:
```bash
npx tsx scripts/get-distributor-snapshot.ts <ASIN_или_EAN>
```

## Интеграция с почтой поставщиков (Hostinger IMAP) и база знаний CRM

Для автоматического сбора условий сотрудничества, поиска переписки с менеджерами фабрик и извлечения порогов бесплатной доставки (*franco de portes*) реализована почтовая подсистема:
- **`DistributorContact`**: таблица контактных лиц и менеджеров (`name`, `email`, `phone`, `role`, `isPrimary`). Создается автоматически при получении писем от новых представителей фабрики.
- **`DistributorEmail`**: таблица истории входящих и исходящих писем (`messageId`, `fromEmail`, `fromName`, `subject`, `date`, `bodyText`, `hasAttachments`, `attachments`). Защищена от дублирования уникальным `messageId`.
- **Поле `domains` у `Distributor`**: список доменов компании (например, `["alfadyser.es", "alfadyser.com"]`) для умного авто-связывания писем от любых новых менеджеров.

### Скрипты работы с почтой:

1. **Синхронизация входящих писем из Hostinger в локальную БД**:
```bash
cd ecommerce/backend && npx tsx scripts/sync-emails.ts [--limit 30]
```
Скрипт подключается по IMAP к ящику Hostinger (`imap.hostinger.com:993`), считывает свежие письма, сопоставляет отправителей с базой дистрибьюторов, при необходимости регистрирует новых менеджеров в `DistributorContact`, а прикрепленные прайс-листы Excel и PDF сохраняет в папку `ecommerce/contractors/<поставщик>/attachments/`.

2. **Быстрый поиск условий и переписки в локальной БД**:
```bash
cd ecommerce/backend && npx tsx scripts/search-distributor-emails.ts --distributor "Kuken" --query "portes"
```
Параметры:
- `--distributor` (`-d`): фильтрация по имени контрагента (например: `"Kuken"`, `"Cofan"`, `"Safta"`).
- `--query` (`-q`): ключевое слово для поиска (*portes, franco, pedido mínimo, entrega, catálogo*).
- `--limit` (`-l`): лимит выводимых писем (по умолчанию 10).

## Нормализация регистра брендов и производителей (UPPERCASE)

Для предотвращения дублирования данных названия брендов (`Brand.name`) и производителей (`Manufacturer.name`) строго приводятся к **верхнему регистру (UPPERCASE)** во всех скриптах парсинга и сервисах.
В PostgreSQL созданы функциональные уникальные индексы:
```sql
CREATE UNIQUE INDEX "Brand_name_upper_idx" ON "Brand"(UPPER(TRIM("name")));
CREATE UNIQUE INDEX "Manufacturer_name_upper_idx" ON "Manufacturer"(UPPER(TRIM("name")));
```
Это гарантирует невозможность создания дубликатов с разным регистром (например, `Safta` и `SAFTA`).

## Маппинг вариаций производителей из Keepa (`ManufacturerAlias`)

Для устранения расхождений в написании названий производителей из выгрузок Keepa создана таблица `ManufacturerAlias` и сервис `ManufacturerMappingService`:
- **Связка вариаций**: Связывает любые сырые написания Keepa (с вендор-кодами Vendor Central в скобках типа `COFAN (COFB0)`, правовыми суффиксами `SAFTA, S.A.` или счетчиками товаров автодополнения) с каноническим производителем `Manufacturer`.
- **Автоматическое обучение и расширение**: При обнаружении новой вариации сервис автоматически нормализует имя через `normalizeManufacturerName`, находит производителя и дополняет мапу алиасов, исключая повторную нормализацию при последующих импортах.
- **Интеграционные тесты**: Проверяют кейсы `COFAN`, `SAFTA`, `ALFA DYSER` и динамическое добавление новых неожиданных карточек товаров (`src/keepa/manufacturer-mapping.spec.ts`).

## Управление схемой БД (Prisma Migrations)

> [!IMPORTANT]
> При выполнении команды `npx prisma migrate dev` изменения схемы применяются к базе данных, указанной в переменной окружения `DATABASE_URL` в файле `ecommerce/backend/.env`. 
> В текущей конфигурации БД находится на удаленном сервере (Huawei) в сети Tailscale (например, IP `100.92.50.18`), а не на вашем локальном компьютере.

## Миграции данных (Data Migrations)

Скрипты разового наполнения и связывания сущностей в БД размещаются в папке `ecommerce/backend/prisma/data-migrations/`:
- **Приватные лейблы**: добавление связок `Brand` + `Seller` в `PrivateLabel`.
- **Дистрибьюторы**: добавление дистрибьютора (`Distributor`) и привязка к нему товаров (`ASIN`).
  - Поиск товаров по EAN ведется напрямую в таблице `ProductFinder` (связь с `ASIN.productFinders`).
  - **100% валидация**: скрипт строго проверяет, чтобы все переданные EAN были найдены в БД (`foundAsins.length === targetEans.length`). Если хотя бы одного товара нет в базе, выбрасывается `Error` и транзакция не сохраняется, предотвращая потерю товаров.

## Воронка коммуникаций с дистрибьюторами (DistributorStatus)

В модели `Distributor` поддерживаются поля для фиксации этапов диалога:
- `status`: `NEW` -> `FORM_SUBMITTED` -> `EMAIL_SENT` -> `CALLED` -> `ACCOUNT_OPENED` / `REJECTED`.
- `email`, `phone`, `notes`, `rejectionReason`, `lastContactAt`.

## Парсинг продавцов Keepa

При импорте выгрузок Keepa строка продавца Buy Box (например, `paramount city (80%) / A2125XITGCFM0Q`) обрабатывается функцией `parseSellerInfo`:
- `(80%)` — рейтинг положительных отзывов продавца (Positive Feedback Rating) на Amazon, отсекается при сохранении названия продавца.
- `sellerName` — чистое название магазина (например, `paramount city`).
- `sellerId` — уникальный Amazon Seller ID (например, `A2125XITGCFM0Q`).

## Фильтрация ASIN (`get_asin_filter_reason`)

SQL-функция `get_asin_filter_reason(p_asin_id INT, p_dominant_threshold INT DEFAULT 90, p_min_winner_count INT DEFAULT 4)` проверяет товар на критерии монополии и приватного лейбла:
- **`NO_BUYBOX_DATA`**: нет данных о BuyBox для ASIN.
- **`BUYBOX_MATCH_BRAND`**: продавец BuyBox содержит имя бренда.
- **`BUYBOX_MATCH_MANUFACTURER`**: продавец BuyBox содержит имя производителя.
- **`NO_EU_DISTRIBUTOR`**: у бренда отсутствует официальная дистрибьюторская сеть в ЕС (`Brand.status = 'NO_EU_DISTRIBUTOR'`).
- **`PRIVATE_LABEL`**: подтвержденный приватный лейбл (связка Бренд + Продавец).
- **`DOMINANT_BRAND_SELLER`**: целевой продавец удерживает Buy Box на >= 80% всех товаров каталога бренда в БД (проверка через хранимую функцию `check_brand_seller_dominance` при наличии обеих выгрузок Keepa).
- **`FEW_BUYBOX_WINNERS`**: за последние 90 дней в BuyBox побеждало менее 4 продавцов (`buyBoxWinnerCount90Days < 4` или `<= 3`).
- **`DOMINANT_BUY_BOX_SELLER`**: топовый продавец удерживал BuyBox 90%+ времени за 90 дней (`buyBoxTopSeller90Days >= 0.90`; в БД хранится как `0.0..1.0`, функция автоматически конвертирует параметр `90` в `0.90`).
- **`NULL`**: товар полностью удовлетворяет критериям оптовой закупки.

## Тегирование ASIN (ASIN Tags)

Для выявления "мертвых" товаров или временно выпавших из продажи вариаций в системе реализовано автоматическое тегирование.
Когда скрипт обновляет данные по ASIN через Keepa API, товар помещается в очередь `AnalysisProductQueue`. 
Независимый воркер (`AnalysisService`) обрабатывает эту очередь:
- Анализирует историю продавцов в Buy Box (`buyBoxSellerIdHistory`).
- **`DEAD_VARIATION`**: ASIN является вариацией и не имел активных продавцов в Buy Box более **6 месяцев**.
- **`MISSING_VARIATION`**: ASIN является вариацией и не имел активных продавцов в Buy Box более **3 месяцев** (но менее 6 месяцев). Это потенциальные кандидаты на эксклюзивное восстановление продаж.

Эти теги автоматически исключают товары из выдачи оптовых кандидатов (`CandidatesProductsView`).

## Расчет максимальной цены закупки (`calculate_max_buy_price`)

SQL-функция `calculate_max_buy_price(p_asin_id INT, p_target_margin_pct FLOAT DEFAULT 10.0, p_inbound_shipping FLOAT DEFAULT 0.40, p_vat_rate FLOAT DEFAULT 21.0)`:
- Вычисляет предельную цену оптовой закупки товара у поставщика (Netto, без НДС) с учетом удержаний Amazon (FBA, Referral Fee 15%), налога IVA 21%, входящей логистики (0.40 €) и целевой маржи (10% по умолчанию).

## Анализ доминирования продавца над брендом (`check_brand_seller_dominance`)

SQL-функция `check_brand_seller_dominance(p_brand_id INT, p_seller_id TEXT, p_dominant_threshold FLOAT DEFAULT 80)`:
- Проверяет наличие обязательных выгрузок Keepa по бренду и по продавцу в таблице `KeepaExport`.
- Если хотя бы одна выгрузка отсутствует в базе, функция безопасно возвращает `false` (без выбрасывания ошибок), чтобы не блокировать первичный отбор товаров ASIN на сырых данных.
- Вычисляет долю листингов бренда, контролируемых целевым продавцом (порог >= 80%).
- Проверка наличия обеих выгрузок и требование загрузки файлов производятся на этапе детального ручного анализа связки через навык `verify-private-label`.

## Эталонные файлы SQL-объектов (`prisma/sql/`)

Для прозрачного отслеживания изменений (diff в Git) исходный код представлений и функций хранится в эталонных SQL-файлах:
- **Представления (Views)**: `ecommerce/backend/prisma/sql/views/`
  - `AsinView.sql`
  - `CandidatesProductsView.sql`
  - `PrivateLabelView.sql`
  - `ContractedFilteredProductsView.sql`
  - `ContractedAllProductsView.sql`
  - `KeepaExportView.sql`
- **Функции (Functions)**: `ecommerce/backend/prisma/sql/functions/`
  - `calculate_max_buy_price.sql`
  - `get_asin_filter_reason.sql`
  - `check_brand_seller_dominance.sql`
  - `check_probable_private_label.sql`
  - `get_contracted_products.sql`
  - `get_contracted_all_products.sql`
  - `get_candidates_products.sql`

### Валидация колонок и предотвращение рантайм-ошибок в SQL

В PostgreSQL функции на языке PL/pgSQL (`LANGUAGE plpgsql`) при создании через `CREATE OR REPLACE FUNCTION` проверяют лишь базовый синтаксис процедурного кода. Существование и точные имена колонок таблиц внутри тела запросов (`RETURN QUERY WITH ...`) **не проверяются во время компиляции**, а оцениваются только во время первого реального выполнения.

Для предотвращения рантайм-сбоев (например, ошибки `column snap.amazonOOS90Days does not exist`):
1. **Сверка с `schema.prisma`**: При написании сырого SQL всегда проверяются точные имена полей в моделях Prisma (например, `amazon90DaysOOS`, `buyBox90DaysOOS` — число 90 перед `DaysOOS`).
2. **Smoke-тесты в Jest**: В файле `ecommerce/backend/src/prisma/db-functions.spec.ts` настроен блок тестов, который выполняет `SELECT ... LIMIT 1` по всем существующим представлениям (Views) и табличным функциям базы данных. При выполнении обязательного шага тестирования (`npm test`) любые нестыковки в названиях колонок блокируют билд до выката в базу данных.
3. **Парсинг процентов Keepa и расчет доли Amazon (`amazon90DaysOOS`)**: В Excel процентные ячейки экспортируются как числа `0.0..1.0` (например, `1` = 100%, `0.56` = 56%), а в CSV — как строки с `%`. Функция `parseKeepaPercentage()` нормализует их к шкале `0..100`. SQL-функция `get_contracted_products` рассчитывает присутствие Amazon через `CASE WHEN s."amazon90DaysOOS" <= 1 THEN (1.0 - s."amazon90DaysOOS") ELSE (100.0 - s."amazon90DaysOOS") / 100.0 END`, поддерживая обе шкалы и защищая от ложного завышения доли присутствия Amazon.
4. **Эталонные тесты на конкретных строках и снапшотах («Прибивание гвоздями» / Golden Snapshot Tests)**: При добавлении новых правил отбора или исправлении ошибок на примере конкретной позиции (ASIN, EAN, строка прайс-листа или снапшот Keepa/дистрибьютора) в обязательном порядке создается отдельный автотест в `db-functions.spec.ts` с проверкой **точных эталонных цифр** (себестоимость, комиссии, прибыль, ROI, кванты коробки, BSR, доля Amazon). Тест буквально фиксирует («прибивает гвоздями») правильное поведение строки: если в будущем любая доработка или рефакторинг ломает поведение этого кейса, тест немедленно падает, явно указывая на проблему.
5. **Очистка производителей от вендор-кодов Amazon и унификация правовых форм (`normalizeManufacturerName`)**: В выгрузках Keepa поле `Manufacturer` часто содержит технические коды Amazon Vendor Central в скобках (`COFAN (COFB0)`, `MAMMUT (MAMQ3)`, `PURINA (PUTJ7)`) или разнобой в написании правовых форм (`ALFA DYSER S.L` vs `ALFA DYSER, S.L`). Функция `normalizeManufacturerName` автоматически отрезает вендор-коды и приводит правовые формы к единому эталону (`COFAN`, `ALFA DYSER, S.L.`), предотвращая создание дубликатов в таблице `Manufacturer` и рассинхронизацию с витриной магазина.
6. **Приоритет прибыльных товаров при сортировке каталога (`ContractedFilteredProductsView` / `ContractedAllProductsView`)**: В представлениях каталога товаров на контракте действует двухэтапная сортировка:
   - В самом верху отображаются **товары со строго положительной прибылью (`netProfitPerMinBoxOrder > 0`)**, отсортированные по бейджу подтвержденных заказов (`boughtInPastMonth DESC NULLS LAST` — быстрая оборачиваемость), величине прибыли с минимальной партии (`netProfitPerMinBoxOrder DESC NULLS LAST`) и BSR (`salesRank ASC NULLS LAST`).
   - Убыточные/минусовые позиции (`netProfitPerMinBoxOrder <= 0`) и товары без расчета (NULL) не исключаются из таблицы, но размещаются ниже всех прибыльных товаров, не засоряя верх выборки.


## Расчет расходов и маржинальности товаров в работе (`ContractedFilteredProductsView` / `ContractedAllProductsView`)

Представления `ContractedFilteredProductsView` / `ContractedAllProductsView` и функции `get_contracted_products` / `get_contracted_all_products` поштучно анализируют товары брендов со статусом `CONTRACTED`:
- `netPrice` — оптовая цена дистрибьютора без налогов.
- `grossPrice` / `costPrice` — себестоимость закупки с налогами (для испанского Autónomo: 21% IVA + 5.2% Recargo de Equivalencia = `netPrice * 1.262`).
- `amazonFees` — чистые комиссии площадки Amazon (`fbaFee` + `referralFee`).
- `vatOnFees` — 21% НДС на комиссии Amazon.
- **Учет налогового режима (Recargo vs SL)**:
  - На спецрежиме торговли **Recargo de Equivalencia** предприниматель не имеет права на вычет НДС (Deducción de IVA). При покупке услуг у Amazon Services Europe S.à r.l. (Люксембург) по правилу авто-реперкуссии (Inversión del sujeto pasivo) этот НДС декларируется через Modelo 309 и уплачивается в бюджет Испании без права возврата, становясь прямым расходом. Поэтому по умолчанию `p_include_vat_on_fees = TRUE`, и `vatOnFees` вычитается из прибыли:
    $$\text{netProfit} = \text{buyBoxPrice} - \text{amazonFees} - \text{vatOnFees} - \text{grossPrice}$$
  - При переходе на юридическое лицо (**SL / Sociedad Limitada**) или общую систему с правом зачета НДС параметр `p_include_vat_on_fees` выставляется в `FALSE`, НДС на комиссии перестает уменьшать прибыль и принимается к вычету.
- **Приоритет текущей цены полки над Buy Box**:
  - В расчетах привлекательности товара в приоритете всегда учитывается реальная текущая цена предложения на карточке товара (`Current Sale Price` в SellerAmp / `amazonCurrent` / `newCurrent`). Если на листинге сам Amazon выставил промо-цену со скидкой, покупатели берут у него, даже если из-за отложенной доставки Buy Box алгоритмически висит на стороннем продавце с завышенной ценой.
  - Оценка по цене `Buy Box` рассматривается как вторичный сценарий на случай, когда предложение Amazon распродано или отсутствует.
- **Обязательный контроль даты снапшота Keepa**:
  - При анализе товаров всегда выводится дата последнего снапшота Keepa.
  - Если снапшот старше 48 часов (или товар не попал в свежую выборку Keepa), дата подсвечивается как устаревшая с предупреждением `⚠️ [ДАННЫЕ УСТАРЕЛИ]`, так как цена и BSR могли существенно измениться. Свежие снапшоты помечаются как `✅ [АКТУАЛЬНО]`.

**Рабочий процесс внесения изменений:**
1. Правки вносятся напрямую в эталонный файл в `ecommerce/backend/prisma/sql/`.
2. Создается новая миграция Prisma: `npx prisma migrate dev --create-only --name <name>`.
3. Содержимое эталонного файла копируется в `migration.sql`.
4. Миграция применяется: `npx prisma migrate dev`.

## Подсистема E-Commerce CRM & WMS: Закупки, Приемка грузов, Складской учет и Продажи

В микросервис `backend` встроена полноценная система управления цепочкой поставок, партионного учета, складских остатков и юнит-экономики продаж, работающая в единой базе данных PostgreSQL с прямыми реляционными связями с дистрибьюторами (`Distributor`), каталогом товаров (`ASIN`) и снапшотами цен (`DistributorPriceSnapshot`).

### 1. Архитектура моделей базы данных

1. **`PurchaseOrder` и `PurchaseOrderItem`**:
   - Хранят заказы поставщикам и партии поставок (`orderNumber`, `orderDate`, `actualDeliveryDate`, `status`, `paymentMethod`).
   - Автоматически рассчитывают финансовые показатели партии:
     * `subtotalNetto` — сумма чистой базы без налогов и эко-тасы.
     * `totalEcoTasa` — суммарный экологический сбор RAEE (Canon medioambiental, 0.65 €/шт на электронику).
     * `taxAmount` — налоги по спецрежиму Recargo de Equivalencia (21% IVA + 5.2% RE = множитель 1.262).
     * `totalGross` — итоговая себестоимость партии брутто.
   - Фиксируют физические замеры заводской коробки товара: длина, ширина, высота в см (`packageLengthCm`, `packageWidthCm`, `packageHeightCm`) и вес брутто в граммах (`packageWeightG`).
2. **`WarehouseStock` (Остатки на складах)**:
   - Двухуровневая модель хранения:
     * **`SVH` (Склад временного хранения / оперативный буфер FBM)**: отсюда происходят ежедневные отправки заказов покупателям Amazon. По умолчанию при приемке на СВХ выделяется **3 штуки**. Страховой порог алерта: `minStockAlert = 1`.
     * **`MAIN` (Основной склад длительного хранения)**: сюда поступает остальной объем партии (например, 7 штук).
     * **`FBA`**: склад маркетплейса Amazon.
3. **`StockMovement` (Журнал движений)**:
   - Полный журнал складских операций с типами `RECEIPT` (приход от поставщика), `TRANSFER` (перемещение MAIN -> СВХ), `SALE_OUT` (списание под продажу на Amazon), `ADJUSTMENT` и `RETURN`.
4. **`SalesOrder`, `SalesOrderItem` и `BatchSalesAllocation`**:
   - Учет продаж на маркетплейсах (Amazon FBM/FBA).
   - Списание товара со склада СВХ.
   - **Партионный учет (FIFO) через `BatchSalesAllocation`**: каждая проданная единица привязывается к конкретной партии поставщика `PurchaseOrderItem`, фиксируя точную закупочную себестоимость партии и позволяя смотреть сквозную аналитику (какая партия куда и с какой прибылью была продана).
5. **`OrderDocument`**:
   - Хранение путей к сопутствующим файлам: накладным *Albarán*, счетам-фактурам *Factura*, чекам об оплате, фотофиксации заводских упаковок и замеров рулеткой.

---

### 2. Сценарии работы и CLI-скрипты

#### А. Просмотр заказов поставщика и расчет юнит-экономики
```bash
# Список всех заказов дистрибьютора:
cd ecommerce/backend && npx tsx scripts/orders.ts --distributor "Alfa Dyser" --list

# Детальная карточка заказа, состав и юнит-экономика партии vs Amazon BuyBox:
cd ecommerce/backend && npx tsx scripts/orders.ts --order "26ALV-0074072"
```

#### Б. Приемка товара от поставщика (Goods Receiving)
Навык: `.agents/skills/receive-shipment/`
```bash
# 1. Посмотреть чек-лист ожидаемых товаров по Albarán:
cd ecommerce/backend && npx tsx scripts/receive-shipment.ts --order "26ALV-0074072" --check

# 2. Зафиксировать фактические замеры, пересчет и распределение (3 на СВХ, 7 на MAIN):
cd ecommerce/backend && npx tsx scripts/receive-shipment.ts --order "26ALV-0074072" \
  --item "34316:10:28:10:22:850:3:7" \
  --item "35536:10:30:12:16:1200:3:7" \
  --photos "../contractors/kuken/attachments/albaran_photo.jpg,../contractors/kuken/attachments/secador_box.jpg"
```

#### В. Складские остатки и система алертов пополнения СВХ
```bash
# Просмотр остатков на складах:
cd ecommerce/backend && npx tsx scripts/inventory.ts --stocks

# Проверка алертов окончания товара на СВХ (<= 1 шт):
cd ecommerce/backend && npx tsx scripts/inventory.ts --alerts

# Пополнение буфера СВХ с Основного склада (MAIN):
cd ecommerce/backend && npx tsx scripts/inventory.ts --transfer --sku 34316 --from MAIN --to SVH --qty 3
```

#### Г. Регистрация продаж на Amazon (списание с СВХ и партионный учет)
```bash
cd ecommerce/backend && npx tsx scripts/record-sale.ts \
  --order "402-1234567-8901234" \
  --sku "34316" \
  --qty 1 \
  --price 26.70 \
  --fee 4.01 \
  --shipping 4.50 \
  --city "Valencia"
```
*Если после списания остаток на СВХ опустился до $\le 1$ шт, скрипт выводит немедленное предупреждение о необходимости перемещения со склада MAIN.*

---

## Project setup


```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
