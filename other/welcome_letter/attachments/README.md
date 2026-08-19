# Пакет документов для B2B поставщиков (Attachments)

В этой директории хранятся официальные документы и презентационные материалы компании (Autónomo в Испании / Viasglobal), прикрепляемые к письмам поставщикам для подтверждения благонадежности, юридической чистоты и открытия B2B/Dealer аккаунта.

---

## Рекомендуемый пакет документов (Autónomo / Испания)

### 1. Карточка компании (Company Details Sheet / Ficha de Empresa) ⭐ *Обязательно*
- **Что это:** Фирменный 1-страничный PDF-документ с логотипом Viasglobal и полными реквизитами.
- **Что содержит:**
  - Торговое название: `Viasglobal`
  - Юридическое имя (Autónomo): `Vitalii Iasinskii`
  - VAT / NIF: `ESZ1154366R` (активен в VIES / ROI)
  - Юридический адрес и адрес доставки/склада в Испании
  - Контакты (Email, телефон, сайт: `https://viasglobal.es`)
  - Банковские реквизиты (IBAN / BIC/SWIFT)

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

## Файлы шаблонов в этой папке

- [`company_details_sheet.html`](file:///Users/usuario/code/viasglobal/other/welcome_letter/attachments/company_details_sheet.html) — **Фирменный HTML-бланк формата А4** с логотипом Viasglobal, стильным оформлением, бэйджем VIES и кнопкой `Print / Save as PDF` для мгновенного сохранения в красивый PDF-документ.
- [`company_details_template.md`](file:///Users/usuario/code/viasglobal/other/welcome_letter/attachments/company_details_template.md) — Текстовый вариант карточки для быстрого копирования реквизитов.

---

## Рекомендуемые PDF-документы для прикрепления:

1. `company_details_viasglobal.pdf` — Экспортированная в PDF карточка из `company_details_sheet.html`.
2. `vies_roi_certificate.pdf` — Официальный сертификат VIES/ROI (Modelo 036) из Agencia Tributaria.
3. `bank_account_certificate.pdf` — Справка о банковском счете (Certificado de Titularidad Bancaria).
