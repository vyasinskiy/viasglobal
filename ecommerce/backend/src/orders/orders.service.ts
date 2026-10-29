import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseOrderStatus, WarehouseLocation, OrderDocumentType, StockMovementType } from '@prisma/client';

/**
 * Обязательный чек-лист документов при физической приемке поставки
 */
export const RECEIVING_DOCUMENT_CHECKLIST = [
  {
    documentType: OrderDocumentType.ALBARAN,
    title: 'Товарно-транспортная накладная поставщика (Albarán)',
    required: true,
    description: 'Сверка артикулов (SKU), штрихкодов EAN, количества и выделенной строки эко-тасы (TASA / RAEE)',
  },
  {
    documentType: OrderDocumentType.SHIPPING_LABEL,
    title: 'Транспортная этикетка курьерской службы (Shipping Label)',
    required: true,
    description: 'Фото наклейки перевозчика (DHL, SEUR, Correos Express) на коробке с трек-номером и числом мест (Bultos)',
  },
  {
    documentType: OrderDocumentType.INVOICE,
    title: 'Счет-фактура поставщика (Factura)',
    required: true,
    description: 'Проверка налоговой базы Netto, IVA 21% + RE 5.2%, суммы TASA и регистрационного номера RII-AEE / CIF',
  },
  {
    documentType: OrderDocumentType.PAYMENT_RECEIPT,
    title: 'Документ об оплате (Payment Receipt / SEPA Direct Debit)',
    required: false,
    description: 'Подтверждение оплаты или банковская квитанция SEPA (при наличии на момент приемки)',
  },
] as const;

