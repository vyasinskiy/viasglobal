# Viasglobal Store — Интернет-магазин (España / EU)

Официальный онлайн-магазин премиальной электроники, устройств для умного дома и аксессуаров для эргономичного рабочего места в Испании и странах Европейского Союза.

Интерфейс выполнен в **светлой теме (Light Theme)** на **испанском языке (основной)** с поддержкой **английского языка** через переключатель `[ 🇪🇸 ES | 🇬🇧 EN ]` в шапке сайта.

## Стек технологий
- **Next.js 16 (App Router)** + **React 19**
- **TypeScript** для строгой типизации
- **Светлая дизайн-система**: Чистые белые и сланцевые тона (`#f8fafc`, `#ffffff`), средиземноморский голубой (`#0284c7`) и валенсийский оранжевый (`#ea580c`) акценты
- **Zustand** с сохранением корзины, списка желаний и выбранного языка в `localStorage`
- **Vanilla CSS** с плавными анимациями и микро-тенями
- **Lucide Icons**
- **Мультиязычность**: Испанский (`es`, по умолчанию) + Английский (`en`)

## Главная витрина магазина
1. **Первый экран (`FiestaVideoHero.tsx`)**:
   - Кинематографичное полноэкранное автовоспроизводимое видео с атмосферой испанских фиест (Фальяс в Валенсии, фейерверки, ночные средиземноморские праздники) с переключателями звука и паузы.
