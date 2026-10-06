import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Controller, Get, Query, Param, ParseIntPipe, NotFoundException, Res, Req, Logger, Post, Body, Delete, Put, BadRequestException } from '@nestjs/common';
import { EventPattern, Payload, MessagePattern } from '@nestjs/microservices';
import { AccountantService } from './accountant.service';
import { S3StorageService } from '../s3/s3-storage.service';

// Интерфейс входящего HTTP-запроса Express
interface CustomRequest extends IncomingMessage {
  body?: unknown;
}

// Интерфейс исходящего HTTP-ответа Express
interface CustomResponse extends ServerResponse {
  status(code: number): this;
  json(body: unknown): this;
  sendFile(filePath: string): void;
  redirect(url: string): void;
}

// Поиск сохраненного файла в локальной директории data/uploads
// Поддерживает как точный относительный путь (например payments/1/receipts/check.pdf),
// так и поиск только по имени файла (fallback)
function findUploadedFile(keyOrFilename: string): { fullPath: string; fileName: string; mimeType: string } | null {
  if (!keyOrFilename) return null;
  const uploadDir = path.resolve(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadDir)) return null;

  // 1. Проверяем точный относительный путь с защитой от выхода за пределы рабочей директории
  const normalizedKey = path.normalize(keyOrFilename).replace(/^(\.\.[\/\\])+/, '');
  const candidatePath = path.resolve(uploadDir, normalizedKey);
  if (candidatePath.startsWith(uploadDir) && fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
    const ext = path.extname(candidatePath).toLowerCase();
    const mime = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return { fullPath: candidatePath, fileName: path.basename(candidatePath), mimeType: mime };
  }

  // 2. Проверяем файл прямо в корне uploads
  const baseName = path.basename(keyOrFilename);
  const rootCandidate = path.resolve(uploadDir, baseName);
  if (rootCandidate.startsWith(uploadDir) && fs.existsSync(rootCandidate) && fs.statSync(rootCandidate).isFile()) {
    const ext = path.extname(rootCandidate).toLowerCase();
    const mime = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return { fullPath: rootCandidate, fileName: baseName, mimeType: mime };
  }

  // 3. Рекурсивный поиск по имени файла в поддиректориях uploads
  const searchRecursive = (dir: string): string | null => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = searchRecursive(full);
          if (found) return found;
        } else if (entry.name === baseName) {
          return full;
        }
      }
    } catch {
      // Игнорируем ошибки доступа к файлам
    }
    return null;
  };

  const recursiveFound = searchRecursive(uploadDir);
  if (recursiveFound && fs.existsSync(recursiveFound)) {
    const ext = path.extname(recursiveFound).toLowerCase();
    const mime = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return { fullPath: recursiveFound, fileName: baseName, mimeType: mime };
  }

  return null;
}

@Controller('accountant')
export class AccountantController {
  private readonly logger = new Logger(AccountantController.name);

  constructor(
    private readonly accountantService: AccountantService,
    private readonly s3Storage: S3StorageService
  ) {}

  @MessagePattern('upsert_apartment')
  async upsertApartment(@Payload() data: any) {
    this.logger.log(`Incoming request: upsert_apartment (${data.externalId})`);
    return this.accountantService.upsertApartment(data);
  }

  @MessagePattern('upsert_account')
  async upsertAccount(@Payload() data: any) {
    this.logger.log(`Incoming request: upsert_account (${data.externalId}) for apartment ${data.apartmentExternalId}`);
    return this.accountantService.upsertAccount(data);
  }

  @EventPattern('upsert_accrual')
  async upsertAccrual(@Payload() data: any) {
    this.logger.log(`Incoming event: upsert_accrual for account ${data.accountExternalId}, period ${data.periodId}`);
    return this.accountantService.upsertAccrual(data);
  }

