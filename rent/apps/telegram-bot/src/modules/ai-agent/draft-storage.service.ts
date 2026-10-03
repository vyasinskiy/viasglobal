import { Injectable, Logger } from '@nestjs/common';
import { ParsedPaymentDraft } from './types';

/**
 * Хранилище черновиков платежей в оперативной памяти с автоматическим TTL
 */
@Injectable()
export class DraftStorageService {
  private readonly logger = new Logger(DraftStorageService.name);
  // Карта черновиков: draftId -> ParsedPaymentDraft
  private readonly drafts = new Map<string, ParsedPaymentDraft>();
  // Время жизни черновика: 24 часа (в миллисекундах)
  private readonly ttlMs = 24 * 60 * 60 * 1000;

  constructor() {
    // Периодическая очистка устаревших черновиков каждые 30 минут
    setInterval(() => this.cleanupExpiredDrafts(), 30 * 60 * 1000);
  }

  /**
   * Сохранить подготовленный черновик платежа
   */
  saveDraft(draft: ParsedPaymentDraft): void {
    this.drafts.set(draft.id, draft);
    this.logger.debug(`Черновик платежа ${draft.id} успешно сохранен. Всего в памяти: ${this.drafts.size}`);
  }

  /**
   * Получить черновик платежа по его уникальному идентификатору
   */
  getDraft(id: string): ParsedPaymentDraft | undefined {
    return this.drafts.get(id);
  }

  /**
   * Удалить черновик платежа после подтверждения или отмены
   */
  deleteDraft(id: string): void {
    this.drafts.delete(id);
    this.logger.debug(`Черновик платежа ${id} удален из памяти.`);
  }

  /**
   * Фоновая очистка устаревших записей
   */
  private cleanupExpiredDrafts(): void {
    const now = Date.now();
    let removedCount = 0;
    for (const [id, draft] of this.drafts.entries()) {
      if (now - draft.createdAt > this.ttlMs) {
        this.drafts.delete(id);
        removedCount++;
      }
    }
    if (removedCount > 0) {
      this.logger.log(`Очищено устаревших черновиков платежей: ${removedCount}`);
    }
  }
}
