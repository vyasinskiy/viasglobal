# Документы индивидуального предпринимателя (Autónomo)

В этой директории хранятся официальные регистрационные, налоговые и административные документы индивидуального предпринимателя в Испании (*Autónomo / Vitalii Iasinskii / Viasglobal*).

## Файлы документов

### `certificado_situacion_censal_2026-09-23.pdf`
- **Что это**: Официальный электронный сертификат налогового статуса из Государственного агентства налоговой администрации Испании (*Agencia Estatal de Administración Tributaria — AEAT*).
- **Дата выдачи**: 23 сентября 2026 г.
- **Номер справки (Nº de Referencia)**: `20269409296`
- **Код электронной верификации (CSV)**: `B2LR8ME9RKYAX683` (проверка подлинности на `https://sede.agenciatributaria.gob.es`).

### `Informe actividades declaradas.pdf`
- **Что это**: Официальный отчет Tesorería General de la Seguridad Social (TGSS) о задекларированных видах деятельности autónomo.
- **Дата выдачи**: 29 октября 2026 г. (запрос от 29/10/2026 16:22:24, Id. CEA `2235SP5E5AWS`, Código CEA `NOKKY-XGY4F-BWLZZ-FSCVG-YKYYY-UIEJW`).
- **Задекларированные CNAE**:
  - `4791` Actividades de servicios de intermediación para el comercio al por menor no especializado (IAE `6651`, дата начала: **21/09/2026**) — *онлайн-торговля e-commerce*.
  - `6290` Otros servicios relacionados con las tecnologías de la información y la informática (дата начала: 15/01/2024).
  - `6210` Actividades de programación informática (дата начала: 15/01/2024).
  - `6220` Actividades de consultoría informática y gestión de instalaciones informáticas (дата начала: 15/01/2024).
- **Адрес деятельности**: `ALBOCACER 11, Piso 19, Puerta 1, 12166, Ibarsos, els, Castelló/castellón`.
- **Статус соответствия**: Полная 100% синхронизация между Seguridad Social (TGSS) и налоговой службой (AEAT).

### `informe_bases_cotizacion_2026-10-29.pdf`
- **Что это**: *Informe integral de bases de cotización* из TGSS (RETA) за период 01/2024–12/2026.
- **Дата выдачи**: 29.10.2026, код верификации `QYY67-O2P2X-QTIT2-K6TKL-FNX5N-YBVCZ` (действителен до 28.11.2026).
- **Базы взносов по месяцам**:
  - **2024**: январь 538,89 € (неполный месяц, регистрация с 15.01), февраль–декабрь 950,98 € (минимальная база общей таблицы; в этот период действовала tarifa plana 80 €).
  - **2025**: январь–февраль 950,98 €, **с марта 653,59 €**. Это минимальная база сокращённой таблицы (доход до ~670 €/мес), то есть в начале 2025 базу **понизили**, а не повысили.
  - **2026**: январь–сентябрь 653,59 € (cuota ≈205 €/мес). За октябрь стоит «---», это нужно перепроверить после закрытия месяца. Ноябрь и декабрь пока пустые.
