# Правила для ИИ: Регистрация и сопровождение RAP (Envases RAP)

Директория `legal/envases_rap/` содержит документы, инструкции и отчетность по расширенной ответственности производителя (RAP — Responsabilidad Ampliada del Productor) за упаковку в Испании согласно Real Decreto 1055/2022 и Регламенту (ЕС) 2025/40 (PPWR).

## Контекст autónomo (Viasglobal):
- **Модель бизнеса**: Онлайн-торговля B2C (Amazon FBA/FBM, e-commerce `https://viasglobal.es`) и B2B опт (Wholesale).
- **Выбранный SCRAP**: **Procircular** (мультиматериальный, покрывает doméstico + comercial + industrial, без вступительного взноса cuota de adhesión).
- **Юридический статус по RD 1055/2022**:
  - `Retail Distributor` (Comercio al por menor) — розничные продажи конечным потребителям на маркетплейсах.
  - `Importer` (Importador) — если товары закупаются в других странах ЕС (intra-EU acquisition) или импортируются из-за пределов ЕС и впервые вводятся в оборот в Испании.
  - `Wholesale Distributor` (Distribuidor mayorista) — при оптовых B2B продажах.
- **Коды экономической деятельности (по официальному Certificado de Situación Censal AEAT)**:
  - **IAE 665**: *Comercio Menor Por Correo o Catálogo* (дата регистрации 21/09/2026, код активности A03) ➔ строго соответствует **NACE / CNAE 47.91** (*Retail sale via mail order houses or via Internet*).
  - **IAE 763**: *Programadores y Analistas de Informática* (дата регистрации 01/07/2026, код активности A05) ➔ NACE 62.01 / 62.02.
  - Первоисточник сертификата: `contractors/safta/attachments/CERTIFICADO DE SITUACION CENSAL (1).pdf` (CSV: `B2LR8ME9RKYAX683`).

## Текущий статус регистрации RAP (на 23.10.2026):
- **SCRAP**: Procircular (`join.procircular.es`).
- **Договор присоединения**: Подписан / принят 23.10.2026 (`certificados/contrato_adhesion_Procircular_2026-10-23.pdf`).
- **Реквизиты организации**: PROCIRCULAR ENVASES, S.L. (NIF B-72918006, авторизация 13SCRA5000042205P, администратор RECLAY IBERIA, S.L., Calle Sevilla, 9, local 5, Pozuelo de Alarcón, Madrid - 28223).
- **Следующий шаг**: Ожидание получения официального сертификата членства (*Certificado de pertenencia*) от Procircular для последующей подачи заявки в RPP (Sede MITERD, процедура SIA 1523222).
- **Обязательства по договору Procircular**:
  - Подача предварительной декларации объемов упаковки в течение 30 дней с момента вступления (ст. 9.1.b).
  - Ежегодная итоговая декларация в Procircular — до 28 февраля (ст. 9.1.a).
  - Оплата взноса при сумме <= 500 € + IVA — единым платежом по счету от 31 марта или в течение месяца после присоединения.

## Обязанности ИИ при работе с директорией:
1. **Точность нормативной базы**: Все рекомендации должны строго соответствовать Real Decreto 1055/2022, Регламенту (ЕС) 2025/40 и регламентам MITERD (Министерство экологического перехода Испании).
2. **Контроль структуры и файлов**:
   - `certificados/`: сертификаты членства в SCRAP (`certificado_scrap_Procircular_...pdf`), контракты присоединения (`contrato_adhesion_Procircular_2026-10-23.pdf`), выписки RPP с номером `ENV/...`.
   - `declaraciones/`: ежегодные декларации кг упаковки по материалам (до 31 марта каждого года в RPP, до 28 февраля в Procircular).
   - `facturas/`: шаблоны счетов-фактур с обязательным указанием присвоенного номера RPP `ENV/...`.
3. **Двойная документация**: При получении новых данных или изменении статуса регистрации обязательно обновлять `README.md` и инструкции.
