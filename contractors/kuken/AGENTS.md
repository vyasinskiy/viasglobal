# Инструкции для ИИ (KUKEN / ALFA DYSER)

- **Контрагент**: ALFA DYSER, S.L. (дистрибьютор и правообладатель бренда бытовой техники и ухода KUKEN).
- **Контакты**: `alfa@alfadyser.es`, `atencionalcliente@alfadyser.com`, менеджер Guido (`guido@alfadyser.es`). Портал: `https://alfadyser.es/`.
- **Коммерческие условия и доставка (подтверждено 23.10.2026)**:
  - Порог бесплатной доставки (**Portes pagados / Franco**): **200 €** нетто (Base Imponible).
  - Способ оплаты: **SEPA Direct Debit B2B** (прямой банковский дебет / *domiciliación bancaria SEPA*). Подписанный мандат отправлен менеджеру Guido (`attachments/SEPA CORE ALFA 2.pdf`). Оплата списывается поставщиком напрямую со счета, без ручных переводов по проформе.
  - Первичный заказ для бесплатной доставки: 10 шт арт. `34316` (фен 2000W) + 10 шт арт. `35536` (утюг 2600W) = 272.40 € нетто (с эко-тасой) / 343.80 € с RE. Ожидается присвоение номера клиента, подтверждение заказа и выставление albarán / фактуры.
- **Прайс-листы поставщика**:
  - Персональный файл с заголовками: `contractors/kuken/viasglobal (1).xlsx`.
  - Исторический файл без заголовков: `contractors/kuken/viasglobal.xlsx`.
- **Структура колонок с заголовками (`viasglobal (1).xlsx`)**:
  - `ORD`: системный ID строки (например, 3802).
  - `CODE`: артикул / референс производителя (например, `34178`).
  - `DESCRIPCION ARTICULO`: наименование товара (`PLANCHA VAPOR 2200W...`).
  - `P.VENTA`: базовая чистая оптовая цена закупки **NETTO** (в евро без НДС).
  - `TASA`: обязательный экологический сбор (**эко-таса RAEE**, 0.65 € за единицу малой электроники/PAE).
  - `CAJA`: количество штук в коробке / минимальная кратность заказа (`1`).
  - `MARCA`: бренд (`KUKEN`).
  - `EAN13`: штрихкод **EAN** (13 цифр, например `8425160341787`).
- **Налоговый режим и расчет себестоимости с эко-тасой**:
  - В Испании согласно ст. 78 Ley 37/1992 del IVA экологический сбор RAEE включается в налогооблагаемую базу перед начислением НДС.
  - Налоговый режим: испанский **Recargo de Equivalencia (R.E.)** (21% IVA + 5.2% R.E. = коэффициент 1.262).
  - Чистая база с тасой: `effectiveNet = priceNetto + ecoTasa` (например: `12.37 + 0.65 = 13.02 €`).
  - Расчет себестоимости: `costPrice = round((priceNetto + ecoTasa) * 1.262, 2)` (например: `13.02 * 1.262 = 16.43 €`).
  - *Внимание*: расчет без учета эко-тасы занижает себестоимость на 0.82 € за единицу (`0.65 * 1.262 = 0.82 €`)!
- **Адаптер поставщика KUKEN (`.agents/skills/kuken-adapter/`)**:
  - Парсинг и генерация промежуточного Excel:
    ```bash
    cd backend && npx tsx ../.agents/skills/kuken-adapter/scripts/parse-kuken-prices.ts "../contractors/kuken/viasglobal (1).xlsx"
    ```
  - Промежуточный staging файл для проверки: `contractors/kuken/reports/kuken_staging_prices_<timestamp>.xlsx`.
  - Безопасный импорт в БД (строго после подтверждения пользователем):
    ```bash
    cd backend && npx tsx ../.agents/skills/kuken-adapter/scripts/import-kuken-to-db.ts "<путь_к_staging_файлу.xlsx>"
    ```
- **Связь сущностей в БД**:
  - Дистрибьютор в БД: `Alfadyser (Kuken)` (ID 5, статус: **`ACCOUNT_OPENED`**).
  - Бренд в БД: `KUKEN` (ID 504, статус: **`CONTRACTED`**).
  - Снапшоты цен: хранятся в `DistributorPriceSnapshot` с полями `priceNetto`, `ecoTasa`, `costPrice`, `unitsPerBox`, `minBoxOrder`.
  - Сопоставление с ASIN: 20 товаров привязаны к дистрибьютору и добавлены в `RequestProductQueue` с приоритетом `999999`.
  - Несопоставленные EAN: 8 новинок зафиксированы в `contractors/kuken/unmatched_eans.txt`.
