# Документы индивидуального предпринимателя (Autónomo)

В этой директории хранятся официальные регистрационные, налоговые и административные документы индивидуального предпринимателя в Испании (*Autónomo / Vitalii Iasinskii / Viasglobal*).

## Файлы документов

### `certificado_situacion_censal_2026-09-23.pdf`
- **Что это**: Официальный электронный сертификат налогового статуса из Государственного агентства налоговой администрации Испании (*Agencia Estatal de Administración Tributaria — AEAT*).
- **Дата выдачи**: 23 сентября 2026 г.
- **Номер справки (Nº de Referencia)**: `20269409296`
- **Код электронной верификации (CSV)**: `B2LR8ME9RKYAX683` (проверка подлинности на `https://sede.agenciatributaria.gob.es`).

### `Informe actividades declaradas.pdf`
- **Что это**: Отчёт Tesorería General de la Seguridad Social (TGSS) о задекларированных видах деятельности autónomo.
- **Дата выдачи**: 23 октября 2026 г. (запрос от 23/10/2026 12:12:46, CEA `2AE6KT5AECMW`).
- **Задекларированные CNAE** (все с датой начала 15/01/2024, только IT, торговли нет):
  - `6290` Otros servicios relacionados con las tecnologías de la información y la informática
  - `6210` Actividades de programación informática
- **Статус по e-commerce**: код торговли `4791` (IAE 665.1) добавлен хестором 26/10/2026 с датой начала 21/09/2026 (квитанция `cnae-comercio-2026-10-23/justificante_nueva_actividad_2026-10-26.pdf`, Id. CEA `28DFII5B0DMY`).

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

## Текущие юридические кейсы и история изменений (Audit Log)

### 1. Добавление торгового кода CNAE 4791 в TGSS (Октябрь 2026)
- **Папка кейса**: [cnae-comercio-2026-10-23/README.md](file:///Users/usuario/code/viasglobal/legal/autonomo/cnae-comercio-2026-10-23/README.md)
- **Проблема**: В выписке TGSS от 23.10.2026 отсутствовал код торговли CNAE 4791 (числились только IT-коды 6290, 6210, 6220), а адрес был устаревшим (Lucena del Cid).
- **Выполнено**: Хестор Jorge Dorado Rubio оформил изменение 26.10.2026 в 09:31, получен официальный квиток TGSS (Id. CEA: `28DFII5B0DMY`, дата начала 21/09/2026).
- **Предстоящее действие**: 28.10.2026 выгрузить сводный отчет *Informe de actividades declaradas* в [TGSS Import@ss](https://portal.seg-social.gob.es/wps/portal/importass/importass/Categorias/Vida+laboral+e+informes/Informes+sobre+tu+situacion+laboral/Informe+de+actividades+declaradas) для контроля адреса и финального закрытия задачи в Google Tasks (при необходимости связаться с хестором в [Taxfix](https://app.taxfix.es/)).
- **Активная задача в Google Tasks**: [Открыть задачу Taxfix в Google Tasks](https://tasks.google.com/task/OFCAmmI_49DHwyPV?sa=6) (Дедлайн: `2026-10-28`, ID: `T0ZDQW1tSV80OURId3lQVg`).



