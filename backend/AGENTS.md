# Правила и инструкции для подпроекта Backend

## Архитектура базы данных и представления (Views)

В базе данных PostgreSQL настроены представления для быстрого и удобного доступа к данным:

1. **`AsinView`**:
   - Назначение: удобная выборка товаров ASIN с базовыми полями без избыточных колонок.
   - Поля:
     - `id` (Int, уникальный ID ASIN)
     - `asin` (String, код ASIN товара)
     - `brand` (String, название бренда)
     - `seller` (String, имя продавца из связанной таблицы Seller)
     - `buyBoxSeller` (String, текстовая строка BuyBox продавца из последнего снапшота Keepa)
     - `price` (Float, актуальная цена Buy Box)
   - Доступ через Prisma: `prisma.asinView.findMany()`

2. **`PrivateLabelView`**:
   - Назначение: просмотр связок брендов и продавцов (приватные лейблы).

3. **`WholesaleCandidatesView`**:
   - Назначение: сводный анализ и группировка товаров ASIN по производителям, брендам, продавцам и причинам фильтрации для отбора кандидатов под оптовую торговлю (Wholesale).

## Правила парсинга продавцов Keepa

- **Формат строки продавца в Keepa**: `Seller Name (80%) / SELLER_ID` или `Seller Name / SELLER_ID`.
- **Рейтинг в процентах**: Число в скобках (например, `(80%)`) — это процент положительных отзывов продавца (Positive Feedback Rating) на Amazon, а не доля Buy Box.
- **Логика извлечения продавца (`parseSellerInfo`)**:
  - `sellerName` — чистое наименование продавца без рейтинга (например, `paramount city`).
  - `sellerId` — уникальный Amazon Seller ID (например, `A2125XITGCFM0Q`).

## Логика фильтрации ASIN (`get_asin_filter_reason`)

Функция `get_asin_filter_reason(p_asin_id INT, p_dominant_threshold INT DEFAULT 90, p_min_winner_count INT DEFAULT 4)` возвращает причину отсева товара или `NULL`, если товар подходит:
1. `NO_BUYBOX_DATA` — отсутствуют снапшоты данных BuyBox по товару.
2. `BUYBOX_MATCH_BRAND` — имя продавца в BuyBox содержит название бренда.
3. `BUYBOX_MATCH_MANUFACTURER` — имя продавца в BuyBox содержит название производителя.
4. `PRIVATE_LABEL` — связка Бренд + Продавец подтверждена в таблице `PrivateLabel`.
5. `FEW_BUYBOX_WINNERS` — количество победителей BuyBox за 90 дней (`buyBoxWinnerCount90Days`) строго меньше порога (по умолчанию `< 4` или `<= 3`, т.е. 1, 2 и 3 продавца отсеиваются; проходят товары только от 4 продавцов).
6. `DOMINANT_BUY_BOX_SELLER` — процент владения BuyBox у топового продавца за 90 дней (`buyBoxTopSeller90Days`) `>= 90%` (листинг монополизирован).
7. `NULL` — товар проходит фильтрацию.

## Эталонные файлы SQL-объектов (`prisma/sql/`)

Для каждого объекта базы данных (представления, хранимые функции) в проекте ведется эталонный SQL-файл:
- **Представления (Views)**: `backend/prisma/sql/views/`
  - `AsinView.sql`
  - `WholesaleCandidatesView.sql`
  - `PrivateLabelView.sql`
- **Функции (Functions)**: `backend/prisma/sql/functions/`
  - `get_asin_filter_reason.sql`
  - `check_probable_private_label.sql`

## Правила работы с миграциями Prisma и эталонными файлами

1. **Двойное внесение изменений (Эталон + Миграция)**:
   - При любом изменении SQL-функции или представления **в первую очередь** редактируется соответствующий эталонный файл в `backend/prisma/sql/` (чтобы в Git был виден чистый диф изменений объекта).
   - Затем создается новая миграция Prisma (`npx prisma migrate dev --create-only --name <name>`), куда дублируется обновленный SQL код.
   - Миграция применяется командой `npx prisma migrate dev`.
2. **Неизменность существующих миграций**: Никогда не изменять старые файлы миграций в `prisma/migrations`.

