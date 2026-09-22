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
3. **`CandidatesProductsView`** — для сводной группировки товаров по производителям, брендам, продавцам, кодам EAN (`eans`), дистрибьюторам (`distributors`) и отбора кандидатов под оптовую закупку (Wholesale).
4. **`ContractedProductsView`** — поштучный вывод топ-товаров брендов в работе (`BrandStatus = 'CONTRACTED'`) с расчетом чистой оптовой цены закупки (`netPrice`), себестоимости с налогами (`grossPrice` / `costPrice`), комиссий Amazon (`amazonFees`), чистой прибыли (`netProfit`), ROI (%) и маржинальности (Margin %).

Использование в SQL:
```sql
SELECT * FROM "AsinView";
SELECT * FROM "CandidatesProductsView";
SELECT * FROM "ContractedProductsView" ORDER BY "netProfit" DESC NULLS LAST;
```

Использование через Prisma Client:
```typescript
const asins = await prisma.asinView.findMany();
const contractedTop = await prisma.contractedProductsView.findMany({
  orderBy: { netProfit: 'desc' },
});
```

## Снапшоты цен дистрибьюторов (`DistributorPriceSnapshot`)

Для учета динамики изменения цен в прайс-листах поставщиков создана модель `DistributorPriceSnapshot`:
- `priceNetto` — базовая оптовая цена из прайс-листа в евро без налогов.
- `costPrice` — итоговая расчетная себестоимость закупки с учетом испанских налогов (`priceNetto * 1.262`: 21% IVA + 5.2% Recargo de Equivalencia).
- `distributorId` — связь с поставщиком `Distributor`.
- `asinId` и `ean` — привязка к товару в нашей базе данных.

Импорт прайс-листа выполняется скриптом:
```bash
npx tsx scripts/import-distributor-prices.ts <путь_к_прайсу.xls> <Имя_дистрибьютора>
```
При импорте:
- Все сопоставленные ASIN автоматически добавляются в очередь запросов Keepa (`RequestProductQueue`) с наивысшим приоритетом `999999` для сбора свежих габаритов, FBA Fee и комиссий.
- Несопоставленные EAN (новинки фабрики, которых еще нет на Amazon) сохраняются в файл `other/distributor_screening/<дистрибьютор>/<дистрибьютор>_unmatched_eans.txt` для анализа позиций под создание новых карточек с монопольным Buy Box. Повторная выгрузка через Keepa по ним не запускается, так как карточки физически отсутствуют на маркетплейсе.

Поиск и проверка закупочных цен по ASIN или EAN для навыка анализа товара:
```bash
npx tsx scripts/get-distributor-snapshot.ts <ASIN_или_EAN>
```

## Нормализация регистра брендов и производителей (UPPERCASE)

Для предотвращения дублирования данных названия брендов (`Brand.name`) и производителей (`Manufacturer.name`) строго приводятся к **верхнему регистру (UPPERCASE)** во всех скриптах парсинга и сервисах.
В PostgreSQL созданы функциональные уникальные индексы:
```sql
CREATE UNIQUE INDEX "Brand_name_upper_idx" ON "Brand"(UPPER(TRIM("name")));
CREATE UNIQUE INDEX "Manufacturer_name_upper_idx" ON "Manufacturer"(UPPER(TRIM("name")));
```
Это гарантирует невозможность создания дубликатов с разным регистром (например, `Safta` и `SAFTA`).

## Управление схемой БД (Prisma Migrations)

> [!IMPORTANT]
> При выполнении команды `npx prisma migrate dev` изменения схемы применяются к базе данных, указанной в переменной окружения `DATABASE_URL` в файле `backend/.env`. 
> В текущей конфигурации БД находится на удаленном сервере (Huawei) в сети Tailscale (например, IP `100.92.50.18`), а не на вашем локальном компьютере.

## Миграции данных (Data Migrations)

Скрипты разового наполнения и связывания сущностей в БД размещаются в папке `backend/prisma/data-migrations/`:
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
- **Представления (Views)**: `backend/prisma/sql/views/`
  - `AsinView.sql`
  - `CandidatesProductsView.sql`
  - `PrivateLabelView.sql`
  - `ContractedProductsView.sql`
- **Функции (Functions)**: `backend/prisma/sql/functions/`
  - `calculate_max_buy_price.sql`
  - `get_asin_filter_reason.sql`
  - `check_brand_seller_dominance.sql`
  - `check_probable_private_label.sql`
  - `get_contracted_products.sql`

## Расчет расходов и маржинальности товаров в работе (`ContractedProductsView`)

Представление `ContractedProductsView` и функция `get_contracted_products` поштучно анализируют товары брендов со статусом `CONTRACTED`:
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
1. Правки вносятся напрямую в эталонный файл в `backend/prisma/sql/`.
2. Создается новая миграция Prisma: `npx prisma migrate dev --create-only --name <name>`.
3. Содержимое эталонного файла копируется в `migration.sql`.
4. Миграция применяется: `npx prisma migrate dev`.

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
