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
  - [x] Внести номер **`ENV/2026/000121685`** в личный кабинет Procircular (Внесен 25.10.2026; **успешно верифицирован 28.10.2026**: валидация завершена, номер RPP официально привязан к NIF `Z1154366R` по категориям Household, Commercial, Industrial, доступна генерация сертификатов *Create Certificate*). Контрольная задача выполнена: [Google Tasks: QWdHalRSZjlCUEk1c0lXNQ](https://tasks.google.com/task/AgGjTRf9BPI5sIW5?sa=6).
  - [x] Внести номер **`ENV/2026/000121685`** в Amazon Seller Central (Раздел *Cumplimiento normativo / Embalaje de España*, отправлено 25.10.2026; на 28.10.2026 статус *«Under review»*: номер принят и находится на плановой сверке Amazon с государственной базой MITERD, средний регламент валидации — 5–10 рабочих дней). Контрольная задача на **03.11.2026**: [Google Tasks: Wkk0MEFnV0tzZ3Z1dG42Qg](https://tasks.google.com/task/ZI40AgWKsgvutn6B?sa=6).
  - [x] Подготовлен шаблон обязательной строки с номером RPP для счетов-фактур (*facturas*): `N.º de Registro de Productores de Producto (Sección Envases): ENV/2026/000121685` ([facturas/README.md](file:///Users/usuario/code/viasglobal/legal/envases_rap/facturas/README.md)).
- [ ] **Шаг 5 (В процессе, дедлайн 20.11.2026)**: Подача предварительной декларации в Procircular (в течение 30 дней с момента присоединения, до 20.11.2026) и настройка учета кг (`registro_envases_kg_2026.xlsx`).
  - **Активная задача в Google Tasks**: [`[Legal]: Envases RAP — Дедлайн предварительной декларации упаковки в Procircular (30 дней)`](https://tasks.google.com/task/yDo3Dk_eDPnl7D0p?sa=6) (Дедлайн: `2026-11-20`, ID: `eURvM0RrX2VEUG5sN0QwcA`).
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

5. **Внесение номера RPP ID в личный кабинет Procircular (Выполнено 25.10.2026, верифицировано 28.10.2026)**:
   - Номер `ENV/2026/000121685` внесен и успешно подтвержден в системе Procircular. Статус проверки завершен, номер привязан к NIF `Z1154366R` по категориям Household, Commercial, Industrial.

6. **Вкладка «Prevention Plan» (PEPE 2024–2028) — Платить НЕ нужно**:
   - **Что это такое**: План предотвращения образования отходов упаковки и экодизайна (*Plan Empresarial de Prevención y Ecodiseño — PEPE*, ст. 18 Real Decreto 1055/2022).
   - **Пороги обязательности по закону (в год)**:
     - Картон и бумага (*Paper/Cardboard*): **от 15 тонн** (15 000 кг)
     - Пластик (*Plastics*): **от 20 тонн** (20 000 кг)
     - Дерево (*Wood*): **от 20 тонн**
     - Алюминий (*Aluminium*): **от 30 тонн**
     - Сталь (*Steel*): **от 50 тонн**
     - Стекло (*Glass*): **от 250 тонн**
   - **Статус для Viasglobal (autónomo)**: Объем упаковки составляет `0 t` (а при рабочих объемах исчисляется сотнями килограммов), что на порядки ниже минимального порога закона.
   - **Официальный вердикт Procircular**: В верхней синей плашке системы прямо зафиксировано: *«Considering the available data, you are NOT REQUIRED to submit a prevention plan»* (С учетом доступных данных, вам НЕ требуется подавать план предотвращения).
   - **Платная услуга «+ Join PEPE»**: Предложение вступить в коллективный план за **90 €** (составление) + **100 €/год** (мониторинг) является чисто добровольной коммерческой опцией Procircular.
   - **Правило**: Кнопку `+ Join PEPE` **НЕ нажимать**, платить **НЕ нужно**. Никаких обязательств по оплате этих сумм у компании нет.

Контакты MITERD: `bzn-rpp@miteco.es` (регистр, декларации),
`buzon-sgr@miteco.es` (толкование RD 1055/2022), тел. 917284813.
Контакты Procircular: `info@procircular.es`, тел./sede Pozuelo de Alarcón (Madrid).
