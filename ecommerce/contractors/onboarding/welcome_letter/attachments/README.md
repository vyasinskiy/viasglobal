# Пакет документов для B2B поставщиков (Attachments)

В этой директории хранятся официальные документы и презентационные материалы компании (Autónomo в Испании / Viasglobal), прикрепляемые к письмам поставщикам для подтверждения благонадежности, юридической чистоты и открытия B2B/Dealer аккаунта.

---

## Рекомендуемый пакет документов (Autónomo / Испания)

### 1. Карточка компании (Company Details Sheet / Ficha de Empresa) ⭐ *Обязательно*
- **Что это:** Фирменный 1-страничный PDF-документ с логотипом Viasglobal, полными реквизитами, банковскими данными и юридической оговоркой.
- **Локализации:** Доступна на 5 языках ЕС (EN, ES, DE, FR, IT).
- **Что содержит:**
  - Торговое название: `Viasglobal`
  - Юридическое имя (Autónomo): `Vitalii Iasinskii`
  - VAT / NIF: `ESZ1154366R` (активен в VIES / ROI, 0% Intra-EU VAT)
  - Юридический адрес и адрес доставки/склада в Испании
  - Контакты (Email, телефон, сайт: `https://viasglobal.es`)
  - Банковские реквизиты (Banco Santander, SEPA)
  - Стандарты MAP/RRP и логистики DAP/DDP

### 2. Подтверждение регистрации в ROI / VIES (Modelo 036 / Certificado VIES) ⭐ *Критично для ЕС*
- **Что это:** Документ из Налоговой службы Испании (Agencia Tributaria / AEAT) о включении в *Registro de Operadores Intracomunitarios (ROI)*.
- **Зачем нужно:** Позволяет европейским фабрикам (Чехия, Германия, Польша) выставлять вам инвойсы с **0% НДС (Intra-Community Reverse Charge / Внутриевропейская поставка)**. Без этого многие фабрики отказываются работать или начисляют свой местный НДС.

### 3. Свежая выписка из налоговой (Certificado de Situación Censal)
- **Что это:** Официальный электронный сертификат из AEAT с защитным кодом проверки (CSV — Código Seguro de Verificación).
- **Зачем нужно:** Подтверждает, что деятельность активна прямо сейчас и зарегистрированы соответствующие коды экономической деятельности (IAE / CNAE для оптовой и розничной торговли).

### 4. Справка об отсутствии налоговой задолженности (Estar al corriente con Hacienda)
- **Что это:** *Certificado de estar al corriente de obligaciones tributarias*.
- **Зачем нужно:** Высший маркер надежности для кредитных отделов и крупных дистрибьюторов при запросе отсрочки платежа или крупных заказов.

### 5. Справка о банковском счете (Certificado de Titularidad Bancaria)
- **Что это:** Справка из банка (BBVA, Santander, Sabadell, CaixaBank, Revolut Business, Wise и т.д.) на английском или испанском языке.
- **Зачем нужно:** Подтверждает, что расчетный счет действительно принадлежит предпринимателю/компании, указанной в VAT.

---

## Файлы шаблонов и PDF в этой папке

### Исходные HTML-макеты (для печати в PDF):
- `company_details_en.html` — English (Company Details Sheet)
- `company_details_es.html` — Español (Ficha de Empresa)
- `company_details_de.html` — Deutsch (Unternehmensdatenblatt)
- `company_details_fr.html` — Français (Fiche Entreprise)
- `company_details_it.html` — Italiano (Scheda Aziendale)

### Готовые сгенерированные PDF-документы:
- `Company Details Sheet — Viasglobal (en).pdf` (синхронизирован с `landing/public/viasglobal-company-details-en.pdf`)
- `Company Details Sheet — Viasglobal (es).pdf` (синхронизирован с `landing/public/viasglobal-company-details-es.pdf`)
- `Company Details Sheet — Viasglobal (de).pdf` (синхронизирован с `landing/public/viasglobal-company-details-de.pdf`)
- `Company Details Sheet — Viasglobal (fr).pdf` (синхронизирован с `landing/public/viasglobal-company-details-fr.pdf`)
- `Company Details Sheet — Viasglobal (it).pdf` (синхронизирован с `landing/public/viasglobal-company-details-it.pdf`)
- `company_details_template.md` — Текстовый вариант карточки для быстрого копирования реквизитов.
