import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeManufacturerName } from './manufacturer-normalization';

/**
 * Сервис управления маппингом вариаций названий производителей из Keepa к каноническим записям в БД.
 * 
 * Отвечает за:
 * 1. Сопоставление сырых Keepa-названий и вариаций (с вендор-кодами, скобками и счетчиками) с каноническим производителем.
 * 2. Автоматическое наполнение таблицы маппинга (ManufacturerAlias) при появлении новых вариаций.
 * 3. Получение всех известных вариаций для передачи в UI фильтры Keepa.
 */
@Injectable()
export class ManufacturerMappingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Очищает сырую строку элемента выпадающего списка Keepa от счетчика товаров в скобках.
   * Например: "cofan (28234)" -> "COFAN", "cofan (cofb0) (7178)" -> "COFAN (COFB0)"
   */
  static cleanKeepaDropdownItem(str: string): string {
    if (!str) return '';
    // Отрезаем число в скобках на конце строки (счетчик товаров в интерфейсе Keepa)
    return str.replace(/\s*\(\d+\)$/, '').trim().toUpperCase();
  }

  /**
   * Резолвит канонического производителя по сырому названию из Keepa:
   * 1. Сначала ищет точное совпадение в таблице алиасов (ManufacturerAlias).
   * 2. Если алиас не найден, нормализует имя через normalizeManufacturerName (отрезает вендор-код, унифицирует правовые формы).
   * 3. Находит или создает канонического производителя (Manufacturer).
   * 4. Автоматически сохраняет новую вариацию в ManufacturerAlias, дополняя мапу.
   *
   * @param rawName Исходное название производителя из Keepa (например: "COFAN (COFB0)", "ALFA DYSER, S.L")
   * @param client Экземпляр PrismaClient или транзакции (опционально, по умолчанию this.prisma)
   */
  async resolveManufacturer(
    rawName: string,
    client: any = this.prisma
  ): Promise<{
    manufacturerId: number;
    canonicalName: string;
    isNewAlias: boolean;
  }> {
    const cleanedRaw = ManufacturerMappingService.cleanKeepaDropdownItem(rawName);
    if (!cleanedRaw) {
      throw new Error('Пустое или некорректное название производителя');
    }

    // 1. Проверяем наличие точного алиаса в таблице маппинга
    const existingAlias = await client.manufacturerAlias.findUnique({
      where: { rawName: cleanedRaw },
      include: { manufacturer: true },
    }).catch(() => null);

    if (existingAlias?.manufacturer) {
      return {
        manufacturerId: existingAlias.manufacturer.id,
        canonicalName: existingAlias.manufacturer.name,
        isNewAlias: false,
      };
    }

    // 2. Если алиаса нет, нормализуем название по бизнес-правилам
    const canonicalName = normalizeManufacturerName(cleanedRaw);
    if (!canonicalName) {
      throw new Error(`Не удалось нормализовать название производителя: "${rawName}"`);
    }

    // 3. Ищем существующего производителя по каноническому имени
    let manufacturer = await client.manufacturer.findUnique({
      where: { name: canonicalName },
    });

    // Если производителя еще нет в БД, создаем его
    if (!manufacturer) {
      manufacturer = await client.manufacturer.create({
        data: { name: canonicalName },
      });
    }

    // 4. Дополняем мапу вариаций: регистрируем новый алиас в ManufacturerAlias
    try {
      await client.manufacturerAlias.create({
        data: {
          rawName: cleanedRaw,
          manufacturerId: manufacturer.id,
        },
      });
    } catch {
      // Игнорируем ошибку уникальности, если алиас был параллельно создан другим процессом
    }

    return {
      manufacturerId: manufacturer.id,
      canonicalName: manufacturer.name,
      isNewAlias: true,
    };
  }

  /**
   * Возвращает список всех известных вариаций (алиасов) для указанного канонического производителя.
   * Используется при составлении фильтров для выгрузки из Keepa Finder.
   *
   * @param canonicalName Каноническое название производителя (например: "COFAN", "ALFA DYSER, S.L.")
   * @param client Экземпляр PrismaClient или транзакции
   */
  async getKnownAliases(
    canonicalName: string,
    client: any = this.prisma
  ): Promise<string[]> {
    const upperName = canonicalName.trim().toUpperCase();
    const manufacturer = await client.manufacturer.findUnique({
      where: { name: upperName },
      include: { aliases: true },
    });

    if (!manufacturer) {
      return [upperName];
    }

    const aliases = manufacturer.aliases.map((a: any) => a.rawName);
    if (!aliases.includes(manufacturer.name)) {
      aliases.unshift(manufacturer.name);
    }

    return aliases;
  }

  /**
   * Вручную связывает сырую вариацию Keepa с каноническим производителем.
   *
   * @param canonicalName Каноническое имя производителя в БД
   * @param rawVariation Сырая вариация из Keepa
   * @param client Экземпляр PrismaClient или транзакции
   */
  async addAlias(
    canonicalName: string,
    rawVariation: string,
    client: any = this.prisma
  ): Promise<void> {
    const cleanedRaw = ManufacturerMappingService.cleanKeepaDropdownItem(rawVariation);
    const upperCanonical = canonicalName.trim().toUpperCase();

    let manufacturer = await client.manufacturer.findUnique({
      where: { name: upperCanonical },
    });

    if (!manufacturer) {
      manufacturer = await client.manufacturer.create({
        data: { name: upperCanonical },
      });
    }

    await client.manufacturerAlias.upsert({
      where: { rawName: cleanedRaw },
      update: { manufacturerId: manufacturer.id },
      create: {
        rawName: cleanedRaw,
        manufacturerId: manufacturer.id,
      },
    });
  }
}
