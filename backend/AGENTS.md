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

3. **`FilteredAsinResultsView`**:
   - Назначение: агрегированный анализ ASIN по производителям, брендам и причинам фильтрации.

## Правила парсинга продавцов Keepa

- **Формат строки продавца в Keepa**: `Seller Name (80%) / SELLER_ID` или `Seller Name / SELLER_ID`.
- **Рейтинг в процентах**: Число в скобках (например, `(80%)`) — это процент положительных отзывов продавца (Positive Feedback Rating) на Amazon, а не доля Buy Box.
- **Логика извлечения продавца (`parseSellerInfo`)**:
  - `sellerName` — чистое наименование продавца без рейтинга (например, `paramount city`).
  - `sellerId` — уникальный Amazon Seller ID (например, `A2125XITGCFM0Q`).

## Логика фильтрации ASIN (`get_asin_filter_reason`)

Функция `get_asin_filter_reason(p_asin_id INT, p_dominant_threshold INT DEFAULT 90, p_min_winner_count INT DEFAULT 3)` возвращает причину отсева товара или `NULL`, если товар подходит:
1. `NO_BUYBOX_DATA` — отсутствуют снапшоты данных BuyBox по товару.
2. `BUYBOX_MATCH_BRAND` — имя продавца в BuyBox содержит название бренда.
3. `BUYBOX_MATCH_MANUFACTURER` — имя продавца в BuyBox содержит название производителя.
4. `PRIVATE_LABEL` — связка Бренд + Продавец подтверждена в таблице `PrivateLabel`.
5. `FEW_BUYBOX_WINNERS` — количество победителей BuyBox за 90 дней (`buyBoxWinnerCount90Days`) строго меньше порога (по умолчанию `< 3`, критерий от 3 продавцов).
6. `DOMINANT_BUY_BOX_SELLER` — процент владения BuyBox у топового продавца за 90 дней (`buyBoxTopSeller90Days`) `>= 90%` (листинг монополизирован).
7. `NULL` — товар проходит фильтрацию.

## Правила работы с миграциями Prisma

- **Неизменность существующих миграций**: Никогда не изменять старые файлы миграций в `prisma/migrations`.
- **Новые изменения**: Создавать новые миграции строго через `npx prisma migrate dev --create-only --name <name>`, вносить изменения в SQL с русскими комментариями и применять через `npx prisma migrate dev`.
