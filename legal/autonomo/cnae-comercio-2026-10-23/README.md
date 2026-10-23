# Добавление кода торговой деятельности в Seguridad Social

**Дата работы:** 23 октября 2026 г.

## Содержимое папки

1. `Informe actividades declaradas.pdf` — копия отчёта TGSS (Tesorería General de la Seguridad Social) от 23/10/2026, Id. CEA `2AE6KT5AECMW`. Оригинал: `legal/autonomo/`.
2. `certificado_situacion_censal_2026-09-23.pdf` — копия certificado de situación censal AEAT от 23/09/2026, Nº ref. `20269409296`. Оригинал: `legal/autonomo/`.
3. `carta_para_gestor.md` - письмо в онлайн-хесторию Taxfix ([taxfix.es](https://taxfix.es/)) на испанском языке с просьбой добавить CNAE торговли.

## Выводы (на русском)

**Проблема подтверждена.** В Seguridad Social сейчас только IT-коды (все с датой начала 15/01/2024):

- CNAE 6290 — Otros servicios relacionados con las tecnologías de la información,
- CNAE 6210 — Actividades de programación informática,
- CNAE 6220 — Actividades de consultoría informática (указана дважды — вероятно, дубль в базе TGSS).

Торговой деятельности в отчёте **нет**.

**В Hacienda при этом уже две активности:**

- Profesional 763 (Programadores y Analistas) — alta 01/07/2026,
- Empresarial 665 (Comercio Menor Por Correo o Catálogo) — alta 21/09/2026, NACE 47.91 — это e-commerce / маркетплейсы.

**Что нужно сделать:**

1. Добавить в RETA новую активность CNAE **4791 / 47.91** (Comercio al por menor por correspondencia o por Internet) с датой начала **21/09/2026**, чтобы совпадало с Hacienda. Старые IT-коды не удалять.
2. Заодно обновить domicilio de actividad: в TGSS числится `C/ Sant Antonio 22, Lucena del Cid`, а в Hacienda уже `Ronda Albocacer 11, Sierra Engarcerán`.
3. Технически это variación de datos через Importass / Sede Electrónica (модель TA.0521). На размер cuota RETA не влияет, но влияет на корректный тариф AT/EP и когерентность AEAT ↔ TGSS (важно при проверках, bajas, ayudas, а также для Amazon / RAP / SCRAP / поставщиков, которые просят оба сертификата).

Письмо для консультантов Taxfix (`carta_para_gestor.md`) уже содержит просьбу подтвердить необходимость TA.0521 и последствия для cotización / AT/EP.

---

## Статус выполнения и ответ хестора (23.10.2026)

- **Ответ от хестора (Jorge Dorado Rubio / Taxfix, 23.10.2026 12:51)**:
  > *«¡Hola VITALII! Buenos días, dame apoderamiento para poder realizarlo. Adjunto documento de como hacer el apoderamiento.»*
- **Задача**: Оформить электронную доверенность (*apoderamiento electrónico*), чтобы хестор мог подать изменения в Seguridad Social (TGSS / RETA).
- **План действий**:
  1. Открыть личный кабинет или приложение Taxfix и ознакомиться с приложенным документом-инструкцией.
  2. Перейти в Sede Electrónica (Seguridad Social / AEAT) и через цифровой сертификат (*Certificado Digital*) оформить *apoderamiento* для Jorge Dorado Rubio / Taxfix.
  3. Подтвердить предоставление доверенности в чате Taxfix, чтобы хестор зарегистрировал код CNAE 4791 (торговля через интернет) с датой начала 21.09.2026.
- **Задача в Google Tasks**: `[Legal]: Оформить apoderamiento для Taxfix (Jorge Dorado) для добавления CNAE 4791` (ID: `Q21nTDY4Y3BIRE5Fa0JTMg`, дедлайн: `2026-10-24`).




