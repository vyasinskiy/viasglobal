# Envases RAP — Registro y cumplimiento (autónomo, wholesale Amazon)

Directorio para самостоятельного оформления RAP-номера упаковки в Испании
(Responsabilidad Ampliada del Productor, envases) продавцом-autónomo
по модели wholesale на Amazon.

## Структура

- `instruccion_registro_RAP_autonomo.md` — пошаговая инструкция:
  определение статуса productor, выбор SCRAP, inscripción RPP
  с подписью FNMT, внесение номера в Amazon, ежегодные декларации.
- `certificados/` — certificados de pertenencia a SCRAP, contratos de adhesión,
  PDF `datosFormulario.pdf` с номером `ENV/...`, скриншоты/PDF подтверждения Amazon.
- `declaraciones/` — годовые декларации: в SCRAP (личный кабинет/HUB)
  и в RPP (Sede MITERD), файл учёта кг по материалам.
- `facturas/` — шаблоны facturas с номером RPP, facturas покупки/продажи
  для подтверждения учёта упаковки.

## Данные из Certificado de Situación Censal (AEAT)
- **Файл сертификата**: `contractors/safta/attachments/CERTIFICADO DE SITUACION CENSAL (1).pdf` (CSV: `B2LR8ME9RKYAX683`).
- **Зарегистрированные виды деятельности (IAE)**:
  - **Epígrafe 665**: *Comercio Menor Por Correo o Catálogo* (Código A03, alta 21/09/2026) ➔ международный код **NACE 47.91** (*Retail sale via mail order houses or via Internet*).
  - **Epígrafe 763**: *Programadores y Analistas de Informática* (Código A05, alta 01/07/2026).
- **Налоговые режимы**:
  - ROI (Registro de Operadores Intracomunitarios / VIES): включен с 15/01/2024.
  - Régimen especial recargo de equivalencia: с 21/09/2026.

## Правила именования

Оригиналы хранить с понятными именами на испанском или латинице:

- `certificado_scrap_<SCRAP>_<AAAA>.pdf`
- `contrato_adhesion_<SCRAP>_<AAAA-MM-DD>.pdf`
- `datosFormulario_RPP_ENV_<AAAA>.pdf`
- `confirmacion_amazon_RAP_<AAAA-MM-DD>.pdf`
- `declaracion_RPP_<AAAA>_presentada_<AAAA-MM-DD>.pdf`
- `declaracion_SCRAP_<SCRAP>_<AAAA>.pdf`
- `registro_envases_kg_<AAAA>.xlsx`
- `factura_venta_<NUM>_<AAAA-MM-DD>.pdf`

## Статус

- [x] **Шаг 1 (Выполнен 23.10.2026)**:
  - Выбран SCRAP **Procircular** (мультиматериальный: doméstico + comercial + industrial).
  - Оформлена заявка на `join.procircular.es` (деятельности: *Retail Distributor*, *Importer*; NACE: `47.91`).
  - Подписаны и приняты договоры присоединения (Terms and Conditions):
    - Бытовой / B2C: [`contrato_adhesion_Procircular_Household_2026-10-23.pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/contrato_adhesion_Procircular_Household_2026-10-23.pdf)
    - Коммерческий / опт: [`contrato_adhesion_Procircular_Commercial_2026-10-23.pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/contrato_adhesion_Procircular_Commercial_2026-10-23.pdf)
    - Промышленный: [`contrato_adhesion_Procircular_Industrial_2026-10-23.pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/contrato_adhesion_Procircular_Industrial_2026-10-23.pdf)
    - Общие условия: [`contrato_adhesion_Procircular_2026-10-23.pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/contrato_adhesion_Procircular_2026-10-23.pdf)
  - Реквизиты SCRAP: **PROCIRCULAR ENVASES, S.L.** (NIF B-72918006, авторизация 13SCRA5000042205P, администратор RECLAY IBERIA, S.L.).
- [x] **Шаг 2 (Выполнен 25.10.2026)**:
  - Получены официальные сертификаты членства (*Membership Certificate / Certificado de pertenencia*) от Procircular по всем 3 категориям:
    - **Household (Doméstico)**: [`certificado_scrap_Procircular_Household_2026.pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/certificado_scrap_Procircular_Household_2026.pdf)
    - **Commercial**: [`certificado_scrap_Procircular_Commercial_2026.pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/certificado_scrap_Procircular_Commercial_2026.pdf)
    - **Industrial**: [`certificado_scrap_Procircular_Industrial_2026.pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/certificado_scrap_Procircular_Industrial_2026.pdf)
- [ ] **Шаг 3 (Текущий шаг)**: Регистрация в RPP (Sede MITERD, процедура SIA 1523222) с сертификатом FNMT и прикреплением сертификата членства, мгновенное получение номера `ENV/2026/...` в файле `datosFormulario.pdf`.
- [ ] **Шаг 4**: Внесение номера `ENV/...` в шаблоны счетов-фактур (*facturas*) и в Amazon Seller Central (*Embalaje de España*).
- [ ] **Шаг 5**: Подача предварительной декларации в Procircular (в течение 30 дней с момента присоединения, ст. 9.1.b договора) и настройка учета кг (`registro_envases_kg_2026.xlsx`).
- [ ] **Ежегодно до 31.03**: Годовые декларации упаковки в Procircular (до 28.02) и в RPP (до 31.03).

Контакты MITERD: `bzn-rpp@miteco.es` (регистр, декларации),
`buzon-sgr@miteco.es` (толкование RD 1055/2022), тел. 917284813.
Контакты Procircular: `info@procircular.es`, тел./sede Pozuelo de Alarcón (Madrid).
