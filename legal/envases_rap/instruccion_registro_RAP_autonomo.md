# Инструкция: регистрация RAP по упаковке для autónomo (wholesale, Amazon Испания)

Ситуация: вы — autónomo в Испании, перепродажа товаров по модели wholesale
на Amazon. Уведомление Seller Central «Embalaje de España» требует номер
регистрации RAP даже при выборе «Amazon RAP: Pago en mi nombre» (оплата
через Amazon). Общее применение Регламента (ЕС) 2025/40 — с 12.08.2026.
Есть цифровая подпись FNMT. Цель — оформить всё самостоятельно,
без консалтинговой фирмы.

Правовая база:

- Real Decreto 1055/2022 от 27 декабря об упаковке и отходах упаковки:
  https://www.boe.es/buscar/act.php?id=BOE-A-2022-22690
- MITERD, раздел по упаковке:
  https://www.miteco.gob.es/es/calidad-y-evaluacion-ambiental/temas/prevencion-y-gestion-residuos/flujos/envases.html
- MITERD, Registro de Productores de Producto, секция envases (регистрация,
  годовая декларация, нововведения PPWR, контакты):
  https://www.miteco.gob.es/es/calidad-y-evaluacion-ambiental/temas/prevencion-y-gestion-residuos/registro-productores-producto/registro-productores-producto-seccion-envases.html
- Электронная приёмная MITERD (Sede electrónica):
  https://sede.miteco.gob.es/portal/site/seMITECO/

Важное уточнение: «без посредников» означает без консалтинговой фирмы,
но НЕ без SCRAP. Для записи в госреестр RPP обязательно приложить
сертификат членства в Системе коллективной расширенной ответственности
производителя (SCRAP — Sistema Colectivo de Responsabilidad Ampliada
del Productor). SCRAP — это не опциональный посредник, а обязательный
способ коллективного исполнения. Индивидуальный способ (sistema individual)
требует признания в Comunidad Autónoma + записи в Registro de Producción
y Gestión + финансовую гарантию — для autónomo нереалистично.

## Шаг 0. Подтвердить статус productor de producto (производителя)

Производителем считается тот, кто первым вводит упакованный товар
на испанский рынок (fabricante, importador, внутриЕС-приобретатель,
впервые вводящий товар в Испании) — ст. 2.t) RD 1055/2022, с изменением
определения с 12.08.2026 Регламентом (ЕС) 2025/40 (см. раздел Novedades
на странице RPP сайта MITERD).

Случаи для wholesale:

- Импорт из-за пределов ЕС либо покупка внутри ЕС и первая продажа
  в Испании — производитель вы.
- Покупка у испанского поставщика, который уже задекларировал эту упаковку:
  производитель — он, но Amazon Испания всё равно требует номер RAP
  от продавца, а платформы проверяют вас по публичному списку RPP.
  На практике — регистрироваться.

Категории для декларирования: envase doméstico (доходит до конечного
потребителя), comercial и industrial (транспортные коробки, паллеты,
стрейч-плёнка). Учитывайте и упаковку самого товара, и собственную
транспортную упаковку для отправки / FBA.

## Шаг 1. Заключить договор со SCRAP и получить сертификат

Для продаж физлицам на Amazon нужно покрытие doméstico
(+ comercial/industrial за транспортную упаковку).

Проверенные варианты:

- Procircular (doméstico + comercial + industrial, мультиматериальный,
  без cuota de adhesión; удобно мелкому продавцу, один договор):
  https://procircular.es/
- Envalora (только industrial и comercial, doméstico НЕ покрывает —
  alone для Amazon B2C не подходит):
  https://envalora.es/
- Ecoembes (doméstico, классический):
  https://www.ecoembes.com/es

Действия:

1. Заявка на сайте SCRAP (например, Procircular `join.procircular.es`):
   - **Main activity/activities** (множественный выбор):
     - `Retail Distributor` (Обязательно для Amazon B2C и интернет-магазина)
     - `Importer` (Обязательно, если закупаете товары у поставщиков вне Испании — в других странах ЕС или импорт из третьих стран, ст. 2.t RD 1055/2022)
     - `Wholesale Distributor` (Отметить, если также ведете оптовые B2B операции)
     - *Не выбирать*: `Product manufacturer`, `Packaging manufacturer`, `HORECA`.
   - **Main NACE**:
     - `47.91` — *Retail sale via mail order houses or via Internet* (в Испании CNAE 4791 — онлайн-торговля / Amazon).
     - Если приоритет опт: `46.90` (*Non-specialised wholesale trade*).
   - **Переключатели (Toggles)**:
     - `The billing address differs from the address of the registered office`: выключен (адрес выставления счетов совпадает с адресом регистрации).
     - `The company is recognized as a business`: включен (autónomo с коммерческой деятельностью).
   - Оценка кг/год по материалам (plástico, papel-cartón, madera, vidrio, metal и др.).
