# Документация и правила для лендинга (Viasglobal B2B Portal)

## Позиционирование и концепция
- **Статус**: Официальный коммерческий портал европейского оптового дистрибьютора и партнера по цифровой коммерции (**European B2B Wholesale & Omnichannel Distribution Partner**).
- **Стиль и риторика**: Солидные, обтекаемые B2B формулировки (в соответствии с `Company Details Sheet — Viasglobal.pdf`). Убрана узкая привязка к «Amazon seller», чтобы избежать отказов европейских дистрибьюторов при открытии B2B аккаунтов.
- **Ключевые направления**:
  1. *Omnichannel Wholesale Distribution* (Оптовая закупка партий, мультиканальные продажи в ЕС).
  2. *Brand Protection & MAP Compliance* (Строгое соблюдение рекомендованных розничных цен RRP/MAP, защита от демпинга).
  3. *Catalog & Retail Optimization* (Оптимизация товарных каталогов и мерчандайзинг).
  5. *Regional Partner & Retail Network* (Дистрибьюторская сеть и розничные партнеры в Валенсии и Средиземноморском коридоре).
  6. *Pan-European Marketplaces Expansion Pilot* (Программа пилотного запуска и мультиканальной дистрибьюции на маркетплейсах ЕС с соблюдением MAP).

## Юридический комплаенс и защита данных (Испания и ЕС)
- **LSSICE (ст. 10)**: Полная идентификация в `Aviso Legal` и футере (Vitalii Iasinskii, Autónomo, NIF/EU VAT: `ESZ1154366R`, адрес в Испании).
- **RGPD / LOPDGDD**: Политика конфиденциальности с указанием прав ARCO-POL, сроков хранения данных и права на обращение в AEPD (aepd.es).
- **Явное согласие (Explicit consent)**: В форме онбординга (`PartnerIntakeModal`) чекбокс согласия с Политикой конфиденциальности пустой по умолчанию и содержит активную ссылку.
- **Антиспам защита (Cloudflare Turnstile)**: Встроенная капча Turnstile (`TurnstileWidget.tsx`) — полностью совместима с GDPR, не собирает персональные данные в отличие от Google reCAPTCHA. Поддерживает переменную `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- **ePrivacy & AEPD Cookie Guidelines**: Двухуровневый `CookieBanner` (Aceptar todas / Rechazar no esenciales).
- **VIES Intra-Community 0% VAT**: Интерактивный бейдж и ссылки на реестр Европейской Комиссии для проверки валидности номера `ESZ1154366R`.

## Технические требования
- **Стек**: Next.js (App Router, SSG export), Material-UI (MUI) + Vanilla CSS.
- **Локализация (i18n)**: 5 языков (`en`, `es`, `de`, `fr`, `it`) с синхронизированными словарями для лендинга и юридических страниц (`legalContent.ts`).
- **SEO & Social Sharing**: Полная разметка OpenGraph и Twitter Cards с абсолютными ссылками на `https://viasglobal.es/og-image.jpg`.
- **Мультиязычные ассеты (Single Source of Truth)**: Первоисточник PDF и HTML-шаблонов хранится в `other/welcome_letter/attachments/`. При `npm run dev` / `npm run build` срабатывает `prebuild` скрипт (`scripts/sync-pdf.mjs`), который автоматически синхронизирует PDF в `landing/public/` (сами сгенерированные файлы в `public/` добавлены в `.gitignore` во избежание дублирования в git).

## Особенности деплоя (Vercel)
- Проект деплоится из подпапки `landing` (Root Directory в Vercel: `landing`).
- Подробные инструкции по деплою приведены в `README.md`.