- **Вывод**: повышения базы в отчёте нет. Запланированные изменения (с 01.11.2026 / 01.01.2027) этот отчёт не показывает, их нужно проверять в [Import@ss — Trabajo autónomo](https://portal.seg-social.gob.es/wps/portal/importass/importass/Categorias/Trabajo+autonomo).

---

## Сводка ключевых реквизитов и статусов

### 1. Идентификация и адреса
- **NIF / NIE**: `Z1154366R`
- **ФИО (Nombre / Razón Social)**: `IASINSKII VITALII`
- **Налоговый адрес (Domicilio Fiscal)**: `RONDA ALBOCACER NUM 11 Esc. 1 Planta 0 Pta. 19, 12166 IBARSOS (ELS), SIERRA ENGARCERÁN (CASTELLÓN)`
- **Адрес для уведомлений (Domicilio a efectos de notificaciones)**: `RONDA ALBOCACER NUM 11 Planta 19 Pta. 1, 12166 SIERRA ENGARCERÁN (CASTELLÓN)`
- **Налоговое резидентство**: Да (Residente: SI)

### 2. Зарегистрированные виды экономической деятельности (IAE / CNAE / NACE)
1. **Эпиграф 665 (Sección Empresarial)**:
   - **Название**: `Comercio Menor Por Correo o Catálogo` (Розничная торговля по почте или каталогам / онлайн-торговля / e-commerce).
   - **Дата постановки на учет**: `21/09/2026`
   - **Код активности AEAT**: `A03`
   - **Соответствующий международный код NACE Rev. 2 / CNAE-2009**: **`47.91`** (*Retail sale via mail order houses or via Internet*).
2. **Эпиграф 763 (Sección Profesional)**:
   - **Название**: `Programadores y Analistas de Informática` (Программисты и аналитики информационных систем).
   - **Дата постановки на учет**: `01/07/2026`
   - **Код активности AEAT**: `A05`
   - **Соответствующий код NACE Rev. 2 / CNAE-2009**: **`62.01`** / **`62.02`**.

### 3. Налоговые режимы (Situación Tributaria)
- **НДС (IVA)**:
  - **ROI (Registro de Operadores Intracomunitarios / VIES)**: зарегистрирован с `15-01-2024` (право на приобретение и поставку товаров внутри ЕС с 0% НДС по механизму reverse charge).
  - **Общий режим (Régimen General)**: с `15-01-2024`.
  - **Специальный режим эквивалентной надбавки (Régimen especial recargo de equivalencia)**: с `21-09-2026`.
- **Подоходный налог (IRPF)**:
  - Метод расчета: **Estimación directa simplificada** с `15-01-2024`.
- **Периодические обязательства**:
  - Квартальные авансовые платежи IRPF (Pago fraccionado, Modelo 130).
  - Квартальная отчетность по НДС (IVA, Modelo 303).
  - Годовые декларации (Modelo 390, Modelo 100 Renta).

---

## Бухгалтерское и налоговое сопровождение (Gestoría Online)

- **Сервис**: **Taxfix** ([taxfix.es](https://taxfix.es/)).
- **Назначенный консультант / Хестор**: Jorge Dorado Rubio.
- **Роль**: онлайн-хестория и налоговый консультант (gestoría / asesoría fiscal online) в Испании, которая ведет учет и сопровождает деятельность autónomo (*Vitalii Iasinskii*).
- **Зона ответственности и функции Taxfix**:
  - Ведение налогового и бухгалтерского учета ИП.
  - Формирование и подача регулярной квартальной отчетности в AEAT (Agencia Tributaria): Modelo 303 (НДС / IVA), Modelo 130 (авансы IRPF).
  - Формирование и подача годовой отчетности: Modelo 390 (годовой сводный отчет по НДС), Modelo 100 (декларация о доходах физических лиц / Declaración de la Renta).
  - Администрирование взаимодействия с органом социального страхования (TGSS / Seguridad Social, система RETA).
  - Подача заявлений на изменение регистрационных данных (Modelo 036/037 в AEAT, вариация данных TA.0521 в TGSS, добавление новых кодов IAE и CNAE).
  - Консультации по применению спецрежима эквивалентной надбавки (*recargo de equivalencia*) и внутриевропейского реестра операторов *ROI / VIES*.

---

## Взносы в Seguridad Social (RETA, cuota de autónomo)

- **Система с 2023 года**: взнос зависит от *rendimientos netos* (чистого дохода), а не от выручки. Чистый доход = доходы − вычитаемые расходы − сами взносы RETA − 7% «общих расходов» (*gastos genéricos*), затем делится на 12.
- **Ежемесячная cuota предварительная**: autónomo сам выбирает базу (*base de cotización*) по прогнозу дохода. Если выбрана минимальная база (≈200 €/мес), а фактический доход выше — после подачи Renta (Modelo 100) налоговая передаёт данные в TGSS, и та делает **регуляризацию** (*regularización*): присылает счёт на доплату разницы за весь год (или возвращает переплату).
- **Ориентир (таблица 2025)**: чистый доход 3 620–4 050 €/мес → минимальная база ≈1 732 € → cuota ≈540 €/мес. Минимальная cuota ≈200 €/мес соответствует доходу ниже ≈670 €/мес. Актуальную таблицу текущего года проверять на [seg-social.es](https://www.seg-social.es/).
- **Tarifa plana 80 €**: по дате регистрации 15.01.2024 действовала первые 12 месяцев (до января 2025); продление на второй год возможно только при доходе ниже SMI.
- **Как избежать крупной доплаты**: поменять базу в [Import@ss — Trabajo autónomo](https://portal.seg-social.gob.es/wps/portal/importass/importass/Categorias/Trabajo+autonomo) (до 6 раз в год) или через хестора [Taxfix](https://app.taxfix.es/).
- **Когда вступает в силу смена базы и прогноза дохода** (*cambio de base y previsión de rendimientos*):

  | Заявление подано | Новая база действует с |
  |---|---|
  | 1 января – конец февраля | 1 марта |
  | 1 марта – 30 апреля | 1 мая |
  | 1 мая – 30 июня | 1 июля |
  | 1 июля – 31 августа | 1 сентября |
  | 1 сентября – 31 октября | 1 ноября |
  | 1 ноября – 31 декабря | 1 января следующего года |

  Чтобы платить полную сумму с 01.01.2027, заявление нужно подать в период 01.11–31.12.2026. Если подать до 31.10.2026, новая база начнёт действовать уже с 01.11.2026, и доплата по регуляризации за 2026 год будет меньше.

## Текущие юридические кейсы и история изменений (Audit Log)

### 1. Добавление торгового кода CNAE 4791 в TGSS (Октябрь 2026)
- **Папка кейса**: [cnae-comercio-2026-10-23/README.md](file:///Users/usuario/code/viasglobal/legal/autonomo/cnae-comercio-2026-10-23/README.md)
- **Проблема**: В выписке TGSS от 23.10.2026 отсутствовал код торговли CNAE 4791 (числились только IT-коды 6290, 6210, 6220), а адрес был устаревшим (Lucena del Cid).
- **Выполнено**: Хестор Jorge Dorado Rubio оформил изменение 26.10.2026 в 09:31, получен официальный квиток TGSS (Id. CEA: `28DFII5B0DMY`, дата начала 21/09/2026).
- **Предстоящее действие**: 28.10.2026 выгрузить сводный отчет *Informe de actividades declaradas* в [TGSS Import@ss](https://portal.seg-social.gob.es/wps/portal/importass/importass/Categorias/Vida+laboral+e+informes/Informes+sobre+tu+situacion+laboral/Informe+de+actividades+declaradas) для контроля адреса и финального закрытия задачи в Google Tasks (при необходимости связаться с хестором в [Taxfix](https://app.taxfix.es/)).
- **Активная задача в Google Tasks**: [Открыть задачу Taxfix в Google Tasks](https://tasks.google.com/task/OFCAmmI_49DHwyPV?sa=6) (Дедлайн: `2026-10-28`, ID: `T0ZDQW1tSV80OURId3lQVg`).

### 2. Корректировка базы взносов RETA (Октябрь 2026)
- **Папка кейса**: [base-cotizacion-2026-10-29/README.md](file:///Users/usuario/code/viasglobal/legal/autonomo/base-cotizacion-2026-10-29/README.md)
- **Проблема**: с 03.2025 стоит минимальная база 653,59 € (cuota ≈200 €), хотя доход ≈4 000 €/мес; есть риск регуляризации.
- **Статус**: 29.10.2026 подготовлено письмо хестору ([carta_para_gestor.md](file:///Users/usuario/code/viasglobal/legal/autonomo/base-cotizacion-2026-10-29/carta_para_gestor.md)) с просьбой выставить верную базу с 01.11.2026 (или не позднее 01.01.2027).
- **Активная задача в Google Tasks**: [Проконтролировать изменение базы RETA](https://tasks.google.com/task/zJFjPxwHSrGL6y5c?sa=6) (Дедлайн: `2026-11-03`, ID: `ekpGalB4d0hTckdMNnk1Yw`).



