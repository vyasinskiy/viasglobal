# Viasglobal B2B Commercial Portal

Официальный коммерческий лендинг компании **Viasglobal** — европейского оптового дистрибьютора и партнера по мультиканальной электронной коммерции (**European B2B Wholesale & Omnichannel Distribution Partner**).

## Основные разделы портала
- **Hero & Trust Framework**: Верификация в реестре VIES (0% Intra-EU VAT), профиль поставщика в ЕС.
- **Regional Distribution Network**: Интерактивная карта распределительной сети в Валенсии и Средиземноморском коридоре (Castellón, Valencia, Alicante) с анонимными точками и ключевыми SLA.
- **Pan-European Marketplaces & Digital Scaling (Pilot 2026)**: Запуск направления экспансии брендов на европейские маркетплейсы (Amazon EU, Miravia, ManoMano, Leroy Merlin, Kaufland, Cdiscount) с выпадающим селектором каналов, 5 ключевыми услугами и приглашением к пилотному сотрудничеству.
- **Product Categories & Focus Areas**: 6 ключевых потребительских категорий (Home & Kitchen, Sports & Outdoor, Consumer Electronics, Personal Care, DIY & Tools, Office Goods).
- **Commercial Standards**: Операционные стандарты компании (синхронизированы с официальным Company Details Sheet).
- **How We Work**: 4 простых шага партнерства для европейских брендов и производителей.
- **B2B Partner Onboarding Modal**: Интерактивная форма квалификации брендов с явным GDPR-согласием и антиспам защитой **Cloudflare Turnstile**.
- **Legal Compliance**: Мультиязычные страницы Aviso Legal (LSSICE ст. 10), Política de Privacidad (RGPD 2016/679 / LOPDGDD), Política de Cookies (AEPD) на 5 языках.
- **Company Profile PDF**: Скачивание официального листа реквизитов на выбранном языке (`viasglobal-company-details-${lang}.pdf` для EN, ES, DE, FR, IT).

## Технологический стек
- **Фреймворк**: Next.js (App Router, SSG — Static Site Generation).
- **UI & Стилизация**: Material-UI (MUI v6) + Vanilla CSS.
- **Безопасность**: Cloudflare Turnstile (GDPR-friendly anti-spam).
- **Локализация (i18n)**: 5 европейских языков (`es`, `en`, `de`, `fr`, `it`).
- **SEO & Social Sharing**: OpenGraph, Twitter Cards, Schema.org и мета-теги для всех локалей.

## Локальный запуск

```bash
cd landing
npm run dev
```

Открыть в браузере: [http://localhost:3000](http://localhost:3000)

## Переменные окружения (Опционально)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Публичный ключ сайта Cloudflare Turnstile (по умолчанию используется официальный тестовый ключ).

## Сборка и экспорт

При запуске `npm run dev` или `npm run build` автоматически отрабатывает скрипт `scripts/sync-pdf.mjs` (`predev` / `prebuild`), копирующий актуальные PDF-карточки из первоисточника `other/welcome_letter/attachments/` в `public/`.

```bash
cd landing
npm run build
```

## Деплой (Vercel)

Проект деплоится на Vercel из подпапки `landing`:
1. Дашборд: [https://vercel.com/viasglobal](https://vercel.com/viasglobal).
2. Настройки: **Settings** -> **General** -> **Root Directory**: `landing`.
3. История сборок: [Deployments](https://vercel.com/viasglobal/viasglobal/deployments).
