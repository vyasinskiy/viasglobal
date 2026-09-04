# Инструкции и правила для интернет-магазина (Viasglobal Store)

## Архитектура и стек технологий
- **Фреймворк**: Next.js 16+ (App Router), React 19, TypeScript.
- **Тема оформления**: **Светлая тема (Light Theme)** с чистым современным стоковым стилем (светлый фон `#f8fafc` / `#ffffff`, мягкие рамки `#e2e8f0`, контрастный текст `#0f172a`, средиземноморский голубой `#0284c7` и валенсийский оранжевый `#ea580c`).
- **Локализация и языки**: **Испанский (`es`) — основной** и **Английский (`en`)**. Полная двуязычная поддержка каталога товаров, фильтров, корзины, чекаута и правовых страниц (`src/i18n/translations.ts` и `src/data/products.ts`).
- **Стилизация**: Vanilla CSS + дизайн-система в `src/styles/globals.css` (переменные светлой темы, валенсийские токены, чистые панели, мягкие тени, адаптивная верстка, микро-анимации).
- **Управление состоянием**: Zustand с middleware `persist` (хранение корзины, списка желаний и выбранного языка в localStorage браузера).
- **Иконки**: Lucide React.
- **Порт по умолчанию для dev-сервера**: `3001` (чтобы не конфликтовать с портом лендинга 3000).

## Архитектура главной страницы витрины (`src/app/page.tsx`)
1. **Первый экран (Screen 1 — `FiestaVideoHero.tsx`)**:
   - Полноэкранное автовоспроизводимое фоновое видео с испанскими фиестами (Las Fallas, San Juan, фейерверки и праздники Средиземноморья), управление звуком/паузой, кинематографичный оверлей и кнопка перехода к подборке текущей недели.
