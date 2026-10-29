// ecommerce/backend/src/finance/finance.controller.ts
// REST API контроллер сводного финансового дашборда Viasglobal по всем видам деятельности:
// 1. IT-разработка (IAE 763 / CNAE 6201 — 4 000 EUR/мес, генерация Word/PDF + электронная фактура в Taxfix)
// 2. Продажа товаров на Amazon (IAE 665 / CNAE 4791 — закупки партий, продажи, операционные фактуры упаковки/сервисов)
// 3. Аренда недвижимости (РФ, отдельное юрлицо вне налогового контура Испании — консолидация с accruals-accountant)

import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  /**
   * Получить полный сводный финансовый дашборд за выбранный год (по месяцам и за весь год)
   * GET /finance/dashboard[?year=2026&eurRubRate=105]
   */
  @Get('dashboard')
  async getDashboard(
    @Query('year') year?: string,
    @Query('eurRubRate') eurRubRate?: string,
  ) {
    this.financeService.validateNoPlaceholders('year', year);
    this.financeService.validateNoPlaceholders('eurRubRate', eurRubRate);

    return this.financeService.getConsolidatedDashboard({
      year: year ? Number(year) : undefined,
      eurRubRate: eurRubRate ? Number(eurRubRate) : undefined,
    });
  }

  /**
   * Получить список всех записей финансового реестра Autónomo (IT-инвойсы и операционные фактуры расходов)
   * GET /finance/ledger[?year=2026&segment=IT_DEV|ECOMMERCE|COMMON_AUTONOMO]
   */
  @Get('ledger')
  async getLedger(
    @Query('year') year?: string,
    @Query('segment') segment?: string,
  ) {
    this.financeService.validateNoPlaceholders('year', year);
    this.financeService.validateNoPlaceholders('segment', segment);

    const targetYear = year && !isNaN(Number(year)) ? Number(year) : new Date().getUTCFullYear();
    const { store, allEntries } = this.financeService.getMergedLedgerEntries(targetYear);
    const filtered = segment
      ? allEntries.filter((e) => e.segment === segment)
      : allEntries;

    return {
      status: 'success',
      year: targetYear,
      eurRubRate: store.eurRubRate,
      total: filtered.length,
      entries: filtered,
    };
  }

  /**
   * Создать новую запись в финансовом реестре (новый IT-инвойс или фактуру расхода: упаковка, софт, квота Autónomo, Taxfix)
   * POST /finance/ledger
   */
  @Post('ledger')
  async createLedgerEntry(@Body() body: any) {
    const entry = this.financeService.createLedgerEntry(body);
    return {
      status: 'success',
      message: 'Финансовая запись успешно добавлена в реестр',
      entry,
    };
  }

  /**
   * Обновить запись в финансовом реестре (например, отметить выпуск электронной фактуры в Taxfix, генерацию Word/PDF или линковку с банком)
   * PATCH /finance/ledger/:id
   */
  @Patch('ledger/:id')
  async updateLedgerEntry(@Param('id') id: string, @Body() body: any) {
    const entry = this.financeService.updateLedgerEntry(id, body);
    return {
      status: 'success',
      message: 'Финансовая запись и статус Taxfix успешно обновлены',
      entry,
    };
  }

  /**
   * Удалить запись из финансового реестра
   * DELETE /finance/ledger/:id
   */
  @Delete('ledger/:id')
  async deleteLedgerEntry(@Param('id') id: string) {
    const res = this.financeService.deleteLedgerEntry(id);
    return {
      status: 'success',
      message: 'Запись удалена из финансового реестра',
      ...res,
    };
  }

  /**
   * Обновить настройки курса конвертации EUR/RUB и параметров ежемесячного IT-инвойса по умолчанию
   * PATCH /finance/settings
   */
  @Patch('settings')
  async updateSettings(@Body() body: any) {
    return this.financeService.updateSettings(body);
  }

  /**
   * Сгенерировать печатный документ ежемесячного IT-инвойса (Word .doc / PDF) и карточку реквизитов для создания электронной фактуры в Taxfix
   * GET /finance/it-invoice/:idOrPeriod/document
   */
  @Get('it-invoice/:idOrPeriod/document')
  async getItInvoiceDocument(@Param('idOrPeriod') idOrPeriod: string) {
    const doc = this.financeService.generateItInvoiceDocument(idOrPeriod);
    return {
      status: 'success',
      ...doc,
    };
  }
}

