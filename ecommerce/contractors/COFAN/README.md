# Поставщик Cofan (Cofan La Mancha S.A.)

Документация по взаимодействию и регистрации торгового счета у испанского дистрибьютора Cofan.

## Контактная информация

- **Торговый представитель (Delegado de ventas):** Iván Urquizu
- **Email:** `ivan.urquizu@cofansa.es`
- **Сайт поставщика:** [https://www.cofan.es/](https://www.cofan.es/)
- **Раздел каталогов:** [https://www.cofan.es/es/catalogos/](https://www.cofan.es/es/catalogos/)
- **Прямые ссылки на официальные PDF каталоги продукции:**
  - [Catálogo General (81 MB)](https://www.cofan.es/catalogos/catalogo-general.pdf) — полный единый каталог продукции.
  - [Catálogo Cofan Home (35 MB)](https://www.cofan.es/catalogos/catalogo-cofan-home-general.pdf) — товары для дома, сада и DIY.
  - [Catálogo Automoción](https://www.cofan.es/catalogos/catalogo-automocion.pdf) — автотовары и смазочные материалы.
  - [Catálogo Tornillería](https://www.cofan.es/catalogos/catalogo-tornilleria.pdf) — крепеж и метизы.
  - [Catálogo Puntos DAS](https://www.cofan.es/catalogos/catalogo-puntos-das.pdf) — продукция для магазинов-партнеров DAS.
- **Вход в B2B кабинет (Área privada):** [https://www.cofan.es/es/privatearea/login/](https://www.cofan.es/es/privatearea/login/) -> перенаправляет в `/es/area-privada/`.
- **Сессия авторизации:** Сохраняется в `ecommerce/contractors/COFAN/auth/storage_state.json` через Playwright.
- **Особенности отображения B2B цен в кабинете:**
  - Кнопка в шапке `Mostrar precios` / `Mostrar PVP` переключает режим отображения цен.
  - В веб-интерфейсе нет единого файла для скачивания персонального тарифа в Excel/CSV.
  - В карточке каждого товара под авторизацией открывается полная таблица `REFERENCIAS`:
    - `REFERENCIA` (артикул)
    - `EAN` (13-значный штрихкод)
    - `PVP/ud.` (рекомендованная розничная цена)
    - `PRECIO NETO` (наша индивидуальная закупочная цена со скидкой оптовика)
    - `STOCK` (наличие: `DISPONIBLE`)
    - `EMBALAJE` (количество единиц в одной заводской коробке -> `unitsPerBox`)
    - `ENVASE MÍNIMO` (минимальный заказ в коробках; в БД поле `minBoxOrder` сохраняется в штуках как `unitsPerBox * ENVASE MÍNIMO`)

---

## Коммерческие условия (Condiciones Comerciales)

- **Форма оплаты:** Giro a 30 días (банковский дебет / инкассо со счета с отсрочкой 30 дней).
- **Минимальный заказ для бесплатной доставки (Portes pagados):** 150 € (при заказе через веб-платформу).
- **Стоимость доставки при заказе менее 150 €:** 6 €.
- **Сроки доставки:** 24/48 часов.
- **Оформление заказов и просмотр цен:** онлайн через персональный кабинет после активации аккаунта.

---

## Налоговый статус (Recargo de Equivalencia)

- **Статус компании:** Autónomo в Испании (IAE 665).
- **Применяемый режим:** **Régimen Especial del Recargo de Equivalencia (R.E.)**.
- **Важно:** Мы **НЕ освобождены** от Recargo de Equivalencia. Все счета от Cofan выставляются с учетом испанского IVA + Recargo de Equivalencia (21% + 5.2%).
- Заполненный документ подтверждения режима R.E. приложен в файле `Comunicación_Exención_RERE.pdf`.

---

## Автоматизированный адаптер и скилл Cofan (`.agents/skills/cofan-adapter/`)

Для регулярной работы с ценами Cofan создан специализированный навык:
- [SKILL.md](file:///Users/usuario/code/viasglobal/.agents/skills/cofan-adapter/SKILL.md) — пошаговый регламент работы адаптера.
- `scripts/save-session.ts` — интерактивная авторизация и сохранение браузерной сессии.
- `scripts/fetch-cofan-prices.ts` — автоматический сбор оптовых цен `PRECIO NETO` по списку EAN/ASIN, расчет себестоимости с испанским налогом Recargo de Equivalencia (+26.2%) и формирование промежуточного Excel для ручной проверки.
- `scripts/import-cofan-to-db.ts` — безопасный импорт проверенных цен в БД (`DistributorPriceSnapshot`, связывание товаров ASIN и добавление в очередь Keepa). Запускается **строго после подтверждения пользователем**, после чего автоматически удаляет временные staging-файлы.

## Документооборот и файлы

- `sent_email.md` - первое отправленное письмо (перевод коммерческого визита в онлайн, запрос каталогов и условий).
- `received_email.md` - ответное письмо от Cofan с условиями сотрудничества и запросом документов для регистрации.
- `reply_email.md` - подготовленное ответное письмо с прикрепленными документами для активации аккаунта.
- `ORDEN_DOMICILIACION_ADEUDO_DIRECTO_SEPA_CORE_EDITABLE.pdf` - форма банковского дебета SEPA.
- `Comunicación_Exención_RERE.pdf` - заполненная форма уведомления о статусе в Recargo de Equivalencia.
- `auth/storage_state.json` - рабочая сохраненная сессия веб-кабинета Cofan.
- *Примечание:* промежуточные файлы (`reports/*`) создаются адаптером только на время ручной проверки пользователем и автоматически удаляются сразу после успешного импорта в базу данных для поддержания чистоты репозитория. Все актуальные цены и метрики маржинальности хранятся в БД и доступны через представление `ContractedAllProductsView`.