2. **Второй экран (`FiestaCalendarSection.tsx`)**:
   - **Хронологический порядок событий**: События выводятся строго по возрастанию отдаленности во времени (от актуального события текущей недели `🔥 Esta semana` и далее в будущее: `Próxima semana`, `En 2 semanas`, `En 3 semanas`...).
   - **Подробное описание каждого события (`getEventFullDescription`)**: Блок «Sobre esta celebración» с историей, традициями фиесты (Mascletà, Cremà, Romería de les Canyes, San Juan, 9 d'Octubre и др.) и обоснованием выбора рекомендуемой техники.
   - Плашка быстрой доставки: **«Envío rápido desde Castellón/Valencia — Prepárate para [Праздник]»**.
   - Тематическая подборка из 4 товаров, подходящих именно под выбранное событие.
3. **Секция 3 (`AiGiftAdvisor.tsx` — AI Ассистент подарков)**:
   - Интерактивный AI консьерж: пошаговый опросник (кому подарок, выбор реальной категории каталога товаров: *Hogar, Cocina & Deco*, *Papelería & Creatividad*, *Niños, Juguetes & Juegos*, *Moda, Belleza & Accesorios*, *Tecnología & Gadgets*, бюджет) + свободный текстовый поиск.
   - Анимированная симуляция работы ИИ и персональная подборка товаров с показателем релевантности (✨ 98% Match), обоснованием выбора и советом AI Pro-Tip.

## Годовой маркетинговый календарь на 52 недели (Puentes, Fiestas y Temporadas)
В коде интернет-магазина реализован полный годовой календарь продаж (`src/data/annual52WeeksCalendar.ts`), объединяющий 4 слоя событий:
1. **Официальные праздники и мосты (Festivos y Puentes)**: Reyes Magos, Semana Santa, Puente de Mayo, San Juan, Asunción (15 Ago), 9 d'Octubre, Puente del Pilar (12 Oct), Todos los Santos (1 Nov), Macropuente de la Constitución (6-8 Dic), Navidad.
2. **Локальные фиесты Валенсийского сообщества (Fiestas locales)**: San Antón, Carnavales de Vinaròs, Fiestas de la Magdalena (Кастельон), Las Fallas y La Crida (Валенсия), Virgen de los Desamparados, Virgen del Carmen, Rototom Sunsplash (Беникасим), La Tomatina (Буньоль).
3. **Школьный и семейный календарь (Escolar y Familiar)**: Semana Blanca, Bodas y Comuniones, Fin de curso, Vuelta al Cole y Universidad.
4. **Сезонно-бытовые триггеры (Temporada y Hogar)**: Rebajas de Invierno, Frío de Enero, Primavera, Ola de calor, Orden en casa, Lluvias, 11.11, Black Friday, Decoración navideña.

## Постоянные SEO-страницы
- `/especial-puentes` — Подборки для длинных выходных (мостов), поездок и кемпинга.
- `/ofertas-verano` — Летние скидки, пляж, охлаждение и отпуск.
- `/regalos-originales` — Подарки к праздникам, дням рождения и семейным событиям с встроенным `AiGiftAdvisor`.
- `/vuelta-al-cole` — Школа, университет, эргономика и аксессуары для учебы.
- `/orden-en-casa` — Организация пространства, менеджмент кабелей и климат.
- `/especial-navidad` — Рождественский каталог и подготовка к Reyes Magos.
- `/gift-cards` — Электронные подарочные сертификаты (Cheque Regalo Digital).
- `/campaigns` — Интерактивный календарь-планировщик на 52 недели.

## Источники идей для товаров и ассортимента
Для поиска идей новых товаров, трендовых подарков и аксессуаров используются следующие европейские B2B платформы и витрины:
- [Ankorstore: Cadeaux & Accessoires](https://es.ankorstore.com/collection/cadeaux-accessoires) - подборка трендовых подарков и аксессуаров.
- [Ankorstore: Gift Universe](https://es.ankorstore.com/boutique/gift-universe) - каталог оригинальных товаров и подарков от поставщика Gift Universe.

## Парсер товаров поставщиков (Playwright Multi-Source Scraper)

Для наполнения магазина реальным ассортиментом разработан модульный парсер европейских B2B платформ (`scripts/scraper/`).

### Возможности и архитектура
1. **Мульти-источниковая структура**:
   - Адаптеры поставщиков изолированы в папке `scripts/scraper/adapters/` (например, `ankorstore`).
   - Автоматическое определение нужного адаптера по ссылке через реестр `AdapterRegistry`.
2. **Дедупликация товаров по EAN (штрихкоду)**:
   - Если товар с одним и тем же штрихкодом EAN продается у нескольких поставщиков по разным ценам, в таблице `products` сохраняется единый мастер-товар, а в `product_sources` создаются отдельные записи для каждого поставщика с его ценой и прямой ссылкой.
3. **Сессии парсинга и снапшоты данных**:
   - Каждый запуск получает уникальный ID в таблице `parsing_runs` со статусом, счетчиками и путем к логу.
   - Для каждого товара сохраняется неизмененный снимок сырых данных (`raw_data` snapshot).
4. **Обход капчи и интерактивный режим (`--head`)**:
   - При обнаружении Cloudflare Turnstile, reCAPTCHA или hCaptcha скрипт приостанавливает выполнение, выводит звуковое/текстовое оповещение в терминал и ожидает ручного прохождения проверки в окне браузера с подтверждением по клавише `[ENTER]`.
5. **Детализированное пошаговое логирование**:
   - Подробная фиксация каждого шага (старт, скролл, загрузка страницы, извлечение JSON-LD, проверка по EAN, сохранение, ошибки со стектрейсом).
   - Запись ведется в цветную консоль и в файл `logs/scraper/run_<date>_<source>_<runId>.log`.

### Использование CLI
```bash
# Базовый парсинг коллекции (например, Back to School) с лимитом 20 товаров
npm run scrape -- "https://es.ankorstore.com/collection/backtoschool2025" --limit 20

# Интерактивный режим с открытым окном браузера (для ручного решения капчи)
npm run scrape -- "https://es.ankorstore.com/collection/backtoschool2025" --limit 15 --head

# Парсинг с принудительным назначением категории магазина
npm run scrape -- "https://es.ankorstore.com/boutique/gift-universe" --category workspace

# Парсинг с добавлением тегов тематической коллекции (пляж, лето)
npm run scrape -- "https://es.ankorstore.com/collection/summer25-beach" --tags playa,verano,пляж,лето --limit 30

# Доступные опции:
#   --limit, -l <число>         Количество собираемых товаров (по умолчанию 20)
#   --tags, -t <теги>           Теги через запятую (например: playa,verano,пляж,лето)
#   --head, -h, --interactive    Видимое окно Chromium для решения капчи
#   --category, -c <категория>  Категория (electronics, workspace, lifestyle, smart-home, audio)
#   --source, -s <источник>      Принудительный выбор адаптера (ankorstore и др.)
#   --save-json-only             Сохранение только в локальный JSON без обращения к Supabase
```

### Настройка базы данных Supabase
1. Создайте проект в [Supabase](https://supabase.com).
2. Запустите скрипт автоматической миграции:
   ```bash
   npx tsx scripts/scraper/sql/migrate.ts
   ```
3. Переменные в файле `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```
4. Витрина магазина автоматически подтягивает товары из Supabase через динамические эндпоинты `/api/products` и `/api/products/[id]`, а также хук `useProducts()`. Страница карточки товара `/products/[id]` поддерживает любые спарсенные товары.

### Политика хранения медиа и запрет сторонних CDN (Анти-Ankorstore Hotlinking)
- **Строгий запрет**: Категорически запрещено использовать хосты `img.ankorstore.com`, `cdn.ankorstore.com` и любые прямые ссылки на Ankorstore на витрине магазина (`products.main_image`, `products.images`, карточки товаров).
- **Собственный CDN**: Все фотографии товаров скачиваются и размещаются в нашем изолированном хранилище **Supabase Storage** (бакет `products`), обслуживаемом через CDN Cloudflare.
- **Внутренний учет**: Прямая ссылка на сайт поставщика сохраняется только во внутренней системной таблице `product_sources.source_url` для истории парсинга и никогда не показывается покупателям магазина.

## Быстрый старт

### Установка зависимостей
В директории `shop`:
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```
Приложение откроется по адресу: [http://localhost:3001](http://localhost:3001).

### Сборка проекта
```bash
npm run build
npm run start
```

## Регламент разработки и безопасность
- **Запрет на самостоятельные коммиты (`git commit`)**: ИИ готовит код локально, проверяет сборку и тесты. Коммиты выполняются только по прямому запросу пользователя.
- **Запрет на самостоятельный деплой и миграции**: Команды деплоя (`git push`, `make deploy`) и применение миграций к рабочей базе данных выполняет исключительно разработчик.