  @EventPattern('upsert_invoice')
  async upsertInvoice(@Payload() data: any) {
    this.logger.log(`Incoming event: upsert_invoice for account ${data.accountExternalId}, period ${data.periodId}`);
    return this.accountantService.upsertInvoice(data);
  }

  @MessagePattern('create_payment')
  async createPayment(@Payload() data: any) {
    return this.accountantService.createPayment(data);
  }

  @MessagePattern('confirm_payment')
  async confirmPayment(@Payload() data: any) {
    return this.accountantService.confirmPayment(data.paymentId, data.confirmedBy);
  }

  @MessagePattern('reject_payment')
  async rejectPayment(@Payload() data: any) {
    return this.accountantService.rejectPayment(data.paymentId, data.confirmedBy, data.comment);
  }

  @MessagePattern('get_apartments')
  async getApartments(@Payload() query: any = {}) {
    return this.accountantService.findApartments(query);
  }

  @Get('apartments')
  async findApartments(@Query() query: any) {
    return this.accountantService.findApartments(query);
  }

  @Get('accounts')
  async findAccounts(@Query() query: any) {
    return this.accountantService.findAccounts(query);
  }

  @Get('accounts/:id')
  async findAccountById(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.findAccountById(id);
  }

  @Get('accruals')
  async findAccruals(@Query() query: any) {
    return this.accountantService.findAccruals(query);
  }

  @MessagePattern('get_accruals_paginated')
  async getAccrualsPaginated(@Payload() query: any = {}) {
    return this.accountantService.findAccrualsPaginated(query);
  }

  @Get('invoices')
  async findInvoices(@Query() query: any) {
    return this.accountantService.findInvoices(query);
  }

  @MessagePattern('get_invoices')
  async getInvoices(@Payload() query: any = {}) {
    return this.accountantService.findInvoices(query);
  }

  @MessagePattern('get_invoice')
  async getInvoice(@Payload() id: number) {
    return this.accountantService.findInvoiceById(id);
  }

  @Get('invoices/by-period')
  async getInvoiceByPeriod(@Query('accountExternalId') accountExternalId: string, @Query('period') period: string) {
    return this.accountantService.findInvoiceByPeriod(accountExternalId, period);
  }

  @Get('invoices/by-period/download')
  async downloadInvoiceByPeriod(
    @Query('accountExternalId') accountExternalId: string,
    @Query('period') period: string,
    @Res() res: any
  ) {
    const result = await this.accountantService.findInvoiceByPeriod(accountExternalId, period);
    if (result.downloadUrl) {
      return res.redirect(result.downloadUrl);
    }
    throw new NotFoundException(`Invoice PDF not available for download`);
  }

  @MessagePattern('get_apartment')
  async getApartment(@Payload() id: number) {
    return this.accountantService.findApartmentById(id);
  }

  @MessagePattern('get_tenant_by_apartment')
  async getTenantByApartment(@Payload() apartmentId: number) {
    return this.accountantService.findTenantByApartment(apartmentId);
  }

  @MessagePattern('get_all_users')
  async getAllUsers() {
    return this.accountantService.findAllUsers();
  }

  @MessagePattern('update_tenant_payment_settings')
  async updateTenantPaymentSettings(@Payload() data: { tenantId: number; rentPaymentDay?: number; rentAmount?: number }) {
    return this.accountantService.updateTenantPaymentSettings(data.tenantId, data.rentPaymentDay, data.rentAmount);
  }

  @MessagePattern('update_account_custom_label')
  async updateAccountCustomLabel(@Payload() data: { accountId: number; customLabel: string | null }) {
    return this.accountantService.updateAccount(data.accountId, { customLabel: data.customLabel });
  }

  @MessagePattern('create_active_tenant_manual')
  async createActiveTenantManual(@Payload() data: { name: string; apartmentId: number; rentPaymentDay: number; rentAmount: number }) {
    return this.accountantService.createActiveTenantManual(data);
  }

  @Get('apartments/:id')
  async findApartment(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.findApartmentById(id);
  }

