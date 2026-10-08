import fs from 'node:fs';
import path from 'node:path';
import { Injectable, ConflictException } from '@nestjs/common';

/**
 * Преобразует произвольную строку в безопасный slug без спецсимволов.
 */
function slug(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

/**
 * Получает базовый URL API для конструирования публичных или внутренних ссылок.
 */
function getApiBaseUrl(): string {
  return process.env.API_BASE_URL || 'http://accruals-accountant:3005';
}

/**
 * Сервис локального файлового хранилища (Local Storage).
 * Обеспечивает сохранение, валидацию и выдачу PDF квитанций, чеков и вложений на диске сервера.
 */
@Injectable()
export class StorageService {
  private readonly uploadDir = path.resolve(process.cwd(), 'data', 'uploads');

  constructor() {
    // Гарантируем существование корневой директории для загрузок
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Возвращает абсолютный безопасный путь к файлу на диске.
   * Защищает от Path Traversal атак.
   */
  resolveSafePath(key: string): string {
    const cleanKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
    const resolvedPath = path.resolve(this.uploadDir, cleanKey);
    if (!resolvedPath.startsWith(this.uploadDir)) {
      throw new Error(`Недопустимый путь к файлу: ${key}`);
    }
    return resolvedPath;
  }

  /**
   * Проверяет статус загрузки (для обратной совместимости с логикой инвойсов).
   */
  isUploaded(uploaded: boolean): boolean {
    return Boolean(uploaded);
  }

  /**
   * Формирует ключ файла квитанции ЖКХ для лицевого счета и периода.
   */
  buildInvoiceKey(accountId: string, periodId: string): string {
    return `${slug(accountId)}-${slug(periodId)}.pdf`;
  }

  /**
   * Формирует уникальный ключ для вложений запланированных событий.
   */
  buildAttachmentKey(eventId: number, fileName: string): string {
    const timestamp = Date.now();
    const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '.jpg';
    const baseName = slug(fileName.replace(/\.[^/.]+$/, '')) || 'document';
    return `events/${eventId}/attachments/${timestamp}-${baseName}${extension}`;
  }

  /**
   * Формирует уникальный ключ для чека платежа с отметкой времени.
   */
  buildReceiptKey(paymentId: number, fileName = 'receipt.jpg'): string {
    const timestamp = Date.now();
    const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '.jpg';
    const baseName = slug(fileName.replace(/\.[^/.]+$/, '')) || 'receipt';
    return `payments/${paymentId}/receipts/${timestamp}-${baseName}${extension}`;
  }

  /**
   * Формирует ссылку для скачивания файла через эндпоинт storage/download.
   */
  getDownloadUrl(key: string): string {
    return `${getApiBaseUrl()}/accountant/storage/download?key=${encodeURIComponent(key)}`;
  }

  /**
   * Для обратной совместимости с вызовами getSignedDownloadUrl.
   */
  getSignedDownloadUrl(key: string): string {
    return this.getDownloadUrl(key);
  }

  /**
   * Формирует URL для загрузки файла квитанции через эндпоинт upload-raw.
   */
  getUploadUrl(key: string): string {
    return `${getApiBaseUrl()}/accountant/invoices/upload-raw?key=${encodeURIComponent(key)}`;
  }

  /**
   * Для обратной совместимости с вызовами getSignedUploadUrl.
   */
  getSignedUploadUrl(key: string): string {
    return this.getUploadUrl(key);
  }

  /**
   * Проверяет физическое существование файла на диске по ключу.
   */
  fileExists(key: string): boolean {
    try {
      const fullPath = this.resolveSafePath(key);
      return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Надежно сохраняет буфер файла на локальный диск с проверкой перезаписи.
   */
  async uploadBuffer(
    key: string,
    buffer: Buffer,
    _contentType = 'application/octet-stream',
    allowOverwrite = false
  ): Promise<string> {
    const fullPath = this.resolveSafePath(key);

    // Защита от случайного затирания существующих файлов
    if (!allowOverwrite && fs.existsSync(fullPath)) {
      throw new ConflictException(`Файл "${key}" уже существует в хранилище. Перезапись запрещена.`);
    }

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    return key;
  }

  /**
   * Удаляет файл из локального хранилища, если он существует.
   */
  async deleteObject(key: string): Promise<void> {
    try {
      const fullPath = this.resolveSafePath(key);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch {
      // Игнорируем ошибки при удалении
    }
  }
}
