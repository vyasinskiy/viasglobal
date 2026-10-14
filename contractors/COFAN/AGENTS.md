# Инструкции для ИИ (Cofan / COFAN)

- **Назначение**: Работа с испанским поставщиком и дистрибьютором Cofan (Cofan La Mancha S.A.).
- **Каталоги PDF**:
  - Полный генеральный каталог продукции: `https://www.cofan.es/catalogos/catalogo-general.pdf` (81 MB).
  - Каталог товаров для дома Cofan Home: `https://www.cofan.es/catalogos/catalogo-cofan-home-general.pdf` (35 MB).
  - Автотовары: `https://www.cofan.es/catalogos/catalogo-automocion.pdf`
  - Метизы и крепеж: `https://www.cofan.es/catalogos/catalogo-tornilleria.pdf`
  - Программа DAS: `https://www.cofan.es/catalogos/catalogo-puntos-das.pdf`
- **Личный кабинет B2B**:
  - Страница авторизации: `https://www.cofan.es/es/privatearea/login/`
  - URL кабинета: `https://www.cofan.es/es/area-privada/`
  - Сохранение браузерной сессии выполняется скриптом `contractors/COFAN/scripts/save-session.ts`, сессия пишется в `contractors/COFAN/auth/storage_state.json`.
  - В кабинете нет единой кнопки выгрузки тарифов, но в каждой карточке товара доступна таблица `REFERENCIAS` со структурой: `Referencia`, `EAN`, `PVP`, `Precio Neto`, `Stock`.
  - Для получения готового полного прайс-листа в Excel поставщик обычно отвечает на запрос торговому представителю Iván Urquizu (`ivan.urquizu@cofansa.es`).
- **Налоговый режим**:
  - Применяется испанский режим `Recargo de Equivalencia (R.E.)` (21% IVA + 5.2% R.E.). Мы не освобождены от R.E.
  - Расчет себестоимости закупки: `costPrice = netPrice * 1.262`.
- **Скилл и адаптер поставщика (`.agents/skills/cofan-adapter`)**:
  - Работает по двухэтапному принципу безопасности данных («Анти-слепые изменения»):
    1. Получение чистых оптовых цен `PRECIO NETO` по списку EAN/ASIN, расчет себестоимости с R.E. и формирование промежуточного Excel файла: `contractors/COFAN/reports/cofan_staging_prices_latest.xlsx`.
    2. Обязательное представление промежуточного файла пользователю для ручной проверки.
    3. Запуск импорта в базу данных (`DistributorPriceSnapshot`, связывание ASIN с дистрибьютором, очередь `RequestProductQueue`) ТОЛЬКО после явного текстового согласия пользователя.
    4. **Обязательная очистка временных файлов**: сразу после подтвержденного импорта в БД все временные staging-файлы, черновики отчетов и промежуточные JSON/Excel удаляются, чтобы не засорять репозиторий.
  - Точное сопоставление EAN: в карточке Cofan всегда искать строку таблицы `#tablaReferencia` строго по целевому EAN, чтобы не путать модификации/размеры одного товара.