  // Прием бинарного содержимого квитанции при локальном хранении
  @Put('invoices/upload-raw')
  async uploadInvoiceRaw(
    @Query('key') key: string,
    @Req() req: CustomRequest,
    @Res() res: CustomResponse
  ) {
    if (!key) {
      throw new BadRequestException('Параметр query "key" обязателен для загрузки квитанции');
    }
    // Защита от Path Traversal: извлекаем безопасное имя файла
    const cleanKey = path.basename(key);
    const uploadDir = path.join(process.cwd(), 'data', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    const fullPath = path.join(uploadDir, cleanKey);

    // Если body-parser уже считал тело в виде Buffer
    if (Buffer.isBuffer(req.body)) {
      fs.writeFileSync(fullPath, req.body);
      return res.status(200).json({ success: true, key: cleanKey });
    }

    // Иначе считываем бинарный поток данных из request stream
    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(fullPath);
      req.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err: unknown) => reject(err));
      req.on('error', (err: unknown) => reject(err));
    });

    return res.status(200).json({ success: true, key: cleanKey });
  }

  // Вспомогательный метод для безопасной отдачи бинарного файла по ключу или имени
  private serveFileByKey(key: string, res: CustomResponse) {
    const fileInfo = findUploadedFile(key);
    if (!fileInfo) {
      throw new NotFoundException(`Файл ${path.basename(key)} не найден на диске`);
    }

    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.fileName}"`);
    return res.sendFile(fileInfo.fullPath);
  }

  // Универсальный эндпоинт для скачивания файлов из локального хранилища по query параметру key
  @Get('storage/download')
  async downloadStorageFile(
    @Query('key') key: string,
    @Res() res: CustomResponse
  ) {
    if (!key) {
      throw new BadRequestException('Параметр query "key" обязателен для скачивания файла');
    }
    return this.serveFileByKey(key, res);
  }

  // Скачивание бинарного файла квитанции или чека при локальном хранении по пути
  @Get('invoices/download/*path')
  async downloadInvoiceRawWildcard(
    @Param('path') pathParam: string,
    @Res() res: CustomResponse
  ) {
    return this.serveFileByKey(pathParam, res);
  }

  @Get('invoices/download/:key')
  async downloadInvoiceRaw(
    @Param('key') key: string,
    @Res() res: CustomResponse
  ) {
    return this.serveFileByKey(key, res);
  }

  // Получение предподписанного S3 URL или локального URL для загрузки квитанции
  // Важно: статический роут 'invoices/upload-url' должен объявляться ДО параметризованного 'invoices/:id',
  // чтобы Express не пытался распарсить строку 'upload-url' как числовой идентификатор :id
  @Get('invoices/upload-url')
  async getUploadUrl(@Query('accountExternalId') accountExternalId: string, @Query('periodLabel') periodLabel: string) {
    const key = this.s3Storage.buildInvoiceKey(accountExternalId, periodLabel);
    const url = this.s3Storage.getSignedUploadUrl(key);
    return { url, key };
  }

  // Получение квитанции по ее числовому идентификатору
  @Get('invoices/:id')
  async findInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.findInvoiceById(id);
  }

  // Ручное создание квитанции бухгалтером
  @Post('invoices')
  async createManualInvoice(@Body() body: { accountId: number; period: string; amount: number; comment: string }) {
    return this.accountantService.createManualInvoice(body);
  }

  @Get('payments')
  async findPayments(@Query() query: { userId?: string; status?: string; userName?: string; accountId?: string; bankId?: string }) {
    const userId = query.userId ? parseInt(query.userId, 10) : undefined;
    const accountId = query.accountId ? parseInt(query.accountId, 10) : undefined;
    const bankId = query.bankId ? parseInt(query.bankId, 10) : undefined;
    return this.accountantService.findPayments({
      userId: isNaN(Number(userId)) ? undefined : userId,
      accountId: isNaN(Number(accountId)) ? undefined : accountId,
      bankId: isNaN(Number(bankId)) ? undefined : bankId,
      status: query.status,
      userName: query.userName,
    });
  }

  @Post('payments')
  async createPaymentHttp(@Body() body: {
    tenantId?: number;
    userId?: number;
    userName?: string;
    amount: number | string;
    receiptPhotoId?: string;
    comment?: string;
    createdAt?: string;
    status?: string;
    bankId?: number;
  }) {
    return this.accountantService.createPayment(body);
  }

  // Подтверждение платежа с опциональным указанием банка зачисления
  @Post('payments/confirm')
  async confirmPaymentHttp(@Body() body: { paymentId: number; confirmedBy: number; bankId?: number }) {
    return this.accountantService.confirmPayment(body.paymentId, body.confirmedBy, body.bankId);
  }

  @Post('payments/reject')
  async rejectPaymentHttp(@Body() body: { paymentId: number; confirmedBy: number; comment?: string }) {
    return this.accountantService.rejectPayment(body.paymentId, body.confirmedBy, body.comment);
  }

  @Get('notifications')
  async findNotifications(@Query() query: { accountId?: string; status?: string }) {
    const accountId = query.accountId ? parseInt(query.accountId, 10) : undefined;
    const meterEvents = await this.accountantService.findMeterSubmissionEvents({
      accountId: isNaN(Number(accountId)) ? undefined : accountId,
      status: query.status,
    });
    const systemEvents = await this.accountantService.findSystemEvents({
      status: query.status,
    });
    return {
      meterEvents,
      systemEvents,
    };
  }

  @Get('stats')
  async getStatsHttp() {
    return this.accountantService.getStats();
  }

  @Delete('apartments/:id')
  async deleteApartment(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.deleteApartment(id);
  }

  @Delete('accounts/:id')
  async deleteAccount(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.deleteAccount(id);
  }

  @Put('accounts/:id')
  async updateAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { customLabel?: string | null; meterSubmissionDay?: number | null }
  ) {
    return this.accountantService.updateAccount(id, data);
  }

  @Delete('invoices/:id')
  async deleteInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.deleteInvoice(id);
  }

  @Post('invoices/bulk-delete')
  async bulkDeleteInvoices(@Body() dto: { ids: number[] }) {
    if (!dto.ids || !Array.isArray(dto.ids)) {
      throw new Error('Invalid ids array');
    }
    return this.accountantService.bulkDeleteInvoices(dto.ids);
  }

  @Delete('payments/:id')
  async deletePayment(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.deletePayment(id);
  }

  // Получение подписанной ссылки на просмотр или скачивание чека по его ключу S3
  @Get('payments/receipt/signed-url')
  async getReceiptSignedUrl(@Query('key') key: string) {
    if (!key) throw new BadRequestException('Параметр key обязателен');
    const downloadUrl = this.s3Storage.getSignedDownloadUrl(key);
    return { downloadUrl, key };
  }

  // Получение детальной информации о конкретном платеже по ID
  @Get('payments/:id')
  async findPaymentById(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.findPaymentById(id);
  }

  // Обновление существующего платежа
  @Put('payments/:id')
  async updatePaymentHttp(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      amount?: number | string;
      comment?: string | null;
      bankId?: number | null;
      status?: string;
      confirmedAt?: string | Date | null;
      createdAt?: string | Date;
      receiptPhotoId?: string | null;
    }
  ) {
    return this.accountantService.updatePayment(id, body);
  }

  // Прикрепление или замена чека (файла, Base64, Telegram file_id, ссылки) к платежу
  @Post('payments/:id/receipt')
  async attachPaymentReceiptHttp(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      fileBufferBase64?: string;
      dataUri?: string;
      fileName?: string;
      mimeType?: string;
      telegramFileId?: string;
      receiptUrl?: string;
    }
  ) {
    return this.accountantService.attachReceipt(id, body);
  }

  // Удаление прикрепленного чека у платежа
  @Delete('payments/:id/receipt')
  async detachPaymentReceiptHttp(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.detachReceipt(id);
  }

  // Получение прямой ссылки на скачивание/просмотр чека с поддержкой редиректа и прямого скачивания
  @Get('payments/:id/receipt')
  async getPaymentReceiptHttp(
    @Param('id', ParseIntPipe) id: number,
    @Query('redirect') redirectQuery: string,
    @Query('download') downloadQuery: string,
    @Req() req: CustomRequest,
    @Res() res: CustomResponse
  ) {
    const result = await this.accountantService.getPaymentReceiptDownloadUrl(id);
    const wantsRedirect = redirectQuery === 'true' || redirectQuery === '1' || req.headers?.accept?.includes('text/html');
    const wantsDownload = downloadQuery === 'true' || downloadQuery === '1';

    // Если запрошено прямое скачивание локального файла
    if (wantsDownload && result.receiptPhotoId && !result.receiptPhotoId.startsWith('http')) {
      const fileInfo = findUploadedFile(result.receiptPhotoId);
      if (fileInfo) {
        res.setHeader('Content-Type', fileInfo.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${fileInfo.fileName}"`);
        return res.sendFile(fileInfo.fullPath);
      }
    }

    // Если запрошен 302-редирект на готовую ссылку скачивания
    if (wantsRedirect && result.downloadUrl) {
      return res.redirect(result.downloadUrl);
    }

    return res.status(200).json(result);
  }

  // Обработчик события из RabbitMQ для прикрепления чека
  @MessagePattern('attach_payment_receipt')
  async attachPaymentReceiptMsg(@Payload() data: {
    paymentId: number;
    fileBufferBase64?: string;
    dataUri?: string;
    fileName?: string;
    mimeType?: string;
    telegramFileId?: string;
    receiptUrl?: string;
  }) {
    return this.accountantService.attachReceipt(data.paymentId, data);
  }

  @Get('banks')
  async findBanks() {
    return this.accountantService.findBanks();
  }

  @Get('banks/:id')
  async findBankById(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.findBankById(id);
  }

  @Post('banks')
  async createBank(@Body() body: { name: string }) {
    return this.accountantService.createBank(body.name);
  }

  @Put('banks/:id')
  async updateBank(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }) {
    return this.accountantService.updateBank(id, body.name);
  }

  @Delete('banks/:id')
  async deleteBank(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.deleteBank(id);
  }

  @Get('banks/:id/payments')
  async findBankPayments(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.findPaymentsByBank(id);
  }

  @Delete('notifications/:id')
  async deleteNotification(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.deleteMeterSubmissionEvent(id);
  }

  @Get('tenants')
  async getTenants(@Query('includeDeleted') includeDeleted?: string) {
    return this.accountantService.findTenants(includeDeleted === 'true');
  }

  @Post('tenants')
  async createTenant(@Body() body: { name: string; apartmentId?: number; rentPaymentDay?: number; rentAmount?: number; rentStartDate?: string | Date | null }) {
    return this.accountantService.createTenant(body);
  }

  @Put('tenants/:id')
  async updateTenant(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; apartmentId?: number | null; rentPaymentDay?: number | null; rentAmount?: number | null; status?: string; rentStartDate?: string | Date | null }) {
    return this.accountantService.updateTenant(id, body);
  }

  @Delete('tenants/:id')
  async deleteTenant(@Param('id', ParseIntPipe) id: number, @Query('force') force?: string) {
    if (force === 'true') {
      return this.accountantService.forceDeleteTenant(id);
    }
    return this.accountantService.deleteTenant(id);
  }

  @Get('tenants/:id')
  async getTenantById(@Param('id', ParseIntPipe) id: number) {
    return this.accountantService.findTenantById(id);
  }

  @MessagePattern('get_all_tenants')
  async getAllTenantsMsg() {
    return this.accountantService.findTenants();
  }
}

