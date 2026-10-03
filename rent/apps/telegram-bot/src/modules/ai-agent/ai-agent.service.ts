import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { config } from '../../common/config/config';
import { DatabaseTenantContext, ParsedPaymentDraft } from './types';
import { DraftStorageService } from './draft-storage.service';

/**
 * Интерфейс арендатора из ответа микросервиса Accountant
 */
interface AccountantTenantItem {
  id: number;
  userId: number;
  apartmentId?: number | null;
  rentPaymentDay?: number | null;
  rentAmount?: number | string | null;
  status: string;
  user?: {
    id: number;
    name?: string | null;
  } | null;
  apartment?: {
    id: number;
    externalId: string;
    address?: string | null;
  } | null;
}

/**
 * Интерфейс квитанции из ответа микросервиса Accountant
 */
interface AccountantInvoiceItem {
  id: number;
  accountId: number;
  periodId: string;
  periodLabel: string;
  amount?: number | string | null;
  available: boolean;
  account?: {
    apartmentId: number;
  } | null;
}

/**
 * Шаблон системного промпта для DeepSeek-V3
 */
const SYSTEM_PROMPT_TEMPLATE = `# РОЛЬ И ЗАДАЧА
Ты — специализированный финансовый AI-ассистент системы учета аренды недвижимости и коммунальных услуг.
Твоя задача — проанализировать входящее сообщение от владельца недвижимости (расшифрованное голосовое сообщение, текстовый комментарий или данные чека), сопоставить его с актуальным справочником базы данных и сформировать строго структурированное предложение для внесения платежа в систему.

---

# ТЕКУЩИЙ КОНТЕКСТ СИСТЕМЫ
Текущая дата и время: {{CURRENT_DATETIME}}

## Актуальная база данных арендаторов и квартир:
{{DATABASE_CONTEXT}}

---

# ПРАВИЛА И АЛГОРИТМ ОБРАБОТКИ

1. **Идентификация арендатора и квартиры**:
   - Сопоставляй разговорные упоминания («Паша», «Павел», «с Ленина», «с однушки», «кв 12») с реальными записями в базе данных.
   - Если арендатор определен однозначно, укажи его tenantId.
   - Если есть сомнения или несколько похожих жильцов, выставь status: "needs_clarification" и укажи список кандидатов в clarificationCandidates.

2. **Распознавание сумм**:
   - Понимай любые формы записи чисел: «35 тысяч», «35к», «35000», «сорокет» (40 000), «сорок две с половиной тысячи» (42 500).
   - Сумма всегда должна быть числом с плавающей точкой (например: 35000.00).

3. **Определение банка зачисления**:
   - «Сбер», «Сбербанк», «зеленый» -> "Сбербанк"
   - «Т-Банк», «Тинькофф», «Тинькоф», «Т-банк» -> "Т-Банк"
   - «Альфа», «Альфа-Банк» -> "Альфа-Банк"
   - «ВТБ» -> "ВТБ"
   - Если банк не упомянут -> "Не указан"

4. **Разделение типов платежа (paymentType)**:
   - RENT: оплата аренды (сумма совпадает или близка к rentAmount, либо сказано: «за аренду», «за квартиру»).
   - UTILITIES: оплата коммуналки/ЖКУ (сумма совпадает с выставленной квитанцией latestInvoice.amount, либо сказано: «за коммуналку», «по квитанции», «за свет/воду»).
   - COMBINED: общий платеж. Если арендатор внес сумму, покрывающую и аренду, и коммуналку, раздели их в массиве subPayments.
   - DEPOSIT: залог/депозит.
   - OTHER: прочие расходы/компенсации.

5. **Определение даты платежа**:
   - «сегодня», «только что», «щас» -> текущая дата в формате YYYY-MM-DD.
   - «вчера» -> предыдущий день.
   - конкретные даты («2 числа», «в прошлую пятницу», «28 сентября») -> конкретная вычисленная дата YYYY-MM-DD.

6. **Обоснование и комментарий**:
   - Сформируй краткий понятный комментарий для БД (например: [Сбербанк | Банкомат] Аренда за октябрь 2026).

---

# ФОРМАТ ВЫХОДНЫХ ДАННЫХ
Ты ДОЛЖЕН вернуть ТОЛЬКО валидный JSON без вступительного текста, без markdown-разметки (без \`\`\`json ... \`\`\`), строго соответствующий следующей схеме:

{
  "status": "ready" | "needs_clarification",
  "confidence": number,
  "tenantId": number | null,
  "tenantName": string | null,
  "apartmentAddress": string | null,
  "totalAmount": number,
  "bank": string,
  "paymentDate": "YYYY-MM-DD",
  "paymentType": "RENT" | "UTILITIES" | "COMBINED" | "DEPOSIT" | "OTHER",
  "comment": string,
  "summaryText": string,
  "subPayments": [
    {
      "type": "RENT" | "UTILITIES",
      "amount": number,
      "description": string
    }
  ],
  "clarificationQuestion": string | null,
  "clarificationCandidates": [
    { "tenantId": number, "name": string, "apartment": string }
  ]
}`;

