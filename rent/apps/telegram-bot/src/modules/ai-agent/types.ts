/**
 * Типы данных и интерфейсы для финансового AI-ассистента
 */

/**
 * Подплатеж внутри комбинированного платежа (аренда + ЖКУ)
 */
export interface SubPayment {
  // Тип составляющей: RENT (аренда) или UTILITIES (коммунальные услуги)
  type: 'RENT' | 'UTILITIES';
  // Сумма составляющей в рублях
  amount: number;
  // Пояснение/описание составляющей
  description: string;
}

/**
 * Вариант жильца/квартиры при неоднозначности распознавания
 */
export interface ClarificationCandidate {
  // Идентификатор арендатора в БД
  tenantId: number;
  // Имя арендатора
  name: string;
  // Адрес или описание квартиры
  apartment: string;
}

/**
 * Структурированный результат парсинга платежа от AI
 */
export interface ParsedPaymentDraft {
  // Уникальный идентификатор черновика (UUID) для инлайн-кнопок
  id: string;
  // Статус готовности предложения: ready или needs_clarification
  status: 'ready' | 'needs_clarification';
  // Степень уверенности модели от 0.0 до 1.0
  confidence: number;
  // Идентификатор арендатора в БД (null, если не определен)
  tenantId: number | null;
  // Имя арендатора
  tenantName: string | null;
  // Адрес квартиры
  apartmentAddress: string | null;
  // Общая сумма платежа
  totalAmount: number;
  // Банк зачисления (Сбербанк, Т-Банк, Альфа-Банк, ВТБ, Не указан)
  bank: string;
  // Дата платежа в формате YYYY-MM-DD
  paymentDate: string;
  // Тип платежа
  paymentType: 'RENT' | 'UTILITIES' | 'COMBINED' | 'DEPOSIT' | 'OTHER';
  // Технический комментарий для сохранения в базу данных
  comment: string;
  // Краткое резюме на русском языке для вывода в Telegram
  summaryText: string;
  // Список составляющих при комбинированном платеже
  subPayments: SubPayment[];
  // Уточняющий вопрос при статусе needs_clarification
  clarificationQuestion: string | null;
  // Список возможных кандидатов при неоднозначности
  clarificationCandidates: ClarificationCandidate[];
  // Исходный текст сообщения (или результат транскрипции)
  rawText?: string;
  // Идентификатор фотографии чека в Telegram (при наличии)
  photoFileId?: string;
  // Временная метка создания черновика
  createdAt: number;
}

/**
 * Формат среза данных арендатора для подстановки в промпт
 */
export interface DatabaseTenantContext {
  // ID арендатора
  tenantId: number;
  // Имя жильца
  name: string;
  // ID квартиры
  apartmentId: number;
  // Адрес квартиры
  apartmentAddress: string;
  // Установленная сумма аренды
  rentAmount: number;
  // Расчетный день месяца для оплаты аренды
  rentPaymentDay: number;
  // Информация о последней квитанции ЖКУ
  latestInvoice: {
    // Расчетный период квитанции (например, 2026-09)
    period: string;
    // Сумма квитанции в рублях
    amount: number;
    // Флаг оплаты квитанции
    isPaid: boolean;
  } | null;
}
