# Алгоритм проверки Private Label (Связка Бренд + Продавец)

Данный бизнес-процесс описывает шаги для программного подтверждения гипотезы о том, что конкретный продавец торгует определенным брендом по модели Private Label (является владельцем или эксклюзивным дистрибьютором).

---

## Шаг 1: Автоматическая проверка через функцию `get_asin_filter_reason`
В нашей базе данных настроена функция `get_asin_filter_reason`, которая уже встроена в представление `WholesaleCandidatesView` и автоматически проверяет базовые признаки Private Label для каждого товара:

* **`BUYBOX_MATCH_BRAND`**: Имя продавца в BuyBox содержит название бренда (например, бренд `Paramount City` и продавец `Paramount City`).
* **`BUYBOX_MATCH_MANUFACTURER`**: Имя продавца в BuyBox содержит название производителя.
* **`PRIVATE_LABEL`**: Связка Бренд + Продавец уже подтверждена и внесена в таблицу `PrivateLabel`.
* **`DOMINANT_BRAND_SELLER`**: Продавец удерживает Buy Box на >= 80% каталога бренда (рассчитывается функцией `check_brand_seller_dominance` при наличии обеих выгрузок Keepa).

> **Результат шага 1**: Если для товаров бренда функция `get_asin_filter_reason` возвращает статус `BUYBOX_MATCH_BRAND`, `BUYBOX_MATCH_MANUFACTURER` или `DOMINANT_BRAND_SELLER`, связка **автоматически подтверждается** как Private Label / монополия продавца.

---

## Шаг 2: Требование двух выгрузок Keepa и анализ в БД
Для достоверного анализа связки в БД **ОБЯЗАТЕЛЬНО требуются 2 выгрузки Keepa**:
1. **Выгрузка по бренду**: полный каталог товаров бренда на Amazon (`KeepaExport` с `brandId`).
2. **Выгрузка по продавцу**: витрина товаров продавца на Amazon (`KeepaExport` с `sellerId`).

Если хотя бы одна выгрузка отсутствует, скрипт `verify-private-label.ts` прерывает работу и запрашивает недостающий файл.

Команда проверки связки:
```bash
cd backend && npx tsx scripts/verify-private-label.ts "<brandName>" "<sellerId_or_sellerName>"
```

В БД проверяются ключевые метрики для товаров целевого бренда:
1. **Эксклюзивные продажи:** Подсчет количества товаров бренда, где продавец является **единственным** на листинге (колонка `newOfferCountCurrent = 1` в таблице `ProductFinder`).
2. **Доминирование в BuyBox:** Подсчет количества товаров бренда, где целевой продавец удерживает BuyBox (колонка `buyBoxSeller` содержит имя продавца или `sellerId` совпадает с ID целевого продавца).

### Критерии подтверждения Private Label:
* Если продавец является единственным на листинге более чем для **50%** товаров бренда (`singleSellerItems / totalBrandItems > 0.5`), **ИЛИ**
* Если продавец удерживает BuyBox более чем на **80-90%** товаров бренда (`buyBoxWins / totalBrandItems >= 0.8`):
  
  $$\Rightarrow \text{Связка Бренд + Продавец подтверждается как } \mathbf{Private\ Label\ /\ Доминантный\ продавец}.$$

---

## Шаг 3: Анализ недоминантных продавцов и оценка для Wholesale
Если связка подтверждена как Private Label (доминирование целевого продавца >= 80%), но на 1-10% листингов присутствуют сторонние продавцы:
1. **Сравнение цен конкретных товаров**: Текущая цена BuyBox (`buyBoxCurrent`) сопоставляется **с собственной средней ценой за 90 дней (`buyBox90DaysAvg`)** и рекомендованной ценой (`listPriceCurrent`) для каждого конкретного товара (без некорректного усреднения цен разнородных товаров по всему каталогу).
2. **Оценка стабильности**: Анализируются метрики удержания листинга топовым продавцом за 90 дней (`buyBoxTopSeller90Days`) и количество продавцов (`buyBoxWinnerCount90Days`).
3. **Бизнес-вывод для нашей стратегии**:
   * Возможно, для сторонних продавцов продажа этих единичных товаров выгодна в рамках их штучной/специфической модели (остатки, штучный арбитраж).
   * **Но для нас бренд не подходит для оптовой торговли (Wholesale)**, так как 80-99% каталога монопольно контролируется одним продавцом, а открытая дистрибьюторская сеть отсутствует.

---

