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

## Текущий статус регистрации RAP (на 25.10.2026):
- **SCRAP**: Procircular (`join.procircular.es`).
- **Договоры присоединения**: Подписаны и приняты 23.10.2026 по трем категориям:
  - `certificados/contrato_adhesion_Procircular_Household_2026-10-23.pdf`
  - `certificados/contrato_adhesion_Procircular_Commercial_2026-10-23.pdf`
  - `certificados/contrato_adhesion_Procircular_Industrial_2026-10-23.pdf`
  - `certificados/contrato_adhesion_Procircular_2026-10-23.pdf` (общие условия T&C).
- **Сертификаты членства (*Certificado de pertenencia*)**: Получены 25.10.2026 (датированы 23.10.2026):
  - `certificados/certificado_scrap_Procircular_Household_2026.pdf` (Категория Household / Doméstico — B2C продажи Amazon)
  - `certificados/certificado_scrap_Procircular_Commercial_2026.pdf` (Категория Commercial — опт / дистрибуция)
  - `certificados/certificado_scrap_Procircular_Industrial_2026.pdf` (Категория Industrial — паллеты / оптовая тара)
- **Реквизиты заявителя**: Vitalii Iasinskii, NIE Z1154366R, Ronda Albocacer 11, 12166 Els Ibarsos, Castellón.
- **Реквизиты SCRAP**: PROCIRCULAR ENVASES, S.L. (NIF B-72918006, авторизация 13SCRA5000042205P, администратор RECLAY IBERIA, S.L., Calle Sevilla, 9, local 5, Pozuelo de Alarcón, Madrid - 28223).
- **Официальный государственный номер RPP (Sección Envases)**: **`ENV/2026/000121685`** (присвоен 25.10.2026 министерством MITERD, квитанция: `certificados/justificante_registro_RPP_2026-10-25.pdf`, регистрационная запись `REGAGE26e00091871330`, CSV: `MA5010KKVKDRAXN+Q6RY2WQA3S1792921061`).
- **Текущий статус шагов**: 
  - Номер `ENV/2026/000121685` внесен в Procircular 25.10.2026: статус *«RPP validation is in progress»* (автоматическая сверка до 24 рабочих часов).
  - Номер `ENV/2026/000121685` внесен в Amazon Seller Central 25.10.2026 (*Embalaje de España*): статус *«Verificaremos tu número de registro de EPR cuando se actualice el Registro Nacional. No es necesario que hagas nada»*.
  - Шаблон обязательной строчки для фактур зафиксирован в `legal/envases_rap/facturas/README.md`.
  - Следующий шаг: подача предварительной декларации за 2026 г. в Procircular (до 22.11.2026).
- **Обязательства и график отчетности (Key dates 2026)**:
  - **До 28 февраля**: Сдача годовой итоговой декларации (фактический вес кг) в ЛК Procircular (*Submission to SCRAP*).
  - **До 31 марта**: Сдача государственной декларации в госреестр RPP (*Upload to Producers Register MITECO*).
  - **31 марта**: Ежегодный счет Procircular (*First invoice*), включающий регуляризацию за прошлый год и аванс на текущий. При взносе <= 500 € + IVA оплачивается один раз в год.
  - **Механика регуляризации (Regularisation process)**: Сверка авансового прогноза (*provisional*) и факта (*final*). Если факт > прогноза — счет на разницу; если факт = прогнозу — 0 € (наш случай за 2025 г., так как деятельность открыта 21.09.2026); если факт < прогноза — кредитная нота в счет следующего года или возврат.
  - **Обязанность новичка**: Подача предварительной декларации за 2026 год в течение 30 дней со дня присоединения (ст. 9.1.b).
  - **Дедлайн внесения номера утилизации (RPP ID)**: В течение 30 дней со дня договора (до 22.11.2026) внести присвоенный номер `ENV/2026/...` в ЛК Procircular (Daily Management -> Registration number (RPP ID) -> Edit).

## Обязанности ИИ при работе с директорией:
1. **Точность нормативной базы**: Все рекомендации должны строго соответствовать Real Decreto 1055/2022, Регламенту (ЕС) 2025/40 и регламентам MITERD (Министерство экологического перехода Испании).
2. **Контроль структуры и файлов**:
   - `certificados/`: сертификаты членства в SCRAP (`certificado_scrap_Procircular_...pdf`), контракты присоединения (`contrato_adhesion_Procircular_2026-10-23.pdf`), выписки RPP с номером `ENV/...`.
   - `declaraciones/`: ежегодные декларации кг упаковки по материалам (до 31 марта каждого года в RPP, до 28 февраля в Procircular).
   - `facturas/`: шаблоны счетов-фактур с обязательным указанием присвоенного номера RPP `ENV/...`.
3. **Двойная документация**: При получении новых данных или изменении статуса регистрации обязательно обновлять `README.md` и инструкции.
