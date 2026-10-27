# Юридические вопросы и документы (Legal)

В этой директории хранятся документы, расчеты и материалы по всем юридическим, нотариальным, налоговым и административным вопросам компании и учредителей в Испании.

## Назначение директории
Директория объединяет документацию по взаимодействию с государственными органами, нотариусами, налоговой службой и реестрами:
- **Налоги и налоговые вычеты (AEAT / IRPF)**: расчеты налоговых баз, льготы и вычеты по энергоэффективности, подтверждающие платежи и счета.
- **Нотариат и реестры (Notaría / Registro de la Propiedad)**: нотариальные акты (escrituras), дарения (donaciones), купля-продажа, выписки из реестра собственности и кадастра.
- **Официальные документы и удостоверения**: справки о банковских счетах, переводы, сертификаты и сопутствующие документы.

## Структура поддиректорий

### `energy-efficiency-deduction-2026/`
- Материалы по налоговому вычету за энергоэффективность в жилье (DA 50ª Ley 35/2006 IRPF, RDL 19/2021).
- Счета и подтверждения платежей (aires acondicionados, placas solares, tasas municipales, honorarios del certificado CEE posterior).
- Энергетические сертификаты (CEE) и регистрация IVACE:
  - Сертификат до работ: [`certificado_anterior.pdf`](file:///Users/usuario/code/viasglobal/legal/energy-efficiency-deduction-2026/certificado_anterior.pdf) (E2024VI105123 от 02.12.2024, класс E / 178,21 кВт·ч/м²·год).
  - Сертификат после работ: [`certificado_posterior.pdf`](file:///Users/usuario/code/viasglobal/legal/energy-efficiency-deduction-2026/certificado_posterior.pdf) (E2026VF098103 от 16.10.2026, наивысший класс **A** / 13,9 кВт·ч/м²·год — снижение невозобновляемой первичной энергии на 92,2%, право на вычет 40%).
  - Официальный документ о регистрации сертификата в реестре IVACE / Generalitat Valenciana: [`registro_cee.pdf`](file:///Users/usuario/code/viasglobal/legal/energy-efficiency-deduction-2026/registro_cee.pdf).
- Аналитические отчеты и юридические заключения по применимости ставок вычета (20%, 40%, 60%).

### [`declaraciones/`](file:///Users/usuario/code/viasglobal/legal/declaraciones/)
- Единый структурированный архив и реестр налоговых деклараций индивидуального предпринимателя (*Autónomo*) и физического лица в Испании (AEAT).
- **Квартальные декларации (Trimestrales)**: распределение по годам (`2024/`, `2025/`, `2026/`) и кварталам (`1T/`, `2T/`, `3T/`, `4T/`) для Modelo 130 (аванс IRPF 20%), Modelo 303 (IVA), Modelo 349 (внутриевропейский ROI/VIES).
- **Годовые декларации (Anuales)**: годовые сводки Modelo 390 (IVA).
- **Renta 2026**: специальный раздел подготовки к годовой декларации подоходного налога (*Modelo 100*) в [`declaraciones/2026/renta/`](file:///Users/usuario/code/viasglobal/legal/declaraciones/2026/renta/) с вычетом по энергоэффективности (3 000 €) и пошаговым чек-листом по субсидии на солнечные панели.

### `escritura_donacion/`
- Документы для оформления нотариального акта дарения (escritura de donación).
- Удостоверения личности (NIE, TIE, паспорта).
- Справки о принадлежности банковских счетов (titularidad de cuenta).
- Проекты писем нотариусу и аналитика условий оформления.

### `envases_rap/`
- Оформление расширенной ответственности производителя (RAP) по упаковке в Испании (Real Decreto 1055/2022).
- Договоры присоединения к Procircular по категориям Household, Commercial, Industrial ([`contrato_adhesion_Procircular_...pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/)).
- Официальные сертификаты членства (*Membership Certificate*) по всем 3 категориям ([`certificado_scrap_Procircular_...pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/)).
- Присвоенный государственный номер **`ENV/2026/000121685`**, официальная квитанция с цифровой подписью министерства MITERD ([`justificante_registro_RPP_2026-10-25.pdf`](file:///Users/usuario/code/viasglobal/legal/envases_rap/certificados/justificante_registro_RPP_2026-10-25.pdf)), годовые декларации по весу упаковки и шаблоны инвойсов.

### `autonomo/`
- Официальные налоговые сертификаты и выписки предпринимателя (Agencia Tributaria / AEAT).
- Регистрационные данные, коды видов экономической деятельности (IAE 665 / 763, NACE 47.91).
- Сертификаты ситуации в налоговом реестре (Certificado de Situación Censal), подтверждение ROI (VIES) и налоговых режимов.
- Бухгалтерский учет и налоговое сопровождение autónomo: онлайн-сервис **Taxfix** ([taxfix.es](https://taxfix.es/)).

