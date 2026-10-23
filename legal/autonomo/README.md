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
  - `6220` Actividades de consultoría informática y gestión de instalaciones informáticas (указана дважды)
- **Статус по e-commerce**: код торговли `4791` (соответствует IAE 665) в отчёте **отсутствует** — требуется добавить с датой начала 21/09/2026 для соответствия certificado censal AEAT.

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
  - Квартальные авансовые платежи IRPF (Pago fraccionado).
  - Квартальная отчетность по НДС (IVA).
