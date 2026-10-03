# Финансовый AI-ассистент учета платежей (AI Financial Assistant)

Документ описывает архитектуру и бизнес-логику интеллектуального финансового ассистента для автоматического разбора платежей аренды и ЖКУ от владельца недвижимости (через Telegram-бота) с использованием связки Whisper (транскрипция аудио) и DeepSeek-V3 (извлечение сущностей и структурирование).

---

## 1. Назначение и решаемая проблема

Владелец недвижимости принимает платежи от арендаторов через внесение наличных в банкоматы (на карты разных банков - Сбербанк, Т-Банк, ВТБ, Альфа-Банк). Арендаторы сообщают об оплате в различных мессенджерах (Telegram, WhatsApp, VK) текстом, голосовыми сообщениями или фото чеков.

**Задача ассистента**:
1. Принимать входящие сообщения от администратора в Telegram (текст, голосовые заметки `.ogg`, фотографии квитанций/чеков).
2. Транскрибировать голос в текст (через Whisper API / Groq).
3. Извлекать структурированные данные платежа с помощью LLM (DeepSeek-V3 / `deepseek-chat`):
   - Определение арендатора и квартиры (сопоставление со справочником БД).
   - Выделение суммы платежа и банка зачисления.
   - Классификация платежа: аренда (`RENT`), коммуналка (`UTILITIES`), комбинированный платеж (`COMBINED`), залог (`DEPOSIT`) или прочее (`OTHER`).
   - Разделение комбинированного платежа на составляющие (`subPayments`).
4. Формировать интерактивную карточку подтверждения с инлайн-кнопками в Telegram (`✅ Подтвердить`, `✏️ Изменить`, `❌ Отклонить`).
5. Записывать платеж в БД (`create_payment` через RabbitMQ в микросервис `accountant`) строго после явного подтверждения администратором.

---

## 2. Архитектура взаимодействия

```mermaid
sequenceDiagram
    actor Admin as Администратор (Владелец)
    participant Bot as Telegram Bot Service
    participant STT as Whisper API (Groq / OpenAI)
    participant LLM as DeepSeek-V3 (deepseek-chat)
    participant Accountant as Accountant Service
    database DB as PostgreSQL

    Admin->>Bot: Голосовое сообщение / Текст / Чек
    alt Голосовое сообщение
        Bot->>STT: Отправка аудиофайла .ogg
        STT-->>Bot: Транскрибированный текст
    end
    Bot->>Accountant: Запрос актуального контекста (get_all_tenants, get_apartments)
    Accountant-->>Bot: Список активных жильцов, квартир и последних квитанций
    Bot->>LLM: Системный промпт + Контекст БД + Текст сообщения
    LLM-->>Bot: Валидный JSON со структурой платежа
    Bot->>Admin: Интерактивная карточка с деталями платежа и кнопками
    Admin->>Bot: Нажатие [✅ Подтвердить]
    Bot->>Accountant: Событие create_payment
    Accountant->>DB: Сохранение платежа со статусом confirmed
    Accountant-->>Bot: Подтверждение записи
    Bot->>Admin: Сообщение: «✅ Платеж успешно внесен в систему»
```

---

## 3. Системный промпт и контекст данных

Шаблон промпта хранится в файле [`rent/промт.md`](file:///Users/usuario/code/viasglobal/rent/%D0%BF%D1%80%D0%BE%D0%BC%D1%82.md).

При обращении к LLM в промпт динамически подставляются:
- `{{CURRENT_DATETIME}}`: текущие дата и время (например, `2026-10-03 23:15:00`).
- `{{DATABASE_CONTEXT}}`: актуальный срез базы данных по арендаторам, квартирам, суммам аренды, расчетным дням и последним квитанциям:
```json
[
  {
    "tenantId": 1,
    "name": "Павел Иванов",
    "apartmentId": 10,
    "apartmentAddress": "ул. Ленина, д. 5, кв. 12",
    "rentAmount": 35000.00,
    "rentPaymentDay": 5,
    "latestInvoice": { "period": "2026-09", "amount": 3450.00, "isPaid": false }
  }
]
```

---

## 4. Схема ответа (JSON Schema)

LLM возвращает строгий JSON следующего формата:

```typescript
export interface ParsedPaymentDraft {
  status: 'ready' | 'needs_clarification';
  confidence: number; // 0.0 - 1.0
  tenantId: number | null;
  tenantName: string | null;
  apartmentAddress: string | null;
  totalAmount: number;
  bank: string;
  paymentDate: string; // YYYY-MM-DD
  paymentType: 'RENT' | 'UTILITIES' | 'COMBINED' | 'DEPOSIT' | 'OTHER';
  comment: string;
  summaryText: string;
  subPayments: Array<{
    type: 'RENT' | 'UTILITIES';
    amount: number;
    description: string;
  }>;
  clarificationQuestion: string | null;
  clarificationCandidates: Array<{
    tenantId: number;
    name: string;
    apartment: string;
  }>;
}
```

---

## 5. Правила классификации и распознавания

1. **Идентификация арендатора**:
   - Понимание разговорных форм («Паша», «Павел», «с Ленина», «с однушки», «кв 12»).
   - При однозначном совпадении выставляется `tenantId` и `status: "ready"`.
   - При неоднозначности выставляется `status: "needs_clarification"` со списком кандидатов в `clarificationCandidates`.

2. **Распознавание сумм**:
   - Корректная конвертация выражений («35 тысяч», «35к», «сорокет» -> `40000.00`, «сорок две с половиной тысячи» -> `42500.00`).

3. **Определение банка**:
   - «Сбер» / «зеленый» -> `Сбербанк`
   - «Т-Банк» / «Тинькофф» -> `Т-Банк`
   - «Альфа» -> `Альфа-Банк`
   - «ВТБ» -> `ВТБ`
   - При отсутствии упоминания -> `Не указан`

4. **Типы платежей**:
   - `RENT`: сумма близка к `rentAmount` или указано назначение «за аренду/квартиру».
   - `UTILITIES`: сумма совпадает с `latestInvoice.amount` или указано «за коммуналку/свет/воду».
   - `COMBINED`: внесена общая сумма, покрывающая аренду и ЖКУ (с детализацией в `subPayments`).
   - `DEPOSIT`: залог/обеспечительный платеж.
   - `OTHER`: прочие компенсации или расходы.
