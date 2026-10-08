import fs from 'node:fs';
import path from 'node:path';
import { ConflictException } from '@nestjs/common';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  const testDir = path.resolve(process.cwd(), 'data', 'uploads');
  const testKey = 'test-unit-file.pdf';
  const testBuffer = Buffer.from('PDF_TEST_CONTENT');

  beforeEach(() => {
    service = new StorageService();
    // Очищаем тестовый файл, если остался
    const safePath = path.resolve(testDir, testKey);
    if (fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
    }
  });

  afterEach(() => {
    const safePath = path.resolve(testDir, testKey);
    if (fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
    }
  });

  it('должен формировать корректные ключи для инвойсов и чеков', () => {
    const invoiceKey = service.buildInvoiceKey('acc 123', '2026/05');
    expect(invoiceKey).toBe('acc-123-2026-05.pdf');

    const receiptKey = service.buildReceiptKey(42, 'photo.png');
    expect(receiptKey).toMatch(/^payments\/42\/receipts\/\d+-photo\.png$/);
  });

  it('должен формировать локальные URL для скачивания и загрузки', () => {
    const downloadUrl = service.getDownloadUrl('invoice.pdf');
    expect(downloadUrl).toContain('/accountant/storage/download?key=invoice.pdf');

    const uploadUrl = service.getUploadUrl('invoice.pdf');
    expect(uploadUrl).toContain('/accountant/invoices/upload-raw?key=invoice.pdf');
  });

  it('должен успешно сохранять файл и определять его существование', async () => {
    expect(service.fileExists(testKey)).toBe(false);

    await service.uploadBuffer(testKey, testBuffer);
    expect(service.fileExists(testKey)).toBe(true);

    const content = fs.readFileSync(path.resolve(testDir, testKey));
    expect(content.toString()).toBe('PDF_TEST_CONTENT');
  });

  it('должен запрещать перезапись существующего файла без allowOverwrite', async () => {
    await service.uploadBuffer(testKey, testBuffer);

    await expect(service.uploadBuffer(testKey, testBuffer, undefined, false)).rejects.toThrow(
      ConflictException
    );
  });

  it('должен разрешать перезапись, если передан allowOverwrite = true', async () => {
    await service.uploadBuffer(testKey, testBuffer);
    const updatedBuffer = Buffer.from('NEW_CONTENT');
    await service.uploadBuffer(testKey, updatedBuffer, undefined, true);

    const content = fs.readFileSync(path.resolve(testDir, testKey));
    expect(content.toString()).toBe('NEW_CONTENT');
  });

  it('должен удалять файл с диска', async () => {
    await service.uploadBuffer(testKey, testBuffer);
    expect(service.fileExists(testKey)).toBe(true);

    await service.deleteObject(testKey);
    expect(service.fileExists(testKey)).toBe(false);
  });
});