## Шаг 4: Запрос детальной информации о продавце с Amazon и сопоставление юрлица
Для окончательного подтверждения природы связки и фиксации юридических доказательств:
1. Запрашивается блок **"Детальная информация о продавце"** (*Información detallada sobre el vendedor*) со страницы продавца на Amazon:
   - Юридическое наименование (*Nombre de empresa*).
   - Страна и адрес регистрации (*Dirección empresarial*).
   - Номер реестра (*Número de registro mercantil*) и номер плательщика НДС (*Número de IVA / VAT*).
   - Контакты (телефон, email).
2. **Анализ**:
   - Сопоставление страны и адреса с родительской компанией бренда.
   - Проверка лингвистической связи названий (например, нидерландское *De Halve Garen BV* (пряжа) $\leftrightarrow$ испанское торговое имя *Hilos y Sueños* (нитки/пряжа) $\leftrightarrow$ бренд *Scheepjes*).
   - Проверка назначения номера VAT (например, `ESN...` - регистрация нерезидента в Испании для работы по FBA).

---

## Шаг 5: SQL-запрос для проверки метрик связки в БД

Выполните следующий SQL-запрос в PostgreSQL, подставив название проверяемого бренда и идентификатор/имя продавца:

```sql
-- SQL-запрос для проверки метрик Private Label по данным в БД
WITH brand_products AS (
    SELECT 
        a.id AS "asinId",
        a.code AS "asin",
        b.name AS "brandName",
        pf."newOfferCountCurrent",
        pf."buyBoxSeller",
        pf."sellerId",
        pf."buyBoxCurrent",
        pf."buyBox90DaysAvg",
        pf."listPriceCurrent"
    FROM "ASIN" a
    JOIN "Brand" b ON a."brandId" = b.id
    JOIN LATERAL (
        -- Берем самый актуальный снимок параметров товара
        SELECT *
        FROM "ProductFinder"
        WHERE "asinId" = a.id
        ORDER BY "createdAt" DESC
        LIMIT 1
    ) pf ON true
    WHERE UPPER(b.name) = UPPER('TOPCHANCES') -- Укажите название бренда
)
SELECT 
    -- Общее количество товаров бренда в базе данных
    COUNT(*) AS "totalBrandItems",
    -- Количество товаров с единственным продавцом на листинге
    COUNT(*) FILTER (WHERE "newOfferCountCurrent" = 1) AS "singleSellerItems",
    -- Процент товаров с единственным продавцом
    ROUND(COUNT(*) FILTER (WHERE "newOfferCountCurrent" = 1)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS "singleSellerPercent",
    -- Количество товаров, где целевой продавец удерживает BuyBox
    COUNT(*) FILTER (
        WHERE "sellerId" = 'A2125XITGCFMVZ' 
           OR "buyBoxSeller" ILIKE '%Paramount City%'
    ) AS "buyBoxWins",
    -- Процент удержания BuyBox целевым продавцом
    ROUND(COUNT(*) FILTER (
        WHERE "sellerId" = 'A2125XITGCFMVZ' 
           OR "buyBoxSeller" ILIKE '%Paramount City%'
    )::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS "buyBoxWinPercent",
    -- Итоговый вывод на основе критериев
    CASE 
        WHEN (COUNT(*) FILTER (WHERE "newOfferCountCurrent" = 1)::float / NULLIF(COUNT(*), 0)) > 0.5 
          OR (COUNT(*) FILTER (WHERE "sellerId" = 'A2125XITGCFMVZ' OR "buyBoxSeller" ILIKE '%Paramount City%')::float / NULLIF(COUNT(*), 0)) > 0.9 
        THEN 'ПОДТВЕРЖДЕНО: Private Label'
        ELSE 'НЕТ ПОДТВЕРЖДЕНИЯ: Wholesale'
    END AS "result"
FROM brand_products;
```

---

## Шаг 6: Дальнейшие действия в зависимости от вердикта

* **Вариант А: Если подтвержден Private Label**:
  * Фиксируем связку в базе данных через навык `add-private-label` (команда *"добавь приватный лейбл"*).
  * Все результаты юридического и статистического анализа сохраняются в текстовое поле **`notes`** таблицы `PrivateLabel`.
  * После этого товары этого бренда от данного продавца будут отсекаться со статусом `PRIVATE_LABEL`.

* **Вариант Б: Если подтвержден Wholesale (не Private Label)**:
  * Бренд признается перспективным оптовым кандидатом с конкурентным рынком продавцов.
  * Активируется навык поиска поставщиков `find-distributor` (команда *"найди дистрибьютора для бренда <BrandName>"*) для поиска официальных европейских B2B дистрибьюторов.