/**
 * Сервис управления закупками у поставщиков, юнит-экономикой партий и первичным оприходованием
 */
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Валидация строковых параметров на отсутствие плейсхолдеров LLM (Fail-Fast HTTP 400)
   */
  private validateNoPlaceholders(fieldName: string, value: unknown): void {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (
      trimmed === '***' ||
      trimmed === '...' ||
      trimmed === 'undefined' ||
      trimmed === 'null' ||
      /^<[^>]+>$/.test(trimmed) ||
      /^\[[^\]]+\]$/.test(trimmed)
    ) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Параметр "${fieldName}" содержит недопустимый плейсхолдер "${trimmed}"`,
        hint: `Укажите реальное значение параметра "${fieldName}" без маскирования (сначала запросите список через GET /orders)`,
      });
    }
  }

  /**
   * Вычисление статуса налогового комплаенса Taxfix по заказу:
   * 1) Наличие прикрепленной фактуры поставщика (INVOICE),
   * 2) Наличие прикрепленного документа факта оплаты из банка (PAYMENT_RECEIPT),
   * 3) Загрузка фактуры в сервис Taxfix (uploadedToTaxfix),
   * 4) Линковка фактуры с банковской транзакцией оплаты в Taxfix (paymentLinkedInTaxfix).
   */
  public computeTaxfixCompliance(order: {
    id: number;
    orderNumber: string;
    paymentStatus?: string | null;
    notes?: string | null;
    distributor?: { name?: string | null } | null;
    documents?: Array<{
      id?: number;
      documentType: OrderDocumentType | string;
      fileName: string;
      filePath: string;
      notes?: string | null;
      createdAt?: Date | string;
    }>;
  }) {
    const docs = order.documents ?? [];
    // Отбираем прикрепленные счета-фактуры и банковские подтверждения оплаты
    const invoices = docs.filter((d) => d.documentType === OrderDocumentType.INVOICE);
    const paymentReceipts = docs.filter((d) => d.documentType === OrderDocumentType.PAYMENT_RECEIPT);

    const hasInvoice = invoices.length > 0;
    const hasPaymentReceipt = paymentReceipts.length > 0;

    // Извлекаем метаданные Taxfix из структурированного тега [TAXFIX: UPLOADED=..., LINKED=..., REF=...] в примечаниях заказа или документов
    const combinedNotes = [
      order.notes ?? '',
      ...invoices.map((i) => i.notes ?? ''),
      ...paymentReceipts.map((p) => p.notes ?? ''),
    ].join('\n');

    const uploadedMatch = combinedNotes.match(/UPLOADED=(true|false)/i);
    const linkedMatch = combinedNotes.match(/LINKED=(true|false)/i);
    const refMatch = combinedNotes.match(/REF=([^\]|;\n]+)/i);

    const uploadedToTaxfix = uploadedMatch ? uploadedMatch[1].toLowerCase() === 'true' : false;
    const paymentLinkedInTaxfix = linkedMatch ? linkedMatch[1].toLowerCase() === 'true' : false;
    const bankReference = refMatch ? refMatch[1].trim() : null;

    // Формируем список незавершенных шагов по бизнес-правилу Taxfix
    const pendingActions: string[] = [];
    if (!hasInvoice) {
      pendingActions.push('Получить и загрузить счет-фактуру поставщика (INVOICE)');
    }
    if (!hasPaymentReceipt) {
      pendingActions.push('Выгрузить из банка и прикрепить подтверждение оплаты (PAYMENT_RECEIPT)');
    }
    if (!uploadedToTaxfix) {
      pendingActions.push('Загрузить счет-фактуру в налоговый сервис Taxfix');
    }
    if (!paymentLinkedInTaxfix) {
      pendingActions.push('Слинковать счет-фактуру с банковской транзакцией оплаты в сервисе Taxfix');
    }

    // Определяем сводный статус Taxfix для заказа
    let status:
      | 'MISSING_INVOICE'
      | 'PENDING_TAXFIX_AND_PAYMENT'
      | 'PENDING_BANK_RECEIPT'
      | 'PENDING_TAXFIX_UPLOAD'
      | 'PENDING_TAXFIX_LINK'
      | 'COMPLETED';

    if (hasInvoice && hasPaymentReceipt && uploadedToTaxfix && paymentLinkedInTaxfix) {
      status = 'COMPLETED';
    } else if (!hasInvoice) {
      status = 'MISSING_INVOICE';
    } else if (!hasPaymentReceipt && !uploadedToTaxfix) {
      status = 'PENDING_TAXFIX_AND_PAYMENT';
    } else if (!hasPaymentReceipt) {
      status = 'PENDING_BANK_RECEIPT';
    } else if (!uploadedToTaxfix) {
      status = 'PENDING_TAXFIX_UPLOAD';
    } else {
      status = 'PENDING_TAXFIX_LINK';
    }

    const supplierName = order.distributor?.name || 'Поставщик';
    const invoiceLabel = invoices[0]?.fileName || order.orderNumber;

    // Если процесс по Taxfix еще не завершен полностью, формируем готовый шаблон задачи [Legal] для Google Tasks
    const recommendedLegalTask =
      status === 'COMPLETED'
        ? null
        : {
            category: 'Legal',
            title: `[Legal]: Taxfix — Загрузить фактуру по заказу ${order.orderNumber} (${supplierName}) и слинковать с банковской оплатой`,
            checklist: [
              `1. Проверить реквизиты в фактуре ${invoiceLabel} (Vitalii Iasinskii, NIF ESZ1154366R, Ronda Albocacer 11, 12166 Els Ibarsos) и загрузить PDF фактуры в сервис Taxfix.`,
              `2. Выгрузить из банка подтверждение оплаты (PAYMENT_RECEIPT: выписка SEPA / карта / перевод) и прикрепить к заказу через POST /orders/${order.orderNumber}/taxfix.`,
              `3. Слинковать загруженную фактуру с фактом оплаты из банка внутри сервиса Taxfix и отметить статус LINKED.`,
            ],
          };

    return {
      status,
      isCompliant: status === 'COMPLETED',
      hasInvoice,
      hasPaymentReceipt,
      uploadedToTaxfix,
      paymentLinkedInTaxfix,
      bankReference,
      invoices: invoices.map((i) => ({
        id: i.id,
        fileName: i.fileName,
        filePath: i.filePath,
        notes: i.notes,
        createdAt: i.createdAt,
      })),
      paymentReceipts: paymentReceipts.map((p) => ({
        id: p.id,
        fileName: p.fileName,
        filePath: p.filePath,
        notes: p.notes,
        createdAt: p.createdAt,
      })),
      pendingActions,
      recommendedLegalTask,
    };
  }

  /**
   * Создать новый заказ на закупку (партию)
   */
  async createOrder(data: {
    distributorId: number;
    orderNumber: string;
    orderDate?: Date | string;
    expectedDeliveryDate?: Date | string;
    shippingCost?: number;
    paymentMethod?: string;
    notes?: string;
    items: Array<{
      sku: string;
      ean?: string;
      asinId?: number;
      title: string;
      quantityOrdered: number;
      priceNetto: number;
      ecoTasa?: number;
    }>;
  }) {
    const shippingCost = data.shippingCost ?? 0;

    // Рассчитываем итоговые суммы по всем позициям заказа с учетом испанских налогов (21% IVA + 5.2% RE = 1.262)
    let subtotalNetto = 0;
    let totalEcoTasa = 0;
    let taxAmount = 0;
    let totalGross = 0;

    const itemsData = data.items.map((item) => {
      const ecoTasa = item.ecoTasa ?? 0;
      const baseWithEco = item.priceNetto + ecoTasa;
      // Себестоимость за штуку с налогами Recargo de Equivalencia
      const costPrice = Math.round(baseWithEco * 1.262 * 100) / 100;
      const itemTotalGross = Math.round(costPrice * item.quantityOrdered * 100) / 100;

      subtotalNetto += item.priceNetto * item.quantityOrdered;
      totalEcoTasa += ecoTasa * item.quantityOrdered;
      totalGross += itemTotalGross;

      return {
        sku: item.sku.trim(),
        ean: item.ean ? item.ean.trim() : null,
        asinId: item.asinId,
        title: item.title.trim(),
        quantityOrdered: item.quantityOrdered,
        priceNetto: item.priceNetto,
        ecoTasa,
        costPrice,
        totalCostGross: itemTotalGross,
      };
    });

    // Налоги составляют разницу между Gross и чистой базой с тасой
    taxAmount = Math.round((totalGross - (subtotalNetto + totalEcoTasa)) * 100) / 100;
    totalGross += shippingCost;

    return this.prisma.purchaseOrder.create({
      data: {
        distributorId: data.distributorId,
        orderNumber: data.orderNumber.trim(),
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        shippingCost,
        subtotalNetto: Math.round(subtotalNetto * 100) / 100,
        totalEcoTasa: Math.round(totalEcoTasa * 100) / 100,
        taxAmount,
        totalGross: Math.round(totalGross * 100) / 100,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        status: PurchaseOrderStatus.CONFIRMED,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        distributor: true,
      },
    });
  }

  /**
   * Получить список всех заказов с опциональной фильтрацией по поставщику, статусу и поиску по товарам/номеру
   */
  async getOrders(filters?: { distributor?: string | number; status?: string; search?: string }) {
    // Формируем объект условий фильтрации для Prisma
    const where: any = {};

    // Если передан фильтр по дистрибьютору (ID, название компании или бренд в заметках)
    if (filters?.distributor !== undefined && String(filters.distributor).trim() !== '') {
      const distQuery = String(filters.distributor).trim();
      if (!isNaN(Number(distQuery))) {
        where.distributorId = Number(distQuery);
      } else {
        // Ищем дистрибьютора по имени или по упоминанию бренда в поле notes (например, KUKEN -> ALFA DYSER)
        const dist = await this.prisma.distributor.findFirst({
          where: {
            OR: [
              { name: { contains: distQuery, mode: 'insensitive' } },
              { notes: { contains: distQuery, mode: 'insensitive' } },
            ],
          },
        });
        if (!dist) {
          throw new NotFoundException(`Дистрибьютор "${distQuery}" не найден`);
        }
        where.distributorId = dist.id;
      }
    }

    // Если передан фильтр по статусу заказа (например, CONFIRMED, SHIPPED, PARTIALLY_RECEIVED, RECEIVED)
    if (filters?.status && filters.status.trim() !== '') {
      where.status = filters.status.trim().toUpperCase() as PurchaseOrderStatus;
    }

    // Если передан универсальный поисковый запрос (номер заказа, поставщик, SKU, EAN, название товара)
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { distributor: { name: { contains: q, mode: 'insensitive' } } },
        { distributor: { notes: { contains: q, mode: 'insensitive' } } },
        {
          items: {
            some: {
              OR: [
                { sku: { contains: q, mode: 'insensitive' } },
                { ean: { contains: q, mode: 'insensitive' } },
                { title: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    // Запрашиваем заказы вместе с данными поставщика, позициями и документами
    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        distributor: { select: { id: true, name: true, email: true } },
        items: true,
        documents: true,
        _count: { select: { items: true, documents: true } },
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  /**
   * Получить список всех заказов по дистрибьютору (по ID или имени)
   */
  async getOrdersByDistributor(distributorQuery: string | number) {
    // Делегируем вызов универсальному методу getOrders с фильтром по дистрибьютору
    return this.getOrders({ distributor: distributorQuery });
  }

  /**
   * Получить детальные данные заказа со сводной юнит-экономикой
   */
  async getOrderDetails(orderIdOrNumber: string | number) {
    let whereClause: any;

    if (typeof orderIdOrNumber === 'number' || (!isNaN(Number(orderIdOrNumber)) && !String(orderIdOrNumber).includes('-'))) {
      whereClause = { id: Number(orderIdOrNumber) };
    } else {
      whereClause = { orderNumber: String(orderIdOrNumber) };
    }

    const order = await this.prisma.purchaseOrder.findFirst({
      where: whereClause,
      include: {
        distributor: true,
        items: {
          include: {
            asin: {
              include: {
                productFinders: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
            allocations: {
              include: {
                salesOrderItem: {
                  include: {
                    salesOrder: true,
                  },
                },
              },
            },
            documents: true,
          },
        },
        documents: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Заказ "${orderIdOrNumber}" не найден`);
    }

    // Рассчитываем юнит-экономику партии и прогноз маржинальности
    const itemsEconomy = order.items.map((item) => {
      const snap = item.asin?.productFinders?.[0];
      const buyBoxPrice = snap?.buyBoxCurrent ?? snap?.newCurrent ?? null;
      const fbaFee = snap?.fBAPickPackFee ?? null;
      const referralFee = snap?.referralFee ?? (buyBoxPrice ? Math.round(buyBoxPrice * 0.15 * 100) / 100 : null);
      const totalFees = fbaFee !== null && referralFee !== null ? fbaFee + referralFee : null;

      // Чистая прибыль с единицы при продаже по BuyBox
      const estimatedNetProfitPerUnit =
        buyBoxPrice !== null && totalFees !== null
          ? Math.round((buyBoxPrice - totalFees - item.costPrice) * 100) / 100
          : null;

      // Ожидаемая суммарная прибыль с заказанного количества
      const estimatedTotalProfit =
        estimatedNetProfitPerUnit !== null
          ? Math.round(estimatedNetProfitPerUnit * item.quantityOrdered * 100) / 100
          : null;

      // Фактические продажи из данной партии
      const allocations = item.allocations || [];
      const totalAllocatedSold = allocations.reduce((acc, alloc) => acc + alloc.quantity, 0);
      const actualGrossRevenue = allocations.reduce(
        (acc, alloc) => acc + alloc.quantity * alloc.salesOrderItem.salePrice,
        0,
      );
      const actualNetProfit = allocations.reduce(
        (acc, alloc) => acc + (alloc.salesOrderItem.netProfit ?? 0) * alloc.quantity,
        0,
      );

      return {
        id: item.id,
        sku: item.sku,
        ean: item.ean,
        asin: item.asin?.code ?? null,
        title: item.title,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: item.quantityReceived,
        priceNetto: item.priceNetto,
        ecoTasa: item.ecoTasa,
        costPriceGross: item.costPrice,
        totalCostGross: item.totalCostGross,
        packageMeasurements: {
          lengthCm: item.packageLengthCm,
          widthCm: item.packageWidthCm,
          heightCm: item.packageHeightCm,
          weightG: item.packageWeightG,
        },
        marketData: {
          buyBoxPrice,
          fbaFee,
          referralFee,
          totalFees,
          salesRank: snap?.salesRankCurrent ?? null,
        },
        unitEconomics: {
          estimatedNetProfitPerUnit,
          estimatedTotalProfit,
          roiPercent:
            estimatedNetProfitPerUnit !== null && item.costPrice > 0
              ? Math.round((estimatedNetProfitPerUnit / item.costPrice) * 10000) / 100
              : null,
          marginPercent:
            estimatedNetProfitPerUnit !== null && buyBoxPrice && buyBoxPrice > 0
              ? Math.round((estimatedNetProfitPerUnit / buyBoxPrice) * 10000) / 100
              : null,
        },
        salesProgress: {
          unitsSold: totalAllocatedSold,
          unitsRemaining: Math.max(0, item.quantityReceived - totalAllocatedSold),
          actualGrossRevenue: Math.round(actualGrossRevenue * 100) / 100,
          actualNetProfit: Math.round(actualNetProfit * 100) / 100,
        },
        // Заметки и выявленные моменты приемки по конкретной позиции (тройная сверка EAN, повреждения, фото)
        notes: item.notes ?? null,
        // Прикрепленные к конкретному айтему фотографии с разных сторон и фото замеров
        documents: item.documents ?? [],
      };
    });

    // Формируем статус обязательного чек-листа приемки партии и отдельных позиций
    const allOrderDocs = order.documents ?? [];
    const batchPhotos = allOrderDocs.filter(
      (d) => d.documentType === OrderDocumentType.RECEIVING_PHOTO && !d.purchaseOrderItemId,
    );
    const isAlreadyReceived =
      order.status === PurchaseOrderStatus.RECEIVED ||
      order.status === PurchaseOrderStatus.PARTIALLY_RECEIVED ||
      order.items.some((i) => i.quantityReceived > 0);

    const documentChecklist = RECEIVING_DOCUMENT_CHECKLIST.map((reqDoc) => {
      const attached = allOrderDocs.filter((d) => d.documentType === reqDoc.documentType);
      return {
        documentType: reqDoc.documentType,
        title: reqDoc.title,
        required: reqDoc.required,
        description: reqDoc.description,
        attachedCount: attached.length,
        status: attached.length > 0 ? 'ATTACHED' : 'PENDING_OR_SKIPPABLE_WITH_REASON',
      };
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      orderDate: order.orderDate,
      expectedDeliveryDate: order.expectedDeliveryDate,
      actualDeliveryDate: order.actualDeliveryDate,
      supplier: {
        id: order.distributor.id,
        name: order.distributor.name,
        website: order.distributor.website,
        email: order.distributor.email,
      },
      financials: {
        shippingCost: order.shippingCost,
        subtotalNetto: order.subtotalNetto,
        totalEcoTasa: order.totalEcoTasa,
        taxAmount: order.taxAmount,
        totalGross: order.totalGross,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      },
      items: itemsEconomy,
      documents: order.documents,
      stockMovements: order.stockMovements,
      notes: order.notes,
      // Статус налогового учета фактуры и привязки банковской оплаты в сервисе Taxfix
      taxfixCompliance: this.computeTaxfixCompliance(order),
      // Структурированный регламент и текущий прогресс двухфазной приемки (партия -> позиции)
      receivingChecklist: {
        isAlreadyReceived,
        canCorrect: true,
        correctionHint: isAlreadyReceived
          ? 'По данной партии уже проводилась приемка. Повторный вызов POST /orders/:id/receive (или PATCH /orders/:id/receive) выполнит безопасную корректировку (дельта-пересчет) без задвоения складских остатков.'
          : 'Первичная приемка партии: сначала проведите Фазу 1 (даты, список документов, общие фото коробок партии с разных сторон), затем Фазу 2 по каждой позиции отдельно (тройная сверка EAN, пересчет, фото айтема с разных сторон, замеры и распределение СВХ/MAIN).',
        phase1BatchLevel: {
          datesRequired: ['actualDeliveryDate (дата фактического получения от курьера)', 'receivingDate (дата проведения приемки)'],
          documentChecklist,
          batchPhotosCount: batchPhotos.length,
          batchPhotosRequirement: 'Обязательное фотографирование всей партии целиком (общие транспортные коробки с разных сторон до и после вскрытия)',
        },
        phase2ItemLevel: {
          mandatoryEanTripleCheck: 'Обязательная тройная сверка EAN по каждой позиции: 1) EAN из заказа БД <-> 2) EAN из Albarán <-> 3) EAN со штрихкода заводской коробки',
          itemPhotosRequirement: 'Фотографирование каждого отдельного айтема с разных сторон (коробка спереди/сзади/сбоку, крупный план EAN и знака WEEE, сам товар, замеры рулеткой и весы)',
          commentsRequirement: 'Все пересылаемые фотографии, повреждения упаковки и несоответствия обязательно записываются в комментарий приемки (notes / itemNotes)',
        },
      },
    };
  }

  /**
   * Выполнить приемку поставки или корректировку ранее проведенной приемки:
   * - Фаза 1 (партия целиком): фиксация даты получения (actualDeliveryDate) и даты приемки (receivingDate),
   *   проверка списка документов с возможностью явного пропуска с комментарием причины (skippedDocuments),
   *   фотографирование всей партии (общие коробки с разных сторон) и общий комментарий приемки.
   * - Фаза 2 (каждая позиция отдельно): обязательная тройная сверка EAN (Заказ <-> Albarán <-> Коробка),
   *   пересчет количества, замеры упаковки, фотографирование отдельного айтема с разных сторон,
   *   фиксация всех фото и выявленных повреждений/моментов в комментарии приемки,
   *   распределение между СВХ (по дефолту 3 шт) и Основным складом (MAIN).
   * - Режим корректировки (при повторном прохождении процедуры по уже принятой партии):
   *   вычисляет точную дельту по складам (deltaSvh, deltaMain) относительно ранее оприходованного количества,
   *   предотвращая дублирование остатков и создавая корректирующие проводки ADJUSTMENT.
   */
  async receiveOrder(
    orderIdOrNumber: number | string,
    data: {
      // Дата фактического получения коробок от курьера
      actualDeliveryDate?: Date | string;
      // Дата фактического проведения процедуры приемки (если приемка проводилась с задержкой после получения)
      receivingDate?: Date | string;
      // Общий комментарий приемки по всей партии (состояние транспортных коробок, выявленные моменты, фото)
      notes?: string;
      receivingNotes?: string;
      // Список документов из обязательного чек-листа, пропущенных с явного разрешения пользователя и указанием причины
      skippedDocuments?: Array<{
        documentType: OrderDocumentType | string;
        reason: string;
      }>;
      // Позиции к приемке или корректировке (может быть передана вся партия или отдельные позиции по очереди)
      items?: Array<{
        sku: string;
        quantityReceived: number;
        // Обязательная тройная сверка штрихкода EAN: из заказа БД, из Albarán и с физической коробки
        eanAlbaran?: string;
        eanBox?: string;
        eanVerified?: boolean;
        // Замеры заводской упаковки (см, граммы)
        packageLengthCm?: number;
        packageWidthCm?: number;
        packageHeightCm?: number;
        packageWeightG?: number;
        // Распределение по складам (по дефолту на СВХ идет до 3 шт, остальное на Основной склад MAIN)
        svhQuantity?: number;
        mainQuantity?: number;
        // Комментарий приемки по конкретной позиции (все пересланные фото, повреждения, расхождения)
        itemNotes?: string;
        notes?: string;
        // Фотографии конкретного айтема с разных сторон (коробка, штрихкод EAN, товар, замеры рулеткой, весы)
        documents?: Array<{
          documentType?: OrderDocumentType;
          fileName: string;
          filePath: string;
          fileSize?: number;
          mimeType?: string;
          notes?: string;
        }>;
      }>;
      // Документы и фотографии всей партии (Albarán, Shipping Label, Factura, фото общих коробок с разных сторон)
      documents?: Array<{
        documentType: OrderDocumentType;
        fileName: string;
        filePath: string;
        fileSize?: number;
        mimeType?: string;
        notes?: string;
        purchaseOrderItemId?: number;
        sku?: string;
      }>;
    },
  ) {
    // Проверяем входные поля на отсутствие технических плейсхолдеров LLM
    this.validateNoPlaceholders('orderId', orderIdOrNumber);
    this.validateNoPlaceholders('notes', data?.notes);
    this.validateNoPlaceholders('receivingNotes', data?.receivingNotes);

    const isNumericId =
      typeof orderIdOrNumber === 'number' ||
      (!isNaN(Number(orderIdOrNumber)) && !String(orderIdOrNumber).includes('-'));

    const order = isNumericId
      ? await this.prisma.purchaseOrder.findUnique({
          where: { id: Number(orderIdOrNumber) },
          include: { items: true },
        })
      : await this.prisma.purchaseOrder.findFirst({
          where: { orderNumber: String(orderIdOrNumber).trim() },
          include: { items: true },
        });

    if (!order) {
      throw new NotFoundException(`Заказ "${orderIdOrNumber}" не найден`);
    }

    // Определяем дату фактического получения груза и дату проведения самой процедуры приемки
    const actualDate = data.actualDeliveryDate
      ? new Date(data.actualDeliveryDate)
      : order.actualDeliveryDate
      ? new Date(order.actualDeliveryDate)
      : new Date();
    const receivingDate = data.receivingDate ? new Date(data.receivingDate) : new Date();
    const actualDateStr = actualDate.toISOString().split('T')[0];
    const receivingDateStr = receivingDate.toISOString().split('T')[0];

    // Валидируем пропущенные документы: если документ пропущен, обязательно должна быть указана причина пользователя
    const skippedDocs = data.skippedDocuments ?? [];
    for (const skipped of skippedDocs) {
      this.validateNoPlaceholders('skippedDocuments.documentType', skipped.documentType);
      this.validateNoPlaceholders('skippedDocuments.reason', skipped.reason);
      if (!skipped.reason || !skipped.reason.trim()) {
        throw new BadRequestException(
          `Для пропуска документа "${skipped.documentType}" необходимо указать явную причину пользователя в поле reason`,
        );
      }
    }

    // Определяем, проводилась ли уже приемка по этому заказу ранее (режим корректировки / доприемки)
    const isOrderCorrection =
      order.status === PurchaseOrderStatus.RECEIVED ||
      order.status === PurchaseOrderStatus.PARTIALLY_RECEIVED ||
      order.items.some((i) => i.quantityReceived > 0);

    return this.prisma.$transaction(async (tx) => {
      const receiveItems = data.items ?? [];
      const updatedQuantitiesByItemId = new Map<number, number>();
      const eanVerifications: Array<{
        sku: string;
        orderEan: string | null;
        albaranEan: string | null;
        boxEan: string | null;
        matched: boolean;
        message: string;
      }> = [];
      const stockAdjustments: Array<{
        sku: string;
        isItemCorrection: boolean;
        prevQuantityReceived: number;
        newQuantityReceived: number;
        prevSvh: number;
        newSvh: number;
        deltaSvh: number;
        prevMain: number;
        newMain: number;
        deltaMain: number;
      }> = [];
      const warnings: string[] = [];

      // Обрабатываем каждую переданную позицию (поштучная приемка или корректировка позиции)
      for (const receiveItem of receiveItems) {
        this.validateNoPlaceholders('items.sku', receiveItem.sku);
        const existingItem = order.items.find(
          (i) => i.sku.toUpperCase() === receiveItem.sku.trim().toUpperCase(),
        );
        if (!existingItem) {
          throw new BadRequestException(
            `Артикул "${receiveItem.sku}" не найден в составе заказа ${order.orderNumber}`,
          );
        }

        // Проверяем, принималась ли данная позиция ранее
        const prevMovements =
          (await tx.stockMovement.findMany({
            where: {
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
            },
          })) || [];

        const isItemCorrection = existingItem.quantityReceived > 0 || prevMovements.length > 0;

        // Вычисляем, сколько штук этой позиции уже было зачислено на СВХ и MAIN в рамках данного заказа
        let prevSvh = 0;
        let prevMain = 0;
        if (prevMovements.length > 0) {
          for (const mov of prevMovements) {
            if (mov.toWarehouse === WarehouseLocation.SVH) prevSvh += mov.quantity;
            if (mov.fromWarehouse === WarehouseLocation.SVH) prevSvh -= mov.quantity;
            if (mov.toWarehouse === WarehouseLocation.MAIN) prevMain += mov.quantity;
            if (mov.fromWarehouse === WarehouseLocation.MAIN) prevMain -= mov.quantity;
          }
          prevSvh = Math.max(0, prevSvh);
          prevMain = Math.max(0, prevMain);
        } else if (existingItem.quantityReceived > 0) {
          // Фолбэк для записей без детализации в StockMovement
          prevSvh = Math.min(3, existingItem.quantityReceived);
          prevMain = Math.max(0, existingItem.quantityReceived - prevSvh);
        }

        // 1. Обязательная тройная сверка EAN: Заказ в БД <-> Albarán <-> Коробка товара
        const orderEan = existingItem.ean ? existingItem.ean.trim() : null;
        const albaranEan = receiveItem.eanAlbaran ? receiveItem.eanAlbaran.trim() : null;
        const boxEan = receiveItem.eanBox ? receiveItem.eanBox.trim() : null;
        let eanNoteFragment: string | null = null;

        if (albaranEan !== null || boxEan !== null || receiveItem.eanVerified !== undefined) {
          const comparedValues = [orderEan, albaranEan, boxEan].filter((v): v is string => Boolean(v));
          const uniqueValues = Array.from(new Set(comparedValues));
          const isMatched =
            receiveItem.eanVerified === false
              ? false
              : uniqueValues.length <= 1 && (comparedValues.length > 0 || receiveItem.eanVerified === true);

          if (isMatched) {
            const confirmedEan = orderEan || boxEan || albaranEan || 'подтвержден';
            const msg = `✅ Тройная сверка EAN пройдена (Заказ = Albarán = Коробка: ${confirmedEan})`;
            eanNoteFragment = msg;
            eanVerifications.push({
              sku: existingItem.sku,
              orderEan,
              albaranEan: albaranEan ?? orderEan,
              boxEan: boxEan ?? orderEan,
              matched: true,
              message: msg,
            });
          } else {
            const msg = `⚠️ НЕСООТВЕТСТВИЕ EAN по SKU ${existingItem.sku}: Заказ=${orderEan ?? 'нет'}, Albarán=${albaranEan ?? 'не указан'}, Коробка=${boxEan ?? 'не указан'}`;
            eanNoteFragment = msg;
            warnings.push(msg);
            eanVerifications.push({
              sku: existingItem.sku,
              orderEan,
              albaranEan,
              boxEan,
              matched: false,
              message: msg,
            });
          }
        }

        // Проверяем расхождение по количеству
        if (receiveItem.quantityReceived !== existingItem.quantityOrdered) {
          warnings.push(
            `⚠️ Расхождение количества по SKU ${existingItem.sku}: заказано ${existingItem.quantityOrdered} шт, фактически принято ${receiveItem.quantityReceived} шт`,
          );
        }

        // 2. Сохраняем фотографии конкретного айтема с разных сторон (привязанные к позиции purchaseOrderItemId)
        const itemDocs = receiveItem.documents ?? [];
        const savedItemPhotoLabels: string[] = [];
        for (const itemDoc of itemDocs) {
          this.validateNoPlaceholders('item.documents.filePath', itemDoc.filePath);
          const docType = itemDoc.documentType ?? OrderDocumentType.RECEIVING_PHOTO;
          await tx.orderDocument.create({
            data: {
              distributorId: order.distributorId,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              documentType: docType,
              fileName: itemDoc.fileName,
              filePath: itemDoc.filePath,
              fileSize: itemDoc.fileSize,
              mimeType: itemDoc.mimeType,
              notes: itemDoc.notes ?? `Фото позиции SKU ${existingItem.sku} при приемке`,
            },
          });
          savedItemPhotoLabels.push(
            `${itemDoc.fileName}${itemDoc.notes ? ` (${itemDoc.notes})` : ''}`,
          );
        }

        // 3. Формируем комментарий приемки позиции (включая комментарий пользователя, сверку EAN и список фото с разных сторон)
        const rawUserItemNote = receiveItem.itemNotes ?? receiveItem.notes;
        const itemNoteParts: string[] = [];
        if (rawUserItemNote && rawUserItemNote.trim()) {
          itemNoteParts.push(rawUserItemNote.trim());
        }
        if (eanNoteFragment && (!rawUserItemNote || !rawUserItemNote.includes(eanNoteFragment))) {
          itemNoteParts.push(eanNoteFragment);
        }
        if (savedItemPhotoLabels.length > 0) {
          itemNoteParts.push(`Фото айтема (${savedItemPhotoLabels.length} шт): ${savedItemPhotoLabels.join('; ')}`);
        }

        let finalItemNotes: string | null | undefined =
          itemNoteParts.length > 0 ? itemNoteParts.join(' | ') : existingItem.notes;

        // Если это повторная корректировка и ранее уже был записан другой комментарий — сохраняем историю корректировки
        if (
          isItemCorrection &&
          existingItem.notes &&
          itemNoteParts.length > 0 &&
          existingItem.notes !== finalItemNotes &&
          !finalItemNotes?.includes(existingItem.notes)
        ) {
          finalItemNotes = `${existingItem.notes} | [Корректировка ${receivingDateStr}]: ${itemNoteParts.join(' | ')}`;
        }

        // При корректировке сохраняем ранее введенные габариты, если новые не были переданы
        const nextLengthCm =
          receiveItem.packageLengthCm !== undefined ? receiveItem.packageLengthCm : existingItem.packageLengthCm;
        const nextWidthCm =
          receiveItem.packageWidthCm !== undefined ? receiveItem.packageWidthCm : existingItem.packageWidthCm;
        const nextHeightCm =
          receiveItem.packageHeightCm !== undefined ? receiveItem.packageHeightCm : existingItem.packageHeightCm;
        const nextWeightG =
          receiveItem.packageWeightG !== undefined ? receiveItem.packageWeightG : existingItem.packageWeightG;

        // Обновляем принятое количество, габариты и комментарий позиции заказа
        await tx.purchaseOrderItem.update({
          where: { id: existingItem.id },
          data: {
            quantityReceived: receiveItem.quantityReceived,
            packageLengthCm: nextLengthCm,
            packageWidthCm: nextWidthCm,
            packageHeightCm: nextHeightCm,
            packageWeightG: nextWeightG,
            notes: finalItemNotes,
          },
        });

        updatedQuantitiesByItemId.set(existingItem.id, receiveItem.quantityReceived);

        // 4. Распределение по складам и дельта-корректировка:
        // По дефолту на СВХ выделяется до 3 штук (или всё количество, если меньше 3),
        // а остальное количество направляется на основной склад MAIN.
        const targetSvh =
          receiveItem.svhQuantity !== undefined
            ? receiveItem.svhQuantity
            : Math.min(3, receiveItem.quantityReceived);
        const targetMain =
          receiveItem.mainQuantity !== undefined
            ? receiveItem.mainQuantity
            : Math.max(0, receiveItem.quantityReceived - targetSvh);

        // Вычисляем дельту относительно уже оприходованного по этому заказу количества
        const deltaSvh = targetSvh - prevSvh;
        const deltaMain = targetMain - prevMain;

        stockAdjustments.push({
          sku: existingItem.sku,
          isItemCorrection,
          prevQuantityReceived: existingItem.quantityReceived,
          newQuantityReceived: receiveItem.quantityReceived,
          prevSvh,
          newSvh: targetSvh,
          deltaSvh,
          prevMain,
          newMain: targetMain,
          deltaMain,
        });

        // 4.1. Обновление остатка на складе СВХ (SVH) строго на величину deltaSvh
        if (deltaSvh > 0) {
          await tx.warehouseStock.upsert({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.SVH,
                sku: existingItem.sku,
              },
            },
            create: {
              warehouse: WarehouseLocation.SVH,
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              title: existingItem.title,
              quantity: deltaSvh,
              minStockAlert: 1, // По дефолту порог предупреждения для СВХ равен 1 шт
            },
            update: {
              quantity: { increment: deltaSvh },
              asinId: existingItem.asinId ?? undefined,
            },
          });

          await tx.stockMovement.create({
            data: {
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              toWarehouse: WarehouseLocation.SVH,
              type: isItemCorrection ? StockMovementType.ADJUSTMENT : StockMovementType.RECEIPT,
              quantity: deltaSvh,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              notes: isItemCorrection
                ? `Корректировка приемки поставки ${order.orderNumber}: +${deltaSvh} шт на СВХ (было ${prevSvh} -> стало ${targetSvh})`
                : `Приемка поставки ${order.orderNumber}: оприходовано на СВХ`,
            },
          });
        } else if (deltaSvh < 0) {
          const absDeltaSvh = Math.abs(deltaSvh);
          await tx.warehouseStock.upsert({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.SVH,
                sku: existingItem.sku,
              },
            },
            create: {
              warehouse: WarehouseLocation.SVH,
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              title: existingItem.title,
              quantity: 0,
              minStockAlert: 1,
            },
            update: {
              quantity: { decrement: absDeltaSvh },
              asinId: existingItem.asinId ?? undefined,
            },
          });

          await tx.stockMovement.create({
            data: {
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              fromWarehouse: WarehouseLocation.SVH,
              type: StockMovementType.ADJUSTMENT,
              quantity: absDeltaSvh,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              notes: `Корректировка приемки поставки ${order.orderNumber}: списание ${absDeltaSvh} шт со склада СВХ (было ${prevSvh} -> стало ${targetSvh})`,
            },
          });
        }

        // 4.2. Обновление остатка на Основном складе (MAIN) строго на величину deltaMain
        if (deltaMain > 0) {
          await tx.warehouseStock.upsert({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.MAIN,
                sku: existingItem.sku,
              },
            },
            create: {
              warehouse: WarehouseLocation.MAIN,
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              title: existingItem.title,
              quantity: deltaMain,
              minStockAlert: 0,
            },
            update: {
              quantity: { increment: deltaMain },
              asinId: existingItem.asinId ?? undefined,
            },
          });

          await tx.stockMovement.create({
            data: {
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              toWarehouse: WarehouseLocation.MAIN,
              type: isItemCorrection ? StockMovementType.ADJUSTMENT : StockMovementType.RECEIPT,
              quantity: deltaMain,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              notes: isItemCorrection
                ? `Корректировка приемки поставки ${order.orderNumber}: +${deltaMain} шт на склад MAIN (было ${prevMain} -> стало ${targetMain})`
                : `Приемка поставки ${order.orderNumber}: оприходовано на Основной склад (MAIN)`,
            },
          });
        } else if (deltaMain < 0) {
          const absDeltaMain = Math.abs(deltaMain);
          await tx.warehouseStock.upsert({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.MAIN,
                sku: existingItem.sku,
              },
            },
            create: {
              warehouse: WarehouseLocation.MAIN,
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              title: existingItem.title,
              quantity: 0,
              minStockAlert: 0,
            },
            update: {
              quantity: { decrement: absDeltaMain },
              asinId: existingItem.asinId ?? undefined,
            },
          });

          await tx.stockMovement.create({
            data: {
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              fromWarehouse: WarehouseLocation.MAIN,
              type: StockMovementType.ADJUSTMENT,
              quantity: absDeltaMain,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              notes: `Корректировка приемки поставки ${order.orderNumber}: списание ${absDeltaMain} шт со склада MAIN (было ${prevMain} -> стало ${targetMain})`,
            },
          });
        }
      }

      // 5. Сохраняем прикрепленные к заказу документы и фотографии всей партии (Albarán, Factura, фото общих коробок)
      const savedBatchDocLabels: string[] = [];
      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          this.validateNoPlaceholders('documents.filePath', doc.filePath);
          // Если передан sku в документе, автоматически находим соответствующий purchaseOrderItemId
          let resolvedItemId = doc.purchaseOrderItemId;
          if (!resolvedItemId && doc.sku) {
            const matchedItem = order.items.find(
              (i) => i.sku.toUpperCase() === doc.sku!.trim().toUpperCase(),
            );
            if (matchedItem) {
              resolvedItemId = matchedItem.id;
            }
          }

          await tx.orderDocument.create({
            data: {
              distributorId: order.distributorId,
              purchaseOrderId: order.id,
              purchaseOrderItemId: resolvedItemId,
              documentType: doc.documentType,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType,
              notes: doc.notes,
            },
          });
          savedBatchDocLabels.push(
            `[${doc.documentType}] ${doc.fileName}${doc.notes ? ` (${doc.notes})` : ''}`,
          );
        }
      }

      // 6. Определяем итоговый статус заказа по всем его позициям (RECEIVED / PARTIALLY_RECEIVED / текущий)
      let allFullyReceived = order.items.length > 0;
      let anyItemReceived = false;
      for (const orderItem of order.items) {
        const effectiveQty = updatedQuantitiesByItemId.has(orderItem.id)
          ? updatedQuantitiesByItemId.get(orderItem.id)!
          : orderItem.quantityReceived;
        if (effectiveQty > 0) {
          anyItemReceived = true;
        }
        if (effectiveQty < orderItem.quantityOrdered) {
          allFullyReceived = false;
        }
      }

      const nextOrderStatus = allFullyReceived
        ? PurchaseOrderStatus.RECEIVED
        : anyItemReceived || receiveItems.length > 0
        ? PurchaseOrderStatus.PARTIALLY_RECEIVED
        : order.status;

      // 7. Формируем сводный комментарий приемки заказа (включая даты получения и приемки, пропущенные документы, фото и выявленные моменты)
      const hasExtendedReceivingMetadata =
        Boolean(data.receivingDate) ||
        Boolean(data.receivingNotes) ||
        skippedDocs.length > 0 ||
        eanVerifications.some((v) => !v.matched) ||
        isOrderCorrection;

      let finalOrderNotes = data.notes ?? order.notes;
      if (hasExtendedReceivingMetadata) {
        const summaryParts: string[] = [];
        const headerLabel = isOrderCorrection
          ? `[КОРРЕКТИРОВКА ПРИЕМКИ от ${receivingDateStr} (получено: ${actualDateStr})]`
          : `[ПРИЕМКА ПАРТИИ от ${receivingDateStr} (получено: ${actualDateStr})]`;
        summaryParts.push(headerLabel);

        const userBatchNote = data.receivingNotes ?? data.notes;
        if (userBatchNote && userBatchNote.trim()) {
          summaryParts.push(`Комментарий: ${userBatchNote.trim()}`);
        }
        if (skippedDocs.length > 0) {
          const skippedText = skippedDocs
            .map((s) => `${s.documentType} (причина пропуска: ${s.reason.trim()})`)
            .join('; ');
          summaryParts.push(`Пропущенные документы: ${skippedText}`);
        }
        if (savedBatchDocLabels.length > 0) {
          summaryParts.push(`Прикрепленные фото/документы: ${savedBatchDocLabels.join('; ')}`);
        }
        if (warnings.length > 0) {
          summaryParts.push(`Выявленные моменты: ${warnings.join('; ')}`);
        }

        const formattedBlock = summaryParts.join(' | ');
        if (order.notes && !formattedBlock.includes(order.notes)) {
          finalOrderNotes = `${order.notes}\n${formattedBlock}`;
        } else {
          finalOrderNotes = formattedBlock;
        }
      }

      // Обновляем заказ в БД
      const updatedOrder = await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: nextOrderStatus,
          actualDeliveryDate: actualDate,
          notes: finalOrderNotes,
        },
      });

      return {
        ...updatedOrder,
        receivingSummary: {
          isCorrection: isOrderCorrection,
          actualDeliveryDate: actualDate.toISOString(),
          receivingDate: receivingDate.toISOString(),
          skippedDocuments: skippedDocs,
          eanVerifications,
          stockAdjustments,
          warnings,
        },
      };
    });
  }

  /**
   * Прикрепить документ или фотографию к заказу или конкретной позиции (по purchaseOrderItemId или sku)
   */
  async attachDocument(
    orderIdOrNumber: number | string,
    doc: {
      documentType: OrderDocumentType;
      fileName: string;
      filePath: string;
      fileSize?: number;
      mimeType?: string;
      notes?: string;
      purchaseOrderItemId?: number;
      sku?: string;
    },
  ) {
    this.validateNoPlaceholders('orderId', orderIdOrNumber);
    this.validateNoPlaceholders('fileName', doc?.fileName);
    this.validateNoPlaceholders('filePath', doc?.filePath);
    this.validateNoPlaceholders('sku', doc?.sku);

    const isNumericId =
      typeof orderIdOrNumber === 'number' ||
      (!isNaN(Number(orderIdOrNumber)) && !String(orderIdOrNumber).includes('-'));

    const order = isNumericId
      ? await this.prisma.purchaseOrder.findUnique({
          where: { id: Number(orderIdOrNumber) },
          include: { items: true },
        })
      : await this.prisma.purchaseOrder.findFirst({
          where: { orderNumber: String(orderIdOrNumber).trim() },
          include: { items: true },
        });
    if (!order) {
      throw new NotFoundException(`Заказ "${orderIdOrNumber}" не найден`);
    }

    // Если передан артикул sku вместо числового purchaseOrderItemId — автоматически находим ID позиции
    let resolvedItemId = doc.purchaseOrderItemId;
    if (!resolvedItemId && doc.sku && order.items) {
      const matchedItem = order.items.find(
        (i) => i.sku.toUpperCase() === doc.sku!.trim().toUpperCase(),
      );
      if (!matchedItem) {
        throw new BadRequestException(
          `Артикул "${doc.sku}" не найден в составе заказа ${order.orderNumber}`,
        );
      }
      resolvedItemId = matchedItem.id;
    }

    const createdDoc = await this.prisma.orderDocument.create({
      data: {
        distributorId: order.distributorId,
        purchaseOrderId: order.id,
        purchaseOrderItemId: resolvedItemId,
        documentType: doc.documentType,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        notes: doc.notes,
      },
    });

    // Если прикреплен финансовый документ (INVOICE или PAYMENT_RECEIPT), пересчитываем статус Taxfix
    const updatedOrderWithDocs = await this.prisma.purchaseOrder.findUnique({
      where: { id: order.id },
      include: { distributor: true, documents: true },
    });

    const taxfixCompliance = updatedOrderWithDocs
      ? this.computeTaxfixCompliance(updatedOrderWithDocs)
      : undefined;

    return {
      ...createdDoc,
      taxfixCompliance,
    };
  }

  /**
   * Получить сводный реестр всех заказов с проверкой загрузки фактур и банковских оплат в сервис Taxfix
   */
  async getTaxfixStatusList(filters?: { onlyPending?: boolean; distributor?: string | number }) {
    const orders = await this.getOrders({ distributor: filters?.distributor });
    const items = orders.map((order) => {
      const compliance = this.computeTaxfixCompliance(order);
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        status: order.status,
        totalGross: order.totalGross,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        supplier: order.distributor,
        taxfixCompliance: compliance,
      };
    });

    const filteredItems = filters?.onlyPending
      ? items.filter((item) => !item.taxfixCompliance.isCompliant)
      : items;

    return {
      totalOrders: filteredItems.length,
      completedCount: filteredItems.filter((i) => i.taxfixCompliance.isCompliant).length,
      pendingCount: filteredItems.filter((i) => !i.taxfixCompliance.isCompliant).length,
      missingInvoiceCount: filteredItems.filter((i) => !i.taxfixCompliance.hasInvoice).length,
      missingPaymentReceiptCount: filteredItems.filter((i) => !i.taxfixCompliance.hasPaymentReceipt).length,
      pendingTaxfixUploadCount: filteredItems.filter((i) => !i.taxfixCompliance.uploadedToTaxfix).length,
      pendingTaxfixLinkCount: filteredItems.filter((i) => !i.taxfixCompliance.paymentLinkedInTaxfix).length,
      orders: filteredItems,
    };
  }

  /**
   * Загрузить фактуру (INVOICE), факт оплаты из банка (PAYMENT_RECEIPT) и/или обновить статус сверки в сервисе Taxfix
   */
  async updateTaxfixCompliance(
    orderIdOrNumber: number | string,
    data: {
      // Файл счета-фактуры поставщика (если прикрепляется при вызове)
      invoiceFile?: {
        fileName: string;
        filePath: string;
        fileSize?: number;
        mimeType?: string;
        invoiceNumber?: string;
        notes?: string;
      };
      // Файл подтверждения оплаты из банка (квитанция SEPA / выписка по карте / переводу)
      paymentReceiptFile?: {
        fileName: string;
        filePath: string;
        fileSize?: number;
        mimeType?: string;
        bankReference?: string;
        notes?: string;
      };
      // Отметка о загрузке фактуры в налоговый сервис Taxfix
      uploadedToTaxfix?: boolean;
      // Отметка о линковке фактуры с банковской оплатой внутри Taxfix
      paymentLinkedInTaxfix?: boolean;
      // Номер/референс банковской транзакции или способа оплаты
      bankReference?: string;
      // Обновление статуса оплаты заказа (PENDING / PAID)
      paymentStatus?: string;
      // Дополнительный комментарий по налоговому учету
      notes?: string;
    },
  ) {
    this.validateNoPlaceholders('orderId', orderIdOrNumber);
    if (data?.invoiceFile) {
      this.validateNoPlaceholders('invoiceFile.fileName', data.invoiceFile.fileName);
      this.validateNoPlaceholders('invoiceFile.filePath', data.invoiceFile.filePath);
    }
    if (data?.paymentReceiptFile) {
      this.validateNoPlaceholders('paymentReceiptFile.fileName', data.paymentReceiptFile.fileName);
      this.validateNoPlaceholders('paymentReceiptFile.filePath', data.paymentReceiptFile.filePath);
    }

    const isNumericId =
      typeof orderIdOrNumber === 'number' ||
      (!isNaN(Number(orderIdOrNumber)) && !String(orderIdOrNumber).includes('-'));

    const order = isNumericId
      ? await this.prisma.purchaseOrder.findUnique({
          where: { id: Number(orderIdOrNumber) },
          include: { distributor: true, documents: true },
        })
      : await this.prisma.purchaseOrder.findFirst({
          where: { orderNumber: String(orderIdOrNumber).trim() },
          include: { distributor: true, documents: true },
        });

    if (!order) {
      throw new NotFoundException(`Заказ "${orderIdOrNumber}" не найден`);
    }

    return this.prisma.$transaction(async (tx) => {
      const createdDocs: any[] = [];

      // 1. Если передан файл фактуры (INVOICE), сохраняем его в OrderDocument
      if (data?.invoiceFile) {
        const invNoteParts: string[] = [];
        if (data.invoiceFile.invoiceNumber) {
          invNoteParts.push(`Factura № ${data.invoiceFile.invoiceNumber}`);
        }
        if (data.invoiceFile.notes) {
          invNoteParts.push(data.invoiceFile.notes.trim());
        }
        const createdInvoice = await tx.orderDocument.create({
          data: {
            distributorId: order.distributorId,
            purchaseOrderId: order.id,
            documentType: OrderDocumentType.INVOICE,
            fileName: data.invoiceFile.fileName.trim(),
            filePath: data.invoiceFile.filePath.trim(),
            fileSize: data.invoiceFile.fileSize,
            mimeType: data.invoiceFile.mimeType ?? 'application/pdf',
            notes: invNoteParts.length > 0 ? invNoteParts.join(' | ') : 'Счет-фактура поставщика (Factura)',
          },
        });
        createdDocs.push(createdInvoice);
      }

      // 2. Если передан файл банковского подтверждения оплаты (PAYMENT_RECEIPT), сохраняем его в OrderDocument
      if (data?.paymentReceiptFile) {
        const payNoteParts: string[] = [];
        const bankRef = data.paymentReceiptFile.bankReference ?? data.bankReference;
        if (bankRef) {
          payNoteParts.push(`Банковская оплата: ${bankRef}`);
        }
        if (data.paymentReceiptFile.notes) {
          payNoteParts.push(data.paymentReceiptFile.notes.trim());
        }
        const createdReceipt = await tx.orderDocument.create({
          data: {
            distributorId: order.distributorId,
            purchaseOrderId: order.id,
            documentType: OrderDocumentType.PAYMENT_RECEIPT,
            fileName: data.paymentReceiptFile.fileName.trim(),
            filePath: data.paymentReceiptFile.filePath.trim(),
            fileSize: data.paymentReceiptFile.fileSize,
            mimeType: data.paymentReceiptFile.mimeType ?? 'application/pdf',
            notes:
              payNoteParts.length > 0
                ? payNoteParts.join(' | ')
                : 'Подтверждение оплаты из банка (Justificante de pago)',
          },
        });
        createdDocs.push(createdReceipt);
      }

      // 3. Вычисляем актуальные значения флагов Taxfix (сохраняя ранее установленные, если новые не переданы)
      const prevCompliance = this.computeTaxfixCompliance(order);
      const nextUploaded =
        data?.uploadedToTaxfix !== undefined ? data.uploadedToTaxfix : prevCompliance.uploadedToTaxfix;
      const nextLinked =
        data?.paymentLinkedInTaxfix !== undefined
          ? data.paymentLinkedInTaxfix
          : prevCompliance.paymentLinkedInTaxfix;
      const nextBankRef =
        data?.bankReference ??
        data?.paymentReceiptFile?.bankReference ??
        prevCompliance.bankReference ??
        null;

      // Формируем структурированный тег [TAXFIX: ...] в примечании заказа
      const taxfixTagParts = [`UPLOADED=${nextUploaded}`, `LINKED=${nextLinked}`];
      if (nextBankRef) {
        taxfixTagParts.push(`REF=${nextBankRef}`);
      }
      const taxfixTag = `[TAXFIX: ${taxfixTagParts.join(', ')}]`;

      let cleanedNotes = (order.notes ?? '').replace(/\[TAXFIX:[^\]]*\]\s*/g, '').trim();
      if (data?.notes && data.notes.trim() && !cleanedNotes.includes(data.notes.trim())) {
        cleanedNotes = cleanedNotes ? `${cleanedNotes} | ${data.notes.trim()}` : data.notes.trim();
      }
      const finalOrderNotes = cleanedNotes ? `${cleanedNotes}\n${taxfixTag}` : taxfixTag;

      // Если прикреплен документ об оплате или слинкована оплата в Taxfix, статус оплаты заказа переходит в PAID
      const nextPaymentStatus =
        data?.paymentStatus ??
        (data?.paymentReceiptFile || nextLinked ? 'PAID' : order.paymentStatus);

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          notes: finalOrderNotes,
          paymentStatus: nextPaymentStatus,
        },
        include: {
          distributor: true,
          documents: true,
        },
      });

      const finalOrderForCompliance = {
        ...order,
        ...updatedOrder,
        notes: finalOrderNotes,
        paymentStatus: nextPaymentStatus,
        documents: [...(order.documents ?? []), ...createdDocs],
      };

      const taxfixCompliance = this.computeTaxfixCompliance(finalOrderForCompliance);

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: nextPaymentStatus,
        attachedDocumentsCount: createdDocs.length,
        taxfixCompliance,
      };
    });
  }
}
