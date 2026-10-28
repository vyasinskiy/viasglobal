import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Опции для конфигурации подключения к IMAP серверу
 */
export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Результат обработки и сохранения одного письма
 */
export interface SyncedEmailResult {
  messageId: string;
  subject: string;
  fromEmail: string;
  fromName?: string;
  distributorId?: number;
  distributorName?: string;
  matchedContactName?: string;
  isNew: boolean;
  hasAttachments: boolean;
  savedAttachments: string[];
}

/**
 * Сервис синхронизации почтового ящика (Hostinger) и сопоставления с дистрибьюторами
 */
@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Получает конфигурацию IMAP из переменных окружения
   */
  getImapConfig(): ImapConfig {
    const host = process.env.IMAP_HOST || 'imap.hostinger.com';
    const port = Number(process.env.IMAP_PORT) || 993;
    const secure = process.env.IMAP_SECURE !== 'false';
    const user = process.env.IMAP_USER;
    const pass = process.env.IMAP_PASSWORD;

    if (!user || !pass) {
      throw new Error(
        'Отсутствуют учетные данные IMAP. Пожалуйста, укажите IMAP_USER и IMAP_PASSWORD в файле ecommerce/backend/.env'
      );
    }

    return {
      host,
      port,
      secure,
      auth: { user, pass },
    };
  }

  /**
   * Извлекает чистый домен из email или URL сайта для умного сопоставления
   */
  extractDomain(input?: string | null): string | null {
    if (!input) return null;
    let clean = input.trim().toLowerCase();

    // Если передан email (например: guido@alfadyser.es)
    if (clean.includes('@')) {
      const parts = clean.split('@');
      clean = parts[parts.length - 1];
    }

    // Если передан URL (например: https://alfadyser.es/es/)
    clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '');
    clean = clean.split('/')[0];
    clean = clean.split(':')[0];

    return clean || null;
  }

  /**
   * Находит дистрибьютора по адресу отправителя, менеджеру или домену
   */
  async matchDistributor(fromEmail: string, fromName?: string) {
    const normalizedEmail = fromEmail.trim().toLowerCase();
    const domain = this.extractDomain(normalizedEmail);

    // 1. Поиск по прямому совпадению email у дистрибьютора
    const distByEmail = await this.prisma.distributor.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
      },
    });
    if (distByEmail) {
      return { distributor: distByEmail, matchedBy: 'distributor_email' as const };
    }

    // 2. Поиск по email в контактах менеджеров (DistributorContact)
    const contact = await this.prisma.distributorContact.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
      },
      include: { distributor: true },
    });
    if (contact && contact.distributor) {
      return {
        distributor: contact.distributor,
        contact,
        matchedBy: 'contact_email' as const,
      };
    }

    // 3. Поиск по домену в поле domains у дистрибьютора
    if (domain) {
      const distByDomain = await this.prisma.distributor.findFirst({
        where: {
          domains: { has: domain },
        },
      });
      if (distByDomain) {
        return { distributor: distByDomain, matchedBy: 'domain_list' as const };
      }

      // 4. Поиск по домену в поле website у дистрибьютора
      const distByWebsite = await this.prisma.distributor.findFirst({
        where: {
          website: { contains: domain, mode: 'insensitive' },
        },
      });
      if (distByWebsite) {
        return { distributor: distByWebsite, matchedBy: 'website_domain' as const };
      }
    }

    return null;
  }

  /**
   * Обрабатывает распарсенное письмо ParsedMail и сохраняет его в базу данных
   */
  async processAndSaveMail(parsed: ParsedMail, folder = 'INBOX'): Promise<SyncedEmailResult> {
    const fromAddressObj = parsed.from?.value?.[0];
    const fromEmail = (fromAddressObj?.address || '').trim().toLowerCase();
    const fromName = fromAddressObj?.name || parsed.from?.text || '';
    const subject = parsed.subject || '(Без темы)';
    const messageId = parsed.messageId || `${Date.now()}-${Math.random().toString(36).substring(7)}@local`;
    const date = parsed.date || new Date();
    const bodyText = parsed.text || '';
    const bodyHtml = typeof parsed.html === 'string' ? parsed.html : undefined;
    const snippet = bodyText.substring(0, 300).replace(/\s+/g, ' ').trim();

    // Извлекаем адреса получателей
    const toEmails: string[] = [];
    if (Array.isArray(parsed.to)) {
      for (const t of parsed.to) {
        for (const addr of t.value) {
          if (addr.address) toEmails.push(addr.address.toLowerCase());
        }
      }
    } else if (parsed.to && parsed.to.value) {
      for (const addr of parsed.to.value) {
        if (addr.address) toEmails.push(addr.address.toLowerCase());
      }
    }

    // 1. Ищем сопоставленного дистрибьютора
    const match = await this.matchDistributor(fromEmail, fromName);
    const distributor = match?.distributor;

    // 2. Если дистрибьютор найден, но контакта менеджера еще нет в базе — создаем его
    let matchedContactName = match?.contact?.name || undefined;
    if (distributor && !match?.contact && fromEmail) {
      try {
        const newContact = await this.prisma.distributorContact.create({
          data: {
            distributorId: distributor.id,
            name: fromName || fromEmail.split('@')[0],
            email: fromEmail,
            role: 'Менеджер / Корреспондент',
            isPrimary: false,
          },
        });
        matchedContactName = newContact.name || undefined;
        this.logger.log(
          `Создан новый контакт менеджера: ${matchedContactName} (${fromEmail}) для дистрибьютора ${distributor.name}`
        );
      } catch {
        // Контакт мог быть создан параллельно, игнорируем ошибку уникальности
      }
    }

    // 3. Обработка вложений
    const attachmentsMeta: Array<{
      filename: string;
      contentType: string;
      size: number;
      localPath?: string;
    }> = [];
    const savedAttachments: string[] = [];

    if (parsed.attachments && parsed.attachments.length > 0) {
      for (const att of parsed.attachments) {
        const filename = att.filename || `attachment_${Date.now()}`;
        const meta: {
          filename: string;
          contentType: string;
          size: number;
          localPath?: string;
        } = {
          filename,
          contentType: att.contentType,
          size: att.size,
        };

        // Если это файл прайс-листа или каталога (Excel/PDF) и дистрибьютор известен
        if (distributor && /\.(xlsx|xls|pdf|csv)$/i.test(filename)) {
          const safeDistName = distributor.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const targetDir = path.resolve(__dirname, `../../../../contractors/${safeDistName}/attachments`);

          try {
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            const targetFilePath = path.join(targetDir, filename);
            fs.writeFileSync(targetFilePath, att.content);
            meta.localPath = targetFilePath;
            savedAttachments.push(targetFilePath);
            this.logger.log(`Сохранено вложение: ${targetFilePath}`);
          } catch (err) {
            this.logger.error(`Ошибка при сохранении вложения ${filename}:`, err);
          }
        }

        attachmentsMeta.push(meta);
      }
    }

    // 4. Сохраняем или обновляем запись письма в БД (идемпотентно по messageId)
    const existing = await this.prisma.distributorEmail.findUnique({
      where: { messageId },
    });

    if (existing) {
      await this.prisma.distributorEmail.update({
        where: { messageId },
        data: {
          distributorId: distributor?.id,
          folder,
          bodyText,
          bodyHtml,
          snippet,
          hasAttachments: attachmentsMeta.length > 0,
          attachments: attachmentsMeta.length > 0 ? (attachmentsMeta as any) : undefined,
        },
      });

      return {
        messageId,
        subject,
        fromEmail,
        fromName,
        distributorId: distributor?.id,
        distributorName: distributor?.name,
        matchedContactName,
        isNew: false,
        hasAttachments: attachmentsMeta.length > 0,
        savedAttachments,
      };
    }

    await this.prisma.distributorEmail.create({
      data: {
        messageId,
        distributorId: distributor?.id,
        folder,
        fromEmail,
        fromName,
        toEmails,
        subject,
        date,
        bodyText,
        bodyHtml,
        snippet,
        hasAttachments: attachmentsMeta.length > 0,
        attachments: attachmentsMeta.length > 0 ? (attachmentsMeta as any) : undefined,
      },
    });

    // Обновляем дату последнего контакта у дистрибьютора
    if (distributor) {
      await this.prisma.distributor.update({
        where: { id: distributor.id },
        data: { lastContactAt: date },
      });
    }

    return {
      messageId,
      subject,
      fromEmail,
      fromName,
      distributorId: distributor?.id,
      distributorName: distributor?.name,
      matchedContactName,
      isNew: true,
      hasAttachments: attachmentsMeta.length > 0,
      savedAttachments,
    };
  }

  /**
   * Подключается к IMAP серверу Hostinger и выполняет инкрементальную синхронизацию
   * @param limit Максимальное количество последних писем для проверки (по умолчанию 30)
   */
  async syncInbox(limit = 30): Promise<SyncedEmailResult[]> {
    const config = this.getImapConfig();
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      logger: false,
    });

    const results: SyncedEmailResult[] = [];

    try {
      this.logger.log(`Подключение к IMAP серверу ${config.host}:${config.port} (${config.auth.user})...`);
      await client.connect();

      const lock = await client.getMailboxLock('INBOX');
      try {
        const status = await client.status('INBOX', { messages: true, unseen: true });
        if (!status || typeof status.messages !== 'number') {
          this.logger.warn('Не удалось получить статус ящика INBOX');
          return results;
        }
        this.logger.log(`В ящике INBOX сообщений: ${status.messages}, непрочитанных: ${status.unseen ?? 0}`);

        if (status.messages === 0) {
          return results;
        }

        // Запрашиваем диапазон последних N писем
        const startSeq = Math.max(1, status.messages - limit + 1);
        const range = `${startSeq}:${status.messages}`;
        this.logger.log(`Загрузка писем в диапазоне номеров: ${range}...`);

        for await (const message of client.fetch(range, {
          uid: true,
          envelope: true,
          source: true,
          bodyStructure: true,
        })) {
          try {
            if (!message.source) continue;
            // Парсим поток письма через mailparser
            const parsed = await simpleParser(message.source);
            const res = await this.processAndSaveMail(parsed, 'INBOX');
            results.push(res);
          } catch (msgErr) {
            this.logger.error(`Ошибка при парсинге письма UID ${message.uid}:`, msgErr);
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();
      this.logger.log(`Синхронизация завершена. Обработано писем: ${results.length}`);
      return results;
    } catch (err: any) {
      this.logger.error('Сбой при синхронизации IMAP:', err);
      throw err;
    }
  }

  /**
   * Поиск по сохраненным письмам в базе данных
   */
  async searchEmails(params: {
    distributorNameOrId?: string | number;
    query?: string;
    limit?: number;
  }) {
    let distributorId: number | undefined;

    if (params.distributorNameOrId) {
      if (typeof params.distributorNameOrId === 'number') {
        distributorId = params.distributorNameOrId;
      } else {
        const found = await this.prisma.distributor.findFirst({
          where: {
            name: { contains: params.distributorNameOrId, mode: 'insensitive' },
          },
        });
        if (found) {
          distributorId = found.id;
        }
      }
    }

    const whereClause: any = {};
    if (distributorId) {
      whereClause.distributorId = distributorId;
    }

    if (params.query) {
      whereClause.OR = [
        { subject: { contains: params.query, mode: 'insensitive' } },
        { bodyText: { contains: params.query, mode: 'insensitive' } },
        { fromEmail: { contains: params.query, mode: 'insensitive' } },
        { fromName: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.distributorEmail.findMany({
      where: whereClause,
      include: {
        distributor: {
          select: {
            id: true,
            name: true,
            email: true,
            website: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: params.limit || 20,
    });
  }
}
