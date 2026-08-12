# Viasglobal Landing Page

Лендинг для компании Viasglobal, специализирующейся на оптовой торговле (wholesale) на Amazon.

## Технологии
- **Фреймворк**: [Next.js](https://nextjs.org/)
- **Стилизация**: [Material-UI (MUI)](https://mui.com/) + Vanilla CSS
- **Хостинг**: Cloudflare Pages / Vercel (Статический экспорт - SSG)

## Особенности проекта
- Полное соответствие требованиям GDPR Евросоюза и Испании.
- Адаптивный, современный дизайн в цветовой гамме, близкой к Amazon.

## Запуск проекта локально

Для запуска сервера разработки:

```bash
npm run dev
# или
yarn dev
# или
pnpm dev
# или
bun dev
```

Откройте [http://localhost:3000](http://localhost:3000) в вашем браузере.

## Деплой (Vercel)

Так как код лендинга находится в подпапке `landing`, процесс деплоя на Vercel требует настройки:

1. Зайдите в проект на Vercel: [https://vercel.com/viasglobal](https://vercel.com/viasglobal).
2. Откройте **Settings** -> **General**.
3. В разделе **Root Directory** впишите `landing` и сохраните.

### Пропуск деплоя при изменениях вне папки landing
Если в настройках включен параметр **"Skip deployments when there are no changes to the root directory or its dependencies"** (включен по умолчанию), Vercel будет собирать проект **только** при изменениях внутри папки `landing`. 
Изменения в других папках репозитория будут проигнорированы.
Проверить статус пропущенных билдов (`Canceled`) можно на вкладке [Deployments](https://vercel.com/viasglobal/viasglobal/deployments).
