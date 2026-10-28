import { Injectable } from '@nestjs/common';
import { KeepaProductService } from './keepa-product.service';
import { KeepaQueryService } from './keepa-query.service';
import { ProductFinderOptions, KEEPA_PRIORITY } from './keepa-queue.service';

/**
 * Единый фасадный сервис KeepaService для обеспечения обратной совместимости.
 * Делегирует вызовы в специализированные доменные сервисы:
 * - KeepaProductService: работа с товарами через /product и оптовой очередью
 * - KeepaQueryService: поиск каталогов через /query (Product Finder)
 */
@Injectable()
export class KeepaService {
  constructor(
    public readonly product: KeepaProductService,
    public readonly query: KeepaQueryService,
  ) {}

  // Делегирование методов товаров
  populateQueue() {
    return this.product.populateQueue();
  }

  calculateProductsBatchRequestLimit() {
    return this.product.calculateProductsBatchRequestLimit();
  }

  enqueueNextWholesaleAsins() {
    return this.product.enqueueNextWholesaleAsins();
  }

  processRawData() {
    return this.product.processRawData();
  }

  processRawProduct(asin: string, product: any) {
    return this.product.processRawProduct(asin, product);
  }

  calculateAmazonTier(lengthMm: number | null, widthMm: number | null, heightMm: number | null, weightG: number | null) {
    return this.product.calculateAmazonTier(lengthMm, widthMm, heightMm, weightG);
  }

  handleProductAsinsJob(job: any) {
    return this.product.handleProductAsinsJob(job);
  }

  // Делегирование методов поиска
  fetchAndSaveKeepaExportForCategory(categoryId: string, options?: ProductFinderOptions, priority: number = KEEPA_PRIORITY.NORMAL) {
    return this.query.fetchAndSaveKeepaExportForCategory(categoryId, options, priority);
  }

  fetchAndSaveKeepaExportForAllCategories(options?: Omit<ProductFinderOptions, 'domainId'>, priority: number = KEEPA_PRIORITY.NORMAL) {
    return this.query.fetchAndSaveKeepaExportForAllCategories(options, priority);
  }

  fetchAndSaveKeepaExportForBrand(brandId: number, brandName: string, options?: ProductFinderOptions, priority: number = KEEPA_PRIORITY.NORMAL) {
    return this.query.fetchAndSaveKeepaExportForBrand(brandId, brandName, options, priority);
  }

  fetchAndSaveKeepaExportForSeller(sellerId: string, options?: ProductFinderOptions, priority: number = KEEPA_PRIORITY.NORMAL) {
    return this.query.fetchAndSaveKeepaExportForSeller(sellerId, options, priority);
  }
}
