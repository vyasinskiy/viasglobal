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
   - Интерактивный AI консьерж: пошаговый опросник (кому подарок, интересы, бюджет) + свободный текстовый поиск.
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
