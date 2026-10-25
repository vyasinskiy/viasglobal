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
- [x] **Шаг 3 (Выполнен 25.10.2026)**:
  - Пройдена официальная регистрация в реестре производителей упаковки RPP (Sede MITERD, процедура SIA 1523222).
  - Присвоен государственный постоянный номер утилизации: **`ENV/2026/000121685`**.
  - Официальная квитанция с цифровой подписью министерства: [`justificante_registro_RPP_2026-10-25.pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/justificante_registro_RPP_2026-10-25.pdf) (№ `REGAGE26e00091871330`, CSV: `MA5010KKVKDRAXN+Q6RY2WQA3S1792921061`).
- [x] **Шаг 4 (Выполнен 25.10.2026)**:
  - [x] Внести номер **`ENV/2026/000121685`** в личный кабинет Procircular (Выполнено 25.10.2026: статус *«RPP validation is in progress. This can take up to 24 hours on working days»*). Контрольная задача на **27.10.2026**: Google Tasks `QWdHalRSZjlCUEk1c0lXNQ`, Calendar `r4bqin5o1gfi3b841rnkpnmulg`.
  - [x] Внести номер **`ENV/2026/000121685`** в Amazon Seller Central (Раздел *Cumplimiento normativo / Embalaje de España*, отправлено 25.10.2026: статус *«Verificaremos tu número de registro de EPR cuando se actualice el Registro Nacional. No es necesario que hagas nada»*). Контрольная задача на **28.10.2026**: Google Tasks `REV3QlMtREpmSkJGd0xZTA`, Calendar `96hcag6umv9jtkcka9an9q8l8k`.
  - [x] Подготовлен шаблон обязательной строки с номером RPP для счетов-фактур (*facturas*): `N.º de Registro de Productores de Producto (Sección Envases): ENV/2026/000121685` ([facturas/README.md](file:///Users/usuario/code/viasglobal/legal/envases_rap/facturas/README.md)).
- [ ] **Шаг 5**: Подача предварительной декларации в Procircular (в течение 30 дней с момента присоединения, до 22.11.2026) и настройка учета кг (`registro_envases_kg_2026.xlsx`).
- [ ] **Ежегодно до 31.03**: Годовые декларации упаковки в Procircular (до 28.02) и в RPP (до 31.03).

## График отчетности и ключевые даты (Important! Key dates for 2026)

В личном кабинете Procircular установлен официальный график отчетности и взаиморасчетов:

| Дата | Событие | Описание и значение для Viasglobal (autónomo) |
| :--- | :--- | :--- |
| **28 февраля** | **Submission of declaration(s) to SCRAP** | Ежегодная итоговая декларация в Procircular за предыдущий календарный год (фактический вес в кг по материалам: бумага/картон, пластик, дерево, металл). |
| **31 марта** | **Upload of 2025 declaration to the Producers Register (MITECO) \*** | Государственная ежегодная декларация в реестр RPP министерства MITERD (через Sede Electrónica). Примечание: срок может продлеваться MITECO. |
| **31 марта** | **First Procircular invoice** | Выставление первого ежегодного счета от Procircular. Включает две позиции: регуляризацию за 2025 год и авансовый счет за 2026 год. |

### Подробная расшифровка блоков расписания:

1. **2025 Regularisation process (Механика регуляризации / сверки аванса с фактом)**:
   - **Суть механики (сверка прогноза и факта)**:
     Это автоматическая корректировка между предварительным авансовым расчетом (*provisional return* за предыдущий год) и итоговой декларацией по факту продаж (*final return* за текущий год).
     - **Случай 1 (Факт > Прогноза)**: если `provisional 2025 < final 2025`, выставляется счет на доплату разницы (`final - provisional`).
     - **Случай 2 (Факт = Прогнозу)**: если `provisional 2025 = final 2025`, счет не выставляется (ноль к доплате).
     - **Случай 3 (Факт < Прогноза, переплата)**: если `provisional 2025 > final 2025`, выставляется корректирующая кредитная нота (*corrective credit note*):
       - а) сумма засчитывается в счет авансового счета следующего года (`provisional invoice`);
       - б) если в следующем году членство не продолжается — осуществляется прямой денежный возврат.
   - **Применение к Viasglobal (autónomo)**:
     Торговая деятельность официально начата в налоговой AEAT **21 сентября 2026 года** (Certificado de Situación Censal, IAE 665 / NACE 47.91). В 2025 году продаж товаров и ввода упаковки не велось (`provisional 2025 = 0`, `final 2025 = 0`). Применяется **Случай 2**: начислений и доплат за 2025 год нет.
   - **Когда эта механика заработает для нас**:
     Сейчас (в течение 30 дней после вступления) мы подаем предварительную декларацию за **2026 год** (*provisional 2026*). А в **марте 2027 года** произойдет точно такая же регуляризация между поданным прогнозом на 2026 год и фактически проданными килограммами упаковки.

2. **First Procircular invoice (Ежегодный счет от 31 марта)**:
   - Включает:
     - `Invoicing for the 2025 regularisation process`: расчет за 2025 год (для нас 0 €).
     - `Invoicing for the 2026 provisional declaration`: предварительный счет за 2026 год по поданным ориентировочным объемам.
   - **Порядок оплаты**: Для субъектов с годовым взносом **до 500 € + IVA** (микробизнес / малый опт) действует правило **одного платежа в год** (п. D.b Приложения I договора). Оплата производится в течение 30 дней при банковском переводе или 15 дней по SEPA Direct Debit.

3. **Разделение двух независимых каналов отчетности (SCRAP vs MITECO)**:
   - **Канал 1: Procircular (SCRAP)** — коллективная некоммерческая ассоциация. Декларация подается в ЛК Procircular до **28 февраля**. На ее основе выставляется счет на финансирование переработки отходов.
   - **Канал 2: Государство (MITECO / RPP)** — государственный реестр при Министерстве экологического перехода. Декларация подается на правительственном портале Sede MITERD до **31 марта** (упрощенная форма Declaración Simplificada при объеме < 15 тонн/год). Сама по себе подача в министерство бесплатна, но обязательна по закону (неподача грозит штрафами по ст. 108 Ley 7/2022).

4. **Обязанность новых участников (в течение 30 дней)**:
   - По п. 9.1.b договора: участники, присоединившиеся после 28 февраля (договор от 23.10.2026), обязаны в течение **30 дней** с момента вступления подать предварительную декларацию (*declaración provisional*) с прогнозом килограммов упаковки на текущий 2026 год.

5. **Обязательное внесение номера RPP ID в личный кабинет Procircular (дедлайн 30 дней — до 22.11.2026)**:
   - В разделе ЛК `DAILY MANAGEMENT / Membership` действует строгое предписание:
     `❌ Please note that registration is mandatory. Kindly submit your registration number within 30 days.`
   - Напротив строки `Registration number (RPP ID)` активна кнопка `[Edit]`.
   - Как только министерство MITERD выдаст номер `ENV/2026/XXXXXXXXX`, его необходимо внести в эту строку в ЛК Procircular, подтвердив исполнение государственной регистрации. Дедлайн: **22 ноября 2026 года** (30 дней от даты договора 23.10.2026).

Контакты MITERD: `bzn-rpp@miteco.es` (регистр, декларации),
`buzon-sgr@miteco.es` (толкование RD 1055/2022), тел. 917284813.
Контакты Procircular: `info@procircular.es`, тел./sede Pozuelo de Alarcón (Madrid).