/**
 * Основной сервис финансового AI-ассистента (интеграция с DeepSeek-V3)
 */
@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private deepseekClient: OpenAI | null = null;

  constructor(
    @Inject('ACCOUNTANT_SERVICE') private readonly accountantClient: ClientProxy,
    private readonly draftStorage: DraftStorageService,
  ) {
    // Инициализация OpenAI-совместимого клиента для DeepSeek
    if (config.DEEPSEEK_API_KEY) {
      this.deepseekClient = new OpenAI({
        apiKey: config.DEEPSEEK_API_KEY,
        baseURL: config.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      });
      this.logger.log('DeepSeek-V3 AI клиент успешно инициализирован.');
    } else {
      this.logger.warn('DEEPSEEK_API_KEY не указан в конфигурации. Интеллектуальный разбор текста будет недоступен.');
    }
  }

  /**
   * Проверка готовности AI-модели
   */
  isConfigured(): boolean {
    return Boolean(this.deepseekClient);
  }

  /**
   * Загружает актуальный срез жильцов и квитанций из микросервиса Accountant
   */
  async fetchDatabaseContext(): Promise<DatabaseTenantContext[]> {
    try {
      this.logger.debug('Запрос справочника арендаторов из микросервиса Accountant...');
      const tenantsRaw: AccountantTenantItem[] = await firstValueFrom(
        this.accountantClient.send('get_all_tenants', {}),
      );

      // Запрашиваем последние квитанции для сопоставления ЖКУ
      let invoicesRaw: AccountantInvoiceItem[] = [];
      try {
        invoicesRaw = await firstValueFrom(
          this.accountantClient.send('get_invoices', { take: 50 }),
        );
      } catch (err) {
        this.logger.warn(`Не удалось загрузить квитанции ЖКУ для контекста: ${String(err)}`);
      }

      // Формируем чистый нормализованный срез
      const context: DatabaseTenantContext[] = tenantsRaw
        .filter((t) => t.status === 'active')
        .map((tenant) => {
          // Ищем последнюю квитанцию по квартире жильца
          const matchedInvoice = invoicesRaw.find(
            (inv) => inv.account?.apartmentId === tenant.apartmentId,
          );

          return {
            tenantId: tenant.id,
            name: tenant.user?.name || `Жилец #${tenant.id}`,
            apartmentId: tenant.apartmentId || 0,
            apartmentAddress: tenant.apartment?.address || tenant.apartment?.externalId || 'Адрес не указан',
            rentAmount: tenant.rentAmount ? Number(tenant.rentAmount) : 0,
            rentPaymentDay: tenant.rentPaymentDay || 1,
            latestInvoice: matchedInvoice
              ? {
                  period: matchedInvoice.periodLabel || matchedInvoice.periodId,
                  amount: Number(matchedInvoice.amount || 0),
                  isPaid: Boolean(matchedInvoice.available),
                }
              : null,
          };
        });

      return context;
    } catch (error) {
      this.logger.error(`Ошибка при получении контекста БД из Accountant: ${String(error)}`);
      return [];
    }
  }

  /**
   * Анализирует текст сообщения от владельца недвижимости и формирует проект платежа
   * @param inputText Расшифрованный текст голосового сообщения или текстовый комментарий
   * @param photoFileId Идентификатор фотографии чека в Telegram (при наличии)
   */
  async parsePaymentMessage(inputText: string, photoFileId?: string): Promise<ParsedPaymentDraft> {
    if (!this.deepseekClient) {
      throw new Error(
        'AI модуль не настроен. Пожалуйста, укажите DEEPSEEK_API_KEY в переменных окружения (.env).',
      );
    }

    // 1. Загружаем актуальные данные арендаторов
    const dbContext = await this.fetchDatabaseContext();

    // 2. Формируем текущие дату и время
    const currentDateTime = new Date().toLocaleString('ru-RU', {
      timeZone: config.TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // 3. Собираем системный промпт
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE
      .replace('{{CURRENT_DATETIME}}', currentDateTime)
      .replace('{{DATABASE_CONTEXT}}', JSON.stringify(dbContext, null, 2));

    this.logger.debug(`Отправка запроса в DeepSeek-V3 для текста: "${inputText}"`);

    // 4. Вызываем модель DeepSeek-V3 в строгом JSON-режиме
    const completion = await this.deepseekClient.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: inputText },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Пустой ответ от языковой модели DeepSeek.');
    }

    // 5. Парсим структурированный ответ
    const parsedData: Omit<ParsedPaymentDraft, 'id' | 'createdAt' | 'rawText' | 'photoFileId'> = JSON.parse(
      responseContent,
    );

    // 6. Создаем и сохраняем черновик
    const draft: ParsedPaymentDraft = {
      ...parsedData,
      id: randomUUID(),
      rawText: inputText,
      photoFileId,
      createdAt: Date.now(),
    };

    this.draftStorage.saveDraft(draft);
    return draft;
  }
}
