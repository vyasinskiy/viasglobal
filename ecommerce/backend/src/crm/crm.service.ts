import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BrandStatus, DistributorStatus, PurchaseOrderStatus } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import { AppService } from '../app.service';

/**
 * Сервис агрегации данных для веб-интерфейса Viasglobal E-Commerce CRM & WMS.
 * Предоставляет структурированные методы чтения и управления каталогом товаров,
 * брендами, производителями, поставщиками, почтовой перепиской, заказами, складом и очередями Keepa.
 */
@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly appService: AppService,
  ) {}

  /**
   * Вспомогательный метод валидации параметров на отсутствие LLM-плейсхолдеров (Fail-Fast HTTP 400)
   */
  validateParam(paramName: string, value?: string | null) {
    // Если значение не передано, валидация проходит (для опциональных параметров)
    if (value === undefined || value === null || value === '') {
      return;
    }
    const trimmed = String(value).trim();
    // Проверяем на наличие запрещенных шаблонов и заглушек
    if (
      trimmed === '***' ||
      trimmed === '...' ||
      trimmed === 'undefined' ||
      trimmed === 'null' ||
      /^<.*>$/.test(trimmed) ||
      /^\[.*\]$/.test(trimmed)
    ) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Параметр ${paramName} содержит недопустимый плейсхолдер '${trimmed}'`,
        hint: `Передайте реальное значение параметра ${paramName} без маскирования и шаблонных скобок`,
      });
    }
  }

  /**
   * Сводная аналитика для главного дашборда CRM
   */
  async getDashboardStats() {
    // 1. Параллельно запрашиваем базовые счетчики сущностей каталога и поставщиков
    const [
      totalAsins,
      brandsByStatus,
      totalManufacturers,
      totalPrivateLabels,
      distributorsByStatus,
      totalEmails,
      totalPriceSnapshots,
      purchaseOrders,
      salesOrders,
      keepaQueueGrouped,
      requestProductQueueCount,
      analysisQueueCount,
      exportsCount,
      lowStockData,
      allStocks,
    ] = await Promise.all([
      this.prisma.aSIN.count(),
      this.prisma.brand.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.manufacturer.count(),
      this.prisma.privateLabel.count(),
      this.prisma.distributor.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.distributorEmail.count(),
      this.prisma.distributorPriceSnapshot.count(),
      this.prisma.purchaseOrder.findMany({
        select: {
          id: true,
          status: true,
          totalGross: true,
          subtotalNetto: true,
        },
      }),
      this.prisma.salesOrder.findMany({
        include: {
          items: {
            select: {
              quantity: true,
              netProfit: true,
            },
          },
        },
      }),
      this.prisma.keepaRequestQueue.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.requestProductQueue.count(),
      this.prisma.analysisProductQueue.count(),
      this.prisma.keepaExport.count(),
      this.inventoryService.getLowStockAlerts(),
      this.prisma.warehouseStock.findMany(),
    ]);

    // 2. Считаем статистику по представлениям товаров на контракте и кандидатов
    const [contractedFiltered, contractedAll, candidates] = await Promise.all([
      this.prisma.$queryRaw<Array<{ count: bigint; profitable: bigint }>>`
        SELECT 
          COUNT(*)::bigint AS count,
          COUNT(*) FILTER (WHERE "netProfitPerMinBoxOrder" > 0)::bigint AS profitable
        FROM public.get_contracted_products(100000, 0.50, true)
      `.catch(() => [{ count: BigInt(0), profitable: BigInt(0) }]),
      this.prisma.$queryRaw<Array<{ count: bigint; profitable: bigint }>>`
        SELECT 
          COUNT(*)::bigint AS count,
          COUNT(*) FILTER (WHERE "netProfitPerMinBoxOrder" > 0)::bigint AS profitable
        FROM public.get_contracted_all_products(true)
      `.catch(() => [{ count: BigInt(0), profitable: BigInt(0) }]),
      this.prisma.$queryRaw<Array<{ brandsCount: bigint; cleanBrandsCount: bigint; totalCleanAsins: bigint }>>`
        SELECT 
          COUNT(*)::bigint AS "brandsCount",
          COUNT(*) FILTER (WHERE "cleanAsinCount" > 0)::bigint AS "cleanBrandsCount",
          COALESCE(SUM("cleanAsinCount"), 0)::bigint AS "totalCleanAsins"
        FROM public."CandidatesProductsView"
      `.catch(() => [{ brandsCount: BigInt(0), cleanBrandsCount: BigInt(0), totalCleanAsins: BigInt(0) }]),
    ]);

    // 3. Группируем статусы брендов
    const brandCounts: Record<string, number> = {
      UNPROCESSED: 0,
      CONTRACTED: 0,
      NO_EU_DISTRIBUTOR: 0,
    };
    let totalBrands = 0;
    for (const b of brandsByStatus) {
      brandCounts[b.status] = b._count._all;
      totalBrands += b._count._all;
    }

    // 4. Группируем статусы воронки дистрибьюторов
    const distCounts: Record<string, number> = {
      NEW: 0,
      FORM_SUBMITTED: 0,
      EMAIL_SENT: 0,
      CALLED: 0,
      ACCOUNT_OPENED: 0,
      REJECTED: 0,
    };
    let totalDistributors = 0;
    for (const d of distributorsByStatus) {
      distCounts[d.status] = d._count._all;
      totalDistributors += d._count._all;
    }

    // 5. Агрегируем заказы поставщикам (PurchaseOrder)
    const orderStatusCounts: Record<string, number> = {};
    let totalGrossSpent = 0;
    let totalNettoSpent = 0;
    for (const po of purchaseOrders) {
      orderStatusCounts[po.status] = (orderStatusCounts[po.status] || 0) + 1;
      totalGrossSpent += po.totalGross || 0;
      totalNettoSpent += po.subtotalNetto || 0;
    }

    // 6. Агрегируем складские остатки по СВХ и MAIN
    let svhTotalUnits = 0;
    let mainTotalUnits = 0;
    let svhSkusCount = 0;
    let mainSkusCount = 0;
    for (const st of allStocks) {
      if (st.warehouse === 'SVH') {
        svhTotalUnits += st.quantity;
        if (st.quantity > 0) svhSkusCount += 1;
      } else if (st.warehouse === 'MAIN') {
        mainTotalUnits += st.quantity;
        if (st.quantity > 0) mainSkusCount += 1;
      }
    }

    // 7. Агрегируем продажи на Amazon (SalesOrder)
    let totalRevenue = 0;
    let totalPlatformFees = 0;
    let totalShippingFees = 0;
    let totalNetAmount = 0;
    let totalNetProfit = 0;
    for (const so of salesOrders) {
      totalRevenue += so.totalAmount || 0;
      totalPlatformFees += so.platformFees || 0;
      totalShippingFees += so.shippingFee || 0;
      totalNetAmount += so.netAmount || 0;
      for (const item of so.items) {
        totalNetProfit += (item.netProfit || 0) * item.quantity;
      }
    }

    // 8. Агрегируем статусы персистентной очереди Keepa
    const keepaQueueByStatus: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      FAILED: 0,
    };
    for (const kq of keepaQueueGrouped) {
      keepaQueueByStatus[kq.status] = kq._count._all;
    }

    // 9. Получаем состояние резервных копий
    const backups = this.appService.getBackupHealth();

    return {
      status: 'success',
      message: 'Сводная аналитика CRM успешно сформирована',
      catalog: {
        totalAsins,
        totalBrands,
        brandsByStatus: brandCounts,
        totalManufacturers,
        totalPrivateLabels,
      },
      contracted: {
        filteredCount: Number(contractedFiltered[0]?.count ?? 0),
        filteredProfitableCount: Number(contractedFiltered[0]?.profitable ?? 0),
        allCount: Number(contractedAll[0]?.count ?? 0),
        allProfitableCount: Number(contractedAll[0]?.profitable ?? 0),
      },
      candidates: {
        brandsCount: Number(candidates[0]?.brandsCount ?? 0),
        cleanBrandsCount: Number(candidates[0]?.cleanBrandsCount ?? 0),
        totalCleanAsins: Number(candidates[0]?.totalCleanAsins ?? 0),
      },
      distributors: {
        total: totalDistributors,
        byStatus: distCounts,
        totalEmails,
        totalPriceSnapshots,
      },
      orders: {
        totalOrders: purchaseOrders.length,
        totalGrossSpent: Math.round(totalGrossSpent * 100) / 100,
        totalNettoSpent: Math.round(totalNettoSpent * 100) / 100,
        byStatus: orderStatusCounts,
      },
      inventory: {
        svhTotalUnits,
        mainTotalUnits,
        svhSkusCount,
        mainSkusCount,
        lowStockAlertsCount: lowStockData.totalAlerts,
        alerts: lowStockData.alerts,
      },
      sales: {
        totalSalesOrders: salesOrders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
        totalShippingFees: Math.round(totalShippingFees * 100) / 100,
        totalNetAmount: Math.round(totalNetAmount * 100) / 100,
        totalNetProfit: Math.round(totalNetProfit * 100) / 100,
      },
      keepa: {
        queueByStatus: keepaQueueByStatus,
        requestProductQueueCount,
        analysisQueueCount,
        exportsCount,
      },
      backups,
    };
  }

  /**
   * Получение списка товаров брендов на контракте (ContractedFilteredProductsView / ContractedAllProductsView)
   * с поддержкой переключения налогового режима (Recargo de Equivalencia vs SL) и проверкой свежести снапшота Keepa (48ч).
   */
  async getContractedProducts(params: {
    mode?: 'filtered' | 'all';
    includeVatOnFees?: boolean;
    brand?: string;
    distributor?: string;
    feeStatus?: string;
    onlyProfitable?: boolean;
    search?: string;
  }) {
    this.validateParam('brand', params.brand);
    this.validateParam('distributor', params.distributor);
    this.validateParam('search', params.search);

    const mode = params.mode === 'all' ? 'all' : 'filtered';
    const includeVat = params.includeVatOnFees !== false;

    // 1. Вызываем соответствующую табличную SQL-функцию с учетом режима налогообложения
    const rawRows =
      mode === 'all'
        ? await this.prisma.$queryRaw<any[]>`
            SELECT * FROM public.get_contracted_all_products(${includeVat})
          `
        : await this.prisma.$queryRaw<any[]>`
            SELECT * FROM public.get_contracted_products(100000, 0.50, ${includeVat})
          `;

    // 2. Получаем даты последних снапшотов ProductFinder и изображения для контроля устаревания (> 48 часов)
    const asinCodes = rawRows.map((r) => r.asin).filter(Boolean);
    const snapshotMetaMap = new Map<
      string,
      { lastSnapshotAt: Date | null; image: string | null; amazonCurrent: string | null; newCurrent: number | null }
    >();

    if (asinCodes.length > 0) {
      const asinsWithSnaps = await this.prisma.aSIN.findMany({
        where: { code: { in: asinCodes } },
        select: {
          code: true,
          productFinders: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              createdAt: true,
              image: true,
              amazonCurrent: true,
              newCurrent: true,
            },
          },
        },
      });

      for (const a of asinsWithSnaps) {
        const snap = a.productFinders[0];
        snapshotMetaMap.set(a.code, {
          lastSnapshotAt: snap?.createdAt ?? null,
          image: snap?.image ? snap.image.split(';')[0] : null,
          amazonCurrent: snap?.amazonCurrent ?? null,
          newCurrent: snap?.newCurrent ?? null,
        });
      }
    }

    const nowMs = Date.now();
    const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 часов

    // 3. Обогащаем и фильтруем строки
    let items = rawRows.map((row) => {
      const meta = snapshotMetaMap.get(row.asin);
      const lastSnapshotAt = meta?.lastSnapshotAt ?? null;
      const snapshotAgeHours = lastSnapshotAt
        ? Math.round(((nowMs - new Date(lastSnapshotAt).getTime()) / (1000 * 60 * 60)) * 10) / 10
        : null;
      const isSnapshotStale = !lastSnapshotAt || nowMs - new Date(lastSnapshotAt).getTime() > STALE_THRESHOLD_MS;

      return {
        ...row,
        image: meta?.image ?? null,
        amazonCurrent: meta?.amazonCurrent ?? null,
        newCurrent: meta?.newCurrent ?? null,
        lastSnapshotAt,
        snapshotAgeHours,
        isSnapshotStale,
      };
    });

    // Фильтр по бренду
    if (params.brand && params.brand !== 'ALL') {
      const targetBrand = params.brand.trim().toUpperCase();
      items = items.filter((i) => (i.brand || '').toUpperCase() === targetBrand);
    }

    // Фильтр по дистрибьютору
    if (params.distributor && params.distributor !== 'ALL') {
      const targetDist = params.distributor.trim().toUpperCase();
      items = items.filter((i) => (i.distributor || '').toUpperCase().includes(targetDist));
    }

    // Фильтр по статусу расчета комиссий
    if (params.feeStatus && params.feeStatus !== 'ALL') {
      if (params.feeStatus === 'NULL') {
        items = items.filter((i) => !i.feeStatus);
      } else {
        items = items.filter((i) => i.feeStatus === params.feeStatus);
      }
    }

    // Фильтр только прибыльных товаров
    if (params.onlyProfitable) {
      items = items.filter((i) => (i.netProfitPerMinBoxOrder ?? i.netProfitPerUnit ?? 0) > 0);
    }

    // Поиск по подстроке (ASIN, EAN, название, бренд, поставщик)
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          (i.asin && i.asin.toLowerCase().includes(q)) ||
          (i.ean && i.ean.toLowerCase().includes(q)) ||
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.brand && i.brand.toLowerCase().includes(q)) ||
          (i.distributor && i.distributor.toLowerCase().includes(q)),
      );
    }

    // Собираем уникальные бренды и дистрибьюторов для фильтров UI
    const brands = Array.from(new Set(rawRows.map((r) => r.brand).filter(Boolean))).sort();
    const distributors = Array.from(new Set(rawRows.map((r) => r.distributor).filter(Boolean))).sort();

    return {
      status: 'success',
      mode,
      includeVatOnFees: includeVat,
      total: items.length,
      profitableCount: items.filter((i) => (i.netProfitPerMinBoxOrder ?? i.netProfitPerUnit ?? 0) > 0).length,
      availableBrands: brands,
      availableDistributors: distributors,
      items,
    };
  }

  /**
   * Получение сводного списка кандидатов под оптовую закупку (CandidatesProductsView / WholesaleCandidatesView)
   */
  async getCandidatesProducts(params: { search?: string; onlyClean?: boolean; limit?: number }) {
    this.validateParam('search', params.search);

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public."CandidatesProductsView"
    `;

    let filtered = rows;

    if (params.onlyClean) {
      filtered = filtered.filter((r) => (r.cleanAsinCount ?? 0) > 0);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.brand && r.brand.toLowerCase().includes(q)) ||
          (r.manufacturer && r.manufacturer.toLowerCase().includes(q)) ||
          (r.sellerNames && r.sellerNames.toLowerCase().includes(q)) ||
          (r.asins && r.asins.toLowerCase().includes(q)) ||
          (r.eans && r.eans.toLowerCase().includes(q)) ||
          (r.distributors && r.distributors.toLowerCase().includes(q)),
      );
    }

    const total = filtered.length;
    const limit = Math.min(params.limit || 250, 1000);

    return {
      status: 'success',
      total,
      cleanBrandsCount: filtered.filter((r) => (r.cleanAsinCount ?? 0) > 0).length,
      items: filtered.slice(0, limit),
    };
  }

  /**
   * Поиск по представлению AsinView (ASIN, EAN, бренд, продавец, BuyBox, MaxBuyPrice)
   */
  async getAsinCatalog(params: { search?: string; brand?: string; limit?: number }) {
    this.validateParam('search', params.search);
    this.validateParam('brand', params.brand);

    const limit = Math.min(params.limit || 100, 500);
    const where: any = {};

    if (params.brand) {
      where.brand = { equals: params.brand.trim(), mode: 'insensitive' };
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { asin: { contains: q, mode: 'insensitive' } },
        { ean: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { seller: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.asinView.findMany({
      where,
      take: limit,
      orderBy: { id: 'desc' },
    });

    return {
      status: 'success',
      total: items.length,
      items,
    };
  }

  /**
   * Детальная карточка конкретного ASIN со снапшотами Keepa, ценами поставщиков и остатками
   */
  async getAsinDetails(code: string) {
    this.validateParam('code', code);
    const cleanCode = code.trim().toUpperCase();

    const asinRecord = await this.prisma.aSIN.findUnique({
      where: { code: cleanCode },
      include: {
        brand: true,
        manufacturer: true,
        distributors: true,
        tags: true,
        productFinders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        priceSnapshots: {
          include: {
            distributor: { select: { id: true, name: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        warehouseStocks: true,
        purchaseOrderItems: {
          include: {
            purchaseOrder: {
              select: { id: true, orderNumber: true, orderDate: true, status: true },
            },
          },
          orderBy: { id: 'desc' },
        },
      },
    });

    if (!asinRecord) {
      throw new NotFoundException(`Товар с ASIN "${cleanCode}" не найден в базе данных`);
    }

    // Запрашиваем чистовик KeepaApiProcessedData и расчетные функции PostgreSQL
    const [processedData, sqlCalc] = await Promise.all([
      this.prisma.keepaApiProcessedData.findUnique({
        where: { asin: cleanCode },
      }),
      this.prisma.$queryRaw<Array<{ filterReason: string | null; maxBuyPrice: number | null }>>`
        SELECT 
          public.get_asin_filter_reason(${asinRecord.id}) AS "filterReason",
          public.calculate_max_buy_price(${asinRecord.id}) AS "maxBuyPrice"
      `.catch(() => [{ filterReason: null, maxBuyPrice: null }]),
    ]);

    const latestSnap = asinRecord.productFinders[0] ?? null;
    const lastSnapshotAt = latestSnap?.createdAt ?? processedData?.lastProcessedAt ?? null;
    const isSnapshotStale =
      !lastSnapshotAt || Date.now() - new Date(lastSnapshotAt).getTime() > 48 * 60 * 60 * 1000;

    return {
      status: 'success',
      data: {
        ...asinRecord,
        processedData,
        filterReason: sqlCalc[0]?.filterReason ?? null,
        maxBuyPrice: sqlCalc[0]?.maxBuyPrice ?? null,
        lastSnapshotAt,
        isSnapshotStale,
      },
    };
  }

  /**
   * Список всех брендов с фильтрацией по статусу и поиском
   */
  async getBrands(params: { status?: BrandStatus | string; search?: string; limit?: number }) {
    this.validateParam('search', params.search);

    const where: any = {};
    if (params.status && params.status !== 'ALL') {
      where.status = params.status as BrandStatus;
    }
    if (params.search && params.search.trim()) {
      where.OR = [
        { name: { contains: params.search.trim(), mode: 'insensitive' } },
        { notes: { contains: params.search.trim(), mode: 'insensitive' } },
      ];
    }

    const brands = await this.prisma.brand.findMany({
      where,
      include: {
        _count: {
          select: {
            asins: true,
            privateLabels: true,
            keepaExports: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      take: Math.min(params.limit || 300, 1000),
    });

    return {
      status: 'success',
      total: brands.length,
      brands,
    };
  }

  /**
   * Обновление статуса и заметок (легенды для Welcome Letter) у бренда
   */
  async updateBrand(id: number, data: { status?: BrandStatus; notes?: string }) {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Бренд с ID ${id} не найден`);
    }

    const updated = await this.prisma.brand.update({
      where: { id },
      data: {
        status: data.status ?? existing.status,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
    });

    return {
      status: 'success',
      message: `Бренд "${updated.name}" успешно обновлен`,
      brand: updated,
    };
  }

  /**
   * Список производителей и их сырых алиасов из Keepa (ManufacturerAlias)
   */
  async getManufacturers(params: { search?: string; limit?: number }) {
    this.validateParam('search', params.search);

    const where: any = {};
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { aliases: { some: { rawName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const manufacturers = await this.prisma.manufacturer.findMany({
      where,
      include: {
        aliases: {
          orderBy: { rawName: 'asc' },
        },
        _count: {
          select: { asins: true, aliases: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(params.limit || 200, 500),
    });

    return {
      status: 'success',
      total: manufacturers.length,
      manufacturers,
    };
  }

  /**
   * Список подтвержденных связок Приватных Лейблов (PrivateLabelView)
   */
  async getPrivateLabels(params: { search?: string; limit?: number }) {
    this.validateParam('search', params.search);

    const where: any = {};
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { brandName: { contains: q, mode: 'insensitive' } },
        { sellerName: { contains: q, mode: 'insensitive' } },
        { sellerId: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.privateLabelView.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(params.limit || 250, 1000),
    });

    return {
      status: 'success',
      total: items.length,
      items,
    };
  }

  /**
   * Расширенный список дистрибьюторов со счетчиками писем, контактов, прайсов и заказов
   */
  async getDistributorsList(params: { status?: DistributorStatus | string; search?: string }) {
    this.validateParam('search', params.search);

    const where: any = {};
    if (params.status && params.status !== 'ALL') {
      where.status = params.status as DistributorStatus;
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { website: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    const distributors = await this.prisma.distributor.findMany({
      where,
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
        },
        _count: {
          select: {
            asins: true,
            contacts: true,
            emails: true,
            priceSnapshots: true,
            purchaseOrders: true,
            documents: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });

    return {
      status: 'success',
      total: distributors.length,
      distributors,
    };
  }

  /**
   * Полная детальная карточка дистрибьютора (контакты, переписка IMAP, прайс-снапшоты, заказы, документы)
   */
  async getDistributorFullDetails(id: number) {
    const distributor = await this.prisma.distributor.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        },
        emails: {
          orderBy: { date: 'desc' },
          take: 100,
          select: {
            id: true,
            messageId: true,
            folder: true,
            fromEmail: true,
            fromName: true,
            toEmails: true,
            subject: true,
            date: true,
            snippet: true,
            bodyText: true,
            hasAttachments: true,
            attachments: true,
            isRead: true,
          },
        },
        priceSnapshots: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          include: {
            asin: {
              select: {
                id: true,
                code: true,
                feeStatus: true,
                brand: { select: { name: true } },
              },
            },
          },
        },
        purchaseOrders: {
          orderBy: { orderDate: 'desc' },
          include: {
            _count: { select: { items: true, documents: true } },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        asins: {
          take: 200,
          include: {
            brand: { select: { name: true } },
          },
        },
        _count: {
          select: {
            asins: true,
            contacts: true,
            emails: true,
            priceSnapshots: true,
            purchaseOrders: true,
            documents: true,
          },
        },
      },
    });

    if (!distributor) {
      throw new NotFoundException(`Дистрибьютор с ID ${id} не найден`);
    }

    return {
      status: 'success',
      distributor,
    };
  }

  /**
   * Поиск и фильтрация по письмам поставщиков (Hostinger IMAP в БД, строго Read-Only)
   */
  async searchDistributorEmails(params: {
    distributorId?: number;
    q?: string;
    hasAttachments?: boolean;
    limit?: number;
  }) {
    this.validateParam('q', params.q);

    const where: any = {};
    if (params.distributorId) {
      where.distributorId = Number(params.distributorId);
    }
    if (params.hasAttachments) {
      where.hasAttachments = true;
    }
    if (params.q && params.q.trim()) {
      const q = params.q.trim();
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { bodyText: { contains: q, mode: 'insensitive' } },
        { fromEmail: { contains: q, mode: 'insensitive' } },
        { fromName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const emails = await this.prisma.distributorEmail.findMany({
      where,
      include: {
        distributor: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { date: 'desc' },
      take: Math.min(params.limit || 50, 200),
    });

    return {
      status: 'success',
      total: emails.length,
      emails,
    };
  }

  /**
   * Список всех заказов поставщикам (PurchaseOrder) по всей системе с фильтрацией
   */
  async getAllPurchaseOrders(params: {
    distributorId?: number;
    status?: PurchaseOrderStatus | string;
    search?: string;
  }) {
    this.validateParam('search', params.search);

    const where: any = {};
    if (params.distributorId) {
      where.distributorId = Number(params.distributorId);
    }
    if (params.status && params.status !== 'ALL') {
      where.status = params.status as PurchaseOrderStatus;
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { distributor: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const orders = await this.prisma.purchaseOrder.findMany({
      where,
      include: {
        distributor: {
          select: { id: true, name: true, email: true, status: true },
        },
        items: true,
        documents: true,
        _count: {
          select: { items: true, documents: true },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    return {
      status: 'success',
      total: orders.length,
      orders,
    };
  }

  /**
   * Полный обзор очередей Keepa API, разрешенных категорий и истории выгрузок
   */
  async getKeepaOverview() {
    const [
      keepaQueue,
      keepaQueueGrouped,
      productQueue,
      productQueueCount,
      analysisQueue,
      analysisQueueCount,
      allowedCategories,
      exportsList,
    ] = await Promise.all([
      this.prisma.keepaRequestQueue.findMany({
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        take: 100,
      }),
      this.prisma.keepaRequestQueue.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.requestProductQueue.findMany({
        orderBy: [{ priority: 'desc' }, { addedAt: 'desc' }],
        take: 100,
      }),
      this.prisma.requestProductQueue.count(),
      this.prisma.analysisProductQueue.findMany({
        orderBy: [{ priority: 'desc' }, { addedAt: 'desc' }],
        take: 100,
      }),
      this.prisma.analysisProductQueue.count(),
      this.prisma.keepaAllowedCategory.findMany({
        orderBy: { id: 'asc' },
      }),
      this.prisma.keepaExportView.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const statusSummary: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      FAILED: 0,
    };
    for (const group of keepaQueueGrouped) {
      statusSummary[group.status] = group._count._all;
    }

    return {
      status: 'success',
      keepaQueue: {
        summary: statusSummary,
        items: keepaQueue,
      },
      productQueue: {
        total: productQueueCount,
        items: productQueue,
      },
      analysisQueue: {
        total: analysisQueueCount,
        items: analysisQueue,
      },
      allowedCategories,
      exports: exportsList,
    };
  }
}

