<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## База данных и представления (Views)

В схеме Prisma и базе данных PostgreSQL созданы представления:
1. **`AsinView`** — для удобной выборки ASIN со штрихкодом производителя EAN (`asin`, `ean`, `brand`, `seller`, `buyBoxPrice`, `maxBuyPrice`).
2. **`PrivateLabelView`** — для просмотра подтвержденных связок бренд-продавец.
3. **`WholesaleCandidatesView`** — для сводной группировки товаров по производителям, брендам, продавцам и отбора кандидатов под оптовую закупку (Wholesale).

Использование в SQL:
```sql
SELECT * FROM "AsinView";
SELECT * FROM "WholesaleCandidatesView";
```

Использование через Prisma Client:
```typescript
const asins = await prisma.asinView.findMany();
```

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
- **`PRIVATE_LABEL`**: подтвержденный приватный лейбл (связка Бренд + Продавец).
- **`FEW_BUYBOX_WINNERS`**: за последние 90 дней в BuyBox побеждало менее 4 продавцов (`buyBoxWinnerCount90Days < 4` или `<= 3`).
- **`DOMINANT_BUY_BOX_SELLER`**: топовый продавец удерживал BuyBox 90%+ времени за 90 дней (`buyBoxTopSeller90Days >= 90`).
- **`NULL`**: товар полностью удовлетворяет критериям оптовой закупки.

## Расчет максимальной цены закупки (`calculate_max_buy_price`)

SQL-функция `calculate_max_buy_price(p_asin_id INT, p_target_margin_pct FLOAT DEFAULT 10.0, p_inbound_shipping FLOAT DEFAULT 0.40, p_vat_rate FLOAT DEFAULT 21.0)`:
- Вычисляет предельную цену оптовой закупки товара у поставщика (Netto, без НДС) с учетом удержаний Amazon (FBA, Referral Fee 15%), налога IVA 21%, входящей логистики (0.40 €) и целевой маржи (10% по умолчанию).

## Эталонные файлы SQL-объектов (`prisma/sql/`)

Для прозрачного отслеживания изменений (diff в Git) исходный код представлений и функций хранится в эталонных SQL-файлах:
- **Представления (Views)**: `backend/prisma/sql/views/`
  - `AsinView.sql`
  - `WholesaleCandidatesView.sql`
  - `PrivateLabelView.sql`
- **Функции (Functions)**: `backend/prisma/sql/functions/`
  - `calculate_max_buy_price.sql`
  - `get_asin_filter_reason.sql`
  - `check_probable_private_label.sql`

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