2. **Второй экран (Screen 2 — `FiestaCalendarSection.tsx`)**:
   - **Хронологический порядок событий**: События выводятся строго в порядке возрастания отдаленности во времени (начиная с активного события текущей недели `🔥 Esta semana` и далее в будущее: `Próxima semana`, `En 2 semanas`, `En 3 semanas`...).
   - **Подробное описание каждого события (`getEventFullDescription`)**: Блок с историческим, культурным и практическим описанием традиций фиесты (Fallas, Magdalena, San Juan, 9 d'Octubre, Reyes Magos и др.).
   - Для каждого события выводится утвержденный слоган доставки:
     > **«Envío rápido desde Castellón/Valencia — Prepárate para [Название Праздника]»**
   - Блок из 4 тематических товаров (подборка под конкретное событие).
3. **Секция 3 (Интерактивный AI Ассистент — `AiGiftAdvisor.tsx`)**:
   - Диалоговый пошаговый опросник с динамической связью шагов:
     - **Шаг 1**: Кому подарок (`him`, `her`, `kids_teens`, `coworker_pro`, `home_family`, `self`).
     - **Шаг 2**: Категории товаров **динамически зависят от выбранного адресата** (`getCategoryOptionsForRecipient`), исключая нелогичные варианты:
       - *Niños o Estudiantes*: Игрушки и игры (`ninos_juegos`), канцелярия и школа (`papeleria_creatividad`), детские гаджеты (`tecnologia_gadgets`), детские аксессуары (`moda_accesorios`). Категория `Hogar` (посуда, свечи, вино) для детей исключена!
       - *Colega o Setup Profesional*: Офис и блокноты (`papeleria_creatividad`), гаджеты и зарядки (`tecnologia_gadgets`), кружки и комфорт (`hogar_decoracion`).
       - *Para él*: Технологии и гаджеты, блокноты и органайзеры, мужской уход и аксессуары, гурме/кофе/бокалы.
       - *Para ella*: Красота и уход, свечи и декор дома, креативная канцелярия, подсветка и гаджеты.
       - *Hogar o Familia*: Посуда и сервировка, семейные настольные игры, умный дом и освещение.
       - *Para mí*: Персональный выбор из всех направлений каталога.
       - На шаге 2 динамически отображается бейдж выбранного адресата и персонализированный заголовок (`getStep2Title`). При смене адресата невалидные категории автоматически сбрасываются.
     - **Шаг 3**: Бюджет (<40€, 40-90€, >90€, любой).
   - Свободный текстовый поиск через ИИ (NLP распознавание адресата и категории).
   - Симуляция обработки запроса ИИ с анимированным статусом и персонализированным ответом.
- Сетка из 4 идеально подходящих товаров с показателем совпадения (✨ 98% Match), кнопками покупки и советом AI Pro-Tip.
   - Автоматическая категоризация в парсере (`detectProductCategoryTags` в `tagHelper.ts`) автоматически обогащает все новые спарсенные товары тегами категорий.
4. **Секция 4 (Los Más Vendidos en España — Хиты продаж)**:
   - Детерминированная стабильная выборка 4 лучших товаров каталога по признаку `isBestseller`, высокому рейтингу и числу отзывов. Исключен `Math.random()`, вызывавший скачки при гидратации.
5. **Секция 5 (Últimos Lanzamientos de Temporada — Новинки)**:
   - Стабильная выборка 4 товаров-новинок (с бейджем новинки или без отзывов), не пересекающихся с хитами продаж.
6. **Серверный рендеринг (Server Component `page.tsx` + `HomeClient.tsx`)**:
   - Главная страница загружает товары из базы данных Supabase прямо на сервере (`await getStoreProducts()`) и передает их клиенту через `initialProducts`. Это полностью устраняет эффект мерцания/подмены товаров при загрузке и обеспечивает превосходное SEO.

## Годовой маркетинговый календарь на 52 недели (Puentes, Fiestas y Temporadas)
В проекте реализована комплексная система круглогодичных продаж, основанная на 4 слоях событий в Испании и Валенсийском сообществе (`src/data/annual52WeeksCalendar.ts`):
1. **Официальные праздники и мосты (Festivos y Puentes)**: Reyes Magos, Semana Santa, Puente de Mayo, San Juan, Asunción (15 Ago), 9 d'Octubre, Puente del Pilar (12 Oct), Todos los Santos (1 Nov), Macropuente de la Constitución (6-8 Dic), Navidad.
2. **Локальные фиесты Валенсийского сообщества (Fiestas locales)**: San Antonio Abad (San Antón), Carnavales de Vinaròs, Fiestas de la Magdalena (Кастельон), Las Fallas y La Crida (Валенсия), Virgen de los Desamparados, Virgen del Carmen, Rototom Sunsplash (Беникасим), La Tomatina (Буньоль).
3. **Школьный и семейный календарь (Escolar y Familiar)**: Semana Blanca, Bodas y Comuniones, Fin de curso, Vuelta al Cole y Universidad.
4. **Сезонно-бытовые триггеры (Temporada y Hogar)**: Rebajas de Invierno, Frío de Enero, Primavera y cambio de hora, Ola de calor de verano, Orden en casa y cambio de armario, Lluvias otoñales, 11.11, Black Friday y Cyber Monday, Decoración navideña.

## Постоянные SEO-страницы под промо-кампании
- `/especial-puentes` — Подборки для мостов, поездок и отдыха.
- `/ofertas-verano` — Летний сезон, пляжные аксессуары, охлаждение и кемпинг.
- `/regalos-originales` — Подарки к праздникам (День отца, День матери, свадьбы, юбилеи) с встроенным `AiGiftAdvisor`.
- `/vuelta-al-cole` — Школа, университет, эргономика и организация рабочего места.
- `/orden-en-casa` — Организация пространства, менеджмент кабелей и климат.
- `/especial-navidad` — Рождество, Nochebuena, Новый год и Reyes Magos.
- `/gift-cards` — Электронные подарочные карты (Cheque Regalo Digital) с моментальной доставкой за 1 минуту.
- `/campaigns` — Интерактивный календарь-планировщик всех 52 недель.

## Источники идей для каталога и товаров
- [Ankorstore: Cadeaux & Accessoires](https://es.ankorstore.com/collection/cadeaux-accessoires) - коллекция идей подарков и трендовых аксессуаров.
- [Ankorstore: Gift Universe](https://es.ankorstore.com/boutique/gift-universe) - бутик оригинальных товаров и подарков поставщика Gift Universe.

## Правила кодовой базы
- **Запрет на самостоятельный коммит и деплой**: ИИ категорически запрещено самостоятельно делать коммиты (`git commit`), пушить (`git push`) или деплоить без явного прямого указания или разрешения пользователя.
- **Язык комментариев и документации**: Все комментарии в коде, описания функций, `README.md` и `AGENTS.md` обязаны быть строго на русском языке.
- **Язык пользовательского интерфейса (UI)**: Основной язык витрины и текстов для клиентов — испанский (`es`) с возможностью переключения на английский (`en`) через переключатель `[ 🇪🇸 ES | 🇬🇧 EN ]` в Header.
- **Структура директорий**:
  - `src/app/` - Страницы и роуты Next.js App Router (включая постоянные SEO-хабы).
  - `src/components/common/` - Общие компоненты (Header, Footer, CartDrawer, Toast).
  - `src/components/shop/` - Компоненты витрины (FiestaVideoHero, FiestaCalendarSection, AiGiftAdvisor, WeeklyPromoBanner, HolidayCampaignBanner, MarketingCalendarWidget, FeaturedBanners, ProductCard).
  - `src/data/` - Каталог товаров (`products.ts`), 52-недельный календарь (`annual52WeeksCalendar.ts`), праздничные фазы (`holidayCalendar.ts`).
  - `src/i18n/` - Словари переводов интерфейса (`translations.ts`).
  - `src/store/` - Zustand сторы (`cartStore.ts`).
  - `src/types/` - TypeScript интерфейсы и типы (`campaign.ts`, `index.ts`).
  - `src/styles/` - Глобальные стили и токены темы.

## Юридический комплаенс (Испания и ЕС)
- **Оператор**: Vitalii Iasinskii (Autónomo, NIF: ESZ1154366R, Валенсия, Испания).
- **LSSICE ст. 10**: Страница `/legal` (Aviso Legal) с полными идентификационными данными.
- **RGPD / LOPDGDD**: Страница `/privacy` (Политика конфиденциальности) и явные чекбоксы согласия в форме оформления заказа.
- **VIES Intra-Community 0% VAT**: Поддержка ввода NIF/CIF при оформлении заказа для европейских юридических лиц.
- **Цены B2C**: Все розничные цены включают НДС 21% (IVA) в соответствии с правилами торговли ЕС.

## Модульная система парсинга товаров (Playwright Multi-Source Scraper)
В проекте реализован расширяемый парсер для автоматического сбора товаров от европейских B2B поставщиков (`scripts/scraper/`):
- **Архитектура адаптеров**: Каждый источник оформляется как отдельный адаптер в `scripts/scraper/adapters/<source>/` с наследованием от `BaseSourceAdapter` и регистрацией в `AdapterRegistry`.
  - `ankorstore`: сбор коллекций/брендов Ankorstore через микроразметку Schema.org JSON-LD и infinite scroll.
- **Интерактивный обход капчи (`core/captcha.ts`)**:
  - Флаг `--head` (или `--interactive`) открывает видимое окно Chromium.
  - При возникновении капчи/Cloudflare скрипт приостанавливается, выводит сигнал в терминал и ожидает ручного прохождения пользователем с подтверждением по клавише `[ENTER]`.
- **База данных Supabase и схема (`scripts/scraper/sql/schema.sql`)**:
  - `parsing_runs`: сессии парсинга с уникальным UUID, источником, статусом и счетчиками.
  - `products`: мастер-каталог витрины с дедупликацией по штрихкоду `ean` (GTIN-13).
  - `product_sources`: привязка предложений поставщиков к мастер-товару с сохранением прямой ссылки, оптовой/розничной цены и полного сырого снимка (`raw_data`).
  - `parsing_logs`: пошаговые логи в БД (опционально).
- **Детальное пошаговое логирование (`core/logger.ts`)**:
  - Запись каждого шага (старт, скролл, загрузка, извлечение JSON-LD, EAN, сохранение, ошибки) ведется одновременно в цветную консоль и в файл `logs/scraper/run_<date>_<source>_<runId>.log`.
- **Интеграция с витриной магазина**:
  - `src/app/api/products/route.ts` — API список товаров из Supabase с поддержкой фильтрации по категориям.
  - `src/app/api/products/[id]/route.ts` — API одного товара по ID или slug.
  - `src/hooks/useProducts.ts` — React-хук для бесшовной реактивной подгрузки товаров на страницы.
  - Динамическая карточка товара `src/app/products/[id]/page.tsx` загружает спарсенные товары по ID/slug.
  - В `next.config.ts` разрешен только наш CDN `yzaarsfeztkkzuexhivl.supabase.co`.
- **Ценообразование и фиксация оригинальной цены дистрибьютора и нашей цены**:
  - Для всех товаров система обязательно фиксирует две цены:
    - **Оригинальная цена дистрибьютора**: базовая цена поставщика (PVP / RRP или оптовая). Сохраняется в `products.distributor_price` и `product_sources.retail_price`.
    - **Наша цена продажи**: цена витрины магазина с начисленной маржой (по умолчанию +15% для Ankorstore: `price = round(distributorPrice * 1.15, 2)`). Сохраняется в `products.price` и `product_sources.our_price`.
  - CLI поддерживает параметр `--margin <число>` (по умолчанию 15).
  - Миграция для добавления колонок в БД: `scripts/scraper/sql/add_distributor_and_our_price.sql`.
  - Для пересчета цен существующих товаров в БД используется SQL-скрипт `scripts/scraper/sql/apply_ankorstore_margin_15.sql`.
- **Строгий запрет внешних ссылок и CDN поставщиков (Анти-Ankorstore Hotlinking)**:
  - **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО** использовать `img.ankorstore.com`, `cdn.ankorstore.com` и любые прямые ссылки, ведущие на ankorstore на витрине магазина (`products.main_image`, `products.images`, карточки товаров, UI компоненты).
  - Все фотографии товаров обязаны автоматически скачиваться и перекладываться в наш собственный CDN (Supabase Storage бакет `products`).
  - Прямые ссылки на сайт поставщика разрешены строго и исключительно во внутренней служебной таблице `product_sources.source_url` для истории происхождения товара, но никогда не выводятся покупателям и в публичный каталог `products`.
- **Политика защиты изображений от обратного поиска (Анти-Google Lens / TinEye / Yandex)**:
  - **Серверная трансформация (`core/imageTransformer.ts`)**:
    - При переносе картинок в наш CDN (`core/imageUploader.ts`) каждое изображение проходит пайплайн трансформации через библиотеку `sharp`:
      1. *Микроповорот* на 1.9° (разрушает координатную сетку дескрипторов SIFT/ORB).
      2. *Кроп краев* на 3.5% (срезает углы поворота и сбивает центровку объекта).
      3. *Микрорамка-паспарту* (14px) с тонированным фоном `#f8fafc` (ломает пропорции и контур изображения).
      4. *Микросдвиг гаммы (1.03), яркости (1.02) и насыщенности (1.03)* (меняет цветовую гистограмму).
      5. *Наложение незаметного высокочастотного аналогового микрозерна* (SVG-фильтр `fractalNoise` с непрозрачностью 4%), сбивающего сверточные эмбеддинги нейросетей (Google Vision Transformer / ResNet / CLIP).
      6. *Экспорт в WebP* с качеством 87 и неявным суффиксом `_opt.webp`.
  - **Хранение оригиналов и возможность мгновенного отката (Zero-Risk)**:
    - В таблице `products` созданы колонки `original_main_image` (text) и `original_images` (jsonb).
    - В бакете `products` хранятся как исходные чистые фотографии (`img_0_xxxx.webp`), так и обработанные витринные с неявным суффиксом (`img_0_xxxx_opt.webp`).
    - Для мгновенного возврата к оригинальным фото подготовлен скрипт:
      `npx tsx scripts/scraper/rollback_images.ts` (откат к оригиналам)
      `npx tsx scripts/scraper/rollback_images.ts --to-opt` (возврат к защищенным _opt фото)
  - **Фронтенд-защита от Google Объектива**:
    - В карточках каталога (`ProductCard.tsx`) и на странице товара (`products/[id]/page.tsx`) над тегом `<Image>` размещен прозрачный защитный слой с `onContextMenu={(e) => e.preventDefault()}`, а также `draggable={false}` и `user-select: none`. Это блокирует браузерное меню «Найти через Google Объектив» и перетаскивание картинки в поиск.
  - **Скрипт бэкфилла для существующих фото**:
    - `npx tsx scripts/scraper/backfill_anti_search_images.ts` — переобрабатывает изображения в каталоге, сохраняет оригиналы и переключает `main_image` на `_opt.webp`.
- **Платежная система Stripe Checkout и управление заказами**:
  - **Архитектура**: используется официальный Stripe Hosted Checkout (`stripe.checkout.sessions.create`) для 100% соответствия европейским нормам безопасности (SCA, 3D Secure 2.0, PCI-DSS Level 1) без хранения карточных данных на нашем сервере.
  - **Таблица заказов (`public.orders`)**:
    - Сохраняет созданные заказы с полями `stripe_session_id`, `stripe_payment_intent_id`, `status` (`pending`, `paid`, `failed`), данными покупателя, составом корзины (`items`) и адресом доставки.
    - Миграция: `scripts/scraper/sql/add_orders_table.sql`.
  - **API Эндпоинты**:
    - `POST /api/checkout/stripe`: валидация корзины, создание пред-заказа в БД со статусом `pending`, создание сессии Stripe и возврат `session.url`.
    - `POST /api/webhooks/stripe`: обработка подтверждения оплаты (`checkout.session.completed`) и перевод статуса заказа в `'paid'`.
    - `GET /api/checkout/stripe/verify?session_id=...`: верификация оплаты для страницы благодарности `/checkout/success`.
  - **Умный Демо-режим**: если в `.env.local` еще не задан `STRIPE_SECRET_KEY`, система не падает, а безопасно завершает симуляцию заказа в демо-режиме, сохраняя запись в БД.
- **Команды запуска CLI**:
  - `npm run scrape -- "<URL>" --limit 25` (стандартный запуск)
  - `npm run scrape -- "<URL>" --tags playa,verano --limit 30` (с коллекционными тегами)
  - `npm run scrape -- "<URL>" --limit 10 --head` (с видимым окном для ручного ввода капчи)
  - `npm run scrape -- "<URL>" --category workspace` (с принудительной категорией)
  - `npx tsx scripts/scraper/sql/migrate.ts` (применение схемы schema.sql к БД)
  - `npx tsx scripts/scraper/sql/run_migrations.ts [файл.sql]` (запуск произвольной SQL миграции)
  - `npx tsx scripts/scraper/backfill_anti_search_images.ts` (пакетная защита существующих картинок)
  - `npx tsx scripts/scraper/rollback_images.ts` (откат витрины к оригинальным чистым фото)

## Особенности запуска и сборки
- Локальный запуск: `npm run dev` (запускается на http://localhost:3001).
- Сборка: `npm run build`.
- Парсинг товаров: `npm run scrape -- "<URL>" [опции]`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
