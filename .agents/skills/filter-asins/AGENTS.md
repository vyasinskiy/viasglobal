# Инструкции для ИИ: Подпроект filter-asins

Этот файл содержит краткие правила и бизнес-логику для подпроекта фильтрации ASIN-ов. **Обязательно учитывай эту логику при написании кода или тестов.**

## Логика фильтрации (`get_asin_filter_reason`)
При проверке ASIN в базе данных функция `get_asin_filter_reason(p_asin_id INT, p_dominant_threshold INT DEFAULT 90, p_min_winner_count INT DEFAULT 4)` использует следующие метрики из выгрузки Keepa (`ProductFinder`):

1. **Критерий количества продавцов (`FEW_BUYBOX_WINNERS`):**
   - Используется поле `buyBoxWinnerCount90Days` (число победителей BuyBox за 90 дней).
   - Если `buyBoxWinnerCount90Days < 4` (т.е. `<= 3`) -> товар отсеивается как `FEW_BUYBOX_WINNERS` (критерий выборки: строго от 4 продавцов).

2. **Критерий доминирования топового продавца (`DOMINANT_BUY_BOX_SELLER`):**
   - Используется поле `buyBoxTopSeller90Days` (процент удержания BuyBox топовым продавцом за 90 дней).
   - Если `buyBoxTopSeller90Days >= 90%` -> товар отсеивается как `DOMINANT_BUY_BOX_SELLER` (монополия одного продавца).

3. **Логика Private Label (Бренд + Продавец):**
   - Связка `Brand + Seller` проверяется по таблице `PrivateLabel`. Если связь подтверждена, товар помечается как `PRIVATE_LABEL`.

4. **Текстовые совпадения:**
   - `BUYBOX_MATCH_BRAND` / `BUYBOX_MATCH_MANUFACTURER` — имя продавца содержит название бренда или производителя.