2. Подписать contrato de adhesión (договор о присоединении).
3. Оплатить по тарифам SCRAP (за кг по материалам). Госпошлины за сам RPP
   нет; стоимость — это взнос в SCRAP.
4. Получить certificado de pertenencia (1 страница). Загрузить в RPP
   в течение 1 месяца после заключения договора. Сохранить в `certificados/`
   как `certificado_scrap_<SCRAP>_<AAAA>.pdf`, договор — как
   `contrato_adhesion_<SCRAP>_<AAAA-MM-DD>.pdf`.

## Шаг 2. Регистрация в RPP, секция envases (с подписью FNMT)

Всё онлайн, достаточно сертификата FNMT физлица.

Процедура: «Inscripción en el registro de productores de producto»,
код SIA 1523222, procedure_id 476, в Sede MITERD. Руководства пользователя —
в шапке процедуры; видеоинструкции — на странице RPP сайта MITERD.

Указать:

1. NIF, razón social, domicilio.
2. Используемые категории (обычно doméstico + comercial; industrial —
   если есть свои паллеты/коробки).
3. Одноразовая и/или многоразовая упаковка (un solo uso / reutilizable).
4. SCRAP, к которым присоединились.
5. Приложить сертификат(ы) членства: сразу при регистрации либо позже через
   Sede > Zona Personal > Mis solicitudes > Adjuntar documentación.

После подписания сразу присваивается номер формата ENV/AAAA/XXXXXXXXX
(AAAA = год регистрации). Он есть в скачиваемом `datosFormulario.pdf`.
Сохранить как `datosFormulario_RPP_ENV_<AAAA>.pdf` в `certificados/`.

Смена категорий/SCRAP: в обычном порядке только 01.10–31.12 каждого года.
Вопросы: bzn-rpp@miteco.es (регистр, снятие с учёта, годовая декларация,
доверенности), buzon-sgr@miteco.es (применение RD 1055/2022),
тел. 917284813 (Пн–Пт 10:00–14:00, Пн–Чт 15:00–17:00; летом сокращённо).

Снятие с учёта (baja): процедура SIA 1523221, в течение месяца после
прекращения деятельности, с документом о прекращении.

## Шаг 3. Счета-фактуры и Amazon Seller Central

1. Номер обязан указываться в счетах-фактурах и документации коммерческих
   операций с упакованными товарами вплоть до точки продажи / конечного
   пользователя. Добавить в шаблон factura. Пример сохранить в `facturas/`.
2. В Seller Central на странице «Embalaje de España»: ввести ENV/... и выбрать
   режим отчётности:
   - Amazon RAP: Pago en mi nombre — Amazon сам декларирует и платит
     эко-взнос за ваши кг, но регистрация в RPP всё равно обязательна;
   - proveedor de servicios (ваш SCRAP) — отчитываетесь вы сами через SCRAP.
   Для autónomo с малыми объёмами обычно проще первый вариант, чтобы
   не дублировать отчётность. Подтверждение сохранить как
   `confirmacion_amazon_RAP_<AAAA-MM-DD>.pdf` в `certificados/`.

## Шаг 4. Периодические декларации (два канала, не путать)

А. В SCRAP: по правилам вашего SCRAP (личный кабинет/HUB), обычно годовая
декларация кг по материалам; на её основе выставляется счёт.

Б. Государству (RPP): ежегодно, до 31 марта года, следующего за годом
ввода упаковки на рынок (ст. 16 RD 1055/2022, Приложение IV.2; также
ст. 44.7–44.8 Регламента 2025/40):

- Общая: «Información anual sobre los envases puestos en el mercado
  nacional», SIA 2962548.
- Упрощённая при < 15 тонн/год (типичный случай autónomo):
  «Declaración Simplificada», SIA 2945277.

Неподача в срок — нарушение (ст. 108 Ley 7/2022).
Особенность 2026 года из-за вступления PPWR 12.08.2026: декларируется только
период, когда имелся статус производителя по норме, действовавшей на дату
продажи (подробно — Novedades, пункт d, страница RPP MITERD).
Отчёт за 2026 год: 02.01.2027–31.03.2027.

Вести с текущего момента `registro_envases_kg_<AAAA>.xlsx` (месяц, материал,
тип doméstico/comercial/industrial, кг), хранить facturas покупки и продажи.

## Краткий порядок

Определить категории → договор со SCRAP (лучше один на все категории) →
сертификат → регистрация RPP с FNMT → номер ENV/ → facturas + Amazon →
ежегодные декларации в SCRAP и в RPP до 31.03.

Это не юридическая консультация MITERD; при сомнении о статусе
производителя по конкретному поставщику — писать на bzn-rpp@miteco.es.
