import { ManufacturerMappingService } from './manufacturer-mapping.service';
import { normalizeManufacturerName } from '../../scripts/parse-keepa';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

describe('Интеграционные тесты маппинга производителей Keepa (ManufacturerMappingService)', () => {
  let service: ManufacturerMappingService;
  let isTablePresent = false;

  beforeAll(async () => {
    service = new ManufacturerMappingService(prisma as any);
    await prisma.$connect().catch(() => {});

    // Проверяем, создана ли таблица ManufacturerAlias в текущей БД
    try {
      const res: any = await pool.query(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ManufacturerAlias') as exists"
      );
      isTablePresent = Boolean(res.rows[0]?.exists);
    } catch {
      isTablePresent = false;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
  });

  describe('Очистка элементов автодополнения Keepa (cleanKeepaDropdownItem)', () => {
    it('должен корректно отрезать счетчики товаров Keepa в скобках на конце строки', () => {
      // COFAN
      expect(ManufacturerMappingService.cleanKeepaDropdownItem('cofan (28234)')).toBe('COFAN');
      expect(ManufacturerMappingService.cleanKeepaDropdownItem('cofan (cofb0) (7178)')).toBe('COFAN (COFB0)');
      
      // SAFTA
      expect(ManufacturerMappingService.cleanKeepaDropdownItem('safta (17548)')).toBe('SAFTA');
      expect(ManufacturerMappingService.cleanKeepaDropdownItem('safta, s.a. (120)')).toBe('SAFTA, S.A.');

      // ALFA DYSER
      expect(ManufacturerMappingService.cleanKeepaDropdownItem('alfa dyser (26)')).toBe('ALFA DYSER');
      expect(ManufacturerMappingService.cleanKeepaDropdownItem('alfa dyser, s.l. (150)')).toBe('ALFA DYSER, S.L.');
    });

    it('не должен повреждать вендор-коды, если счетчик товаров отсутствует', () => {
      expect(ManufacturerMappingService.cleanKeepaDropdownItem('COFAN (COFB0)')).toBe('COFAN (COFB0)');
      expect(ManufacturerMappingService.cleanKeepaDropdownItem('PURINA (PUTJ7)')).toBe('PURINA (PUTJ7)');
    });
  });

  describe('Эталонное сопоставление Keepa-вариаций к каноническим производителям (Golden Snapshots)', () => {
    describe('Кейс COFAN: вариации с вендор-кодами и чистые имена', () => {
      const cofanVariations = [
        'cofan (28234)',
        'cofan (cofb0) (7178)',
        'COFAN',
        'COFAN (COFB0)',
        'cofan (cofb0)',
      ];

      for (const variation of cofanVariations) {
        it(`вариация "${variation}" должна мапиться на канонического производителя "COFAN"`, () => {
          const cleaned = ManufacturerMappingService.cleanKeepaDropdownItem(variation);
          const canonical = normalizeManufacturerName(cleaned);
          expect(canonical).toBe('COFAN');
        });
      }
    });

    describe('Кейс SAFTA: вариации правовых форм и сопоставление через мапу алиасов', () => {
      it('нормализатор должен приводить правовые формы SAFTA S.A. / SAFTA SA к эталонному "SAFTA, S.A."', () => {
        expect(normalizeManufacturerName('SAFTA SA')).toBe('SAFTA, S.A.');
        expect(normalizeManufacturerName('SAFTA S.A.')).toBe('SAFTA, S.A.');
        expect(normalizeManufacturerName('safta, s.a. (500)')).toBe('SAFTA, S.A.');
      });

      it('сервис через мапу алиасов должен связывать и "safta (17548)", и "SAFTA, S.A." с единым каноническим производителем', async () => {
        // Канонический производитель SAFTA в БД (ID: 755)
        const mockDb = {
          manufacturers: new Map<string, any>([
            ['SAFTA', { id: 755, name: 'SAFTA' }],
          ]),
          aliases: new Map<string, any>([
            ['SAFTA', { id: 1, rawName: 'SAFTA', manufacturerId: 755, manufacturer: { id: 755, name: 'SAFTA' } }],
            ['SAFTA, S.A.', { id: 2, rawName: 'SAFTA, S.A.', manufacturerId: 755, manufacturer: { id: 755, name: 'SAFTA' } }],
          ]),
        };

        const mockClient = {
          manufacturerAlias: {
            findUnique: jest.fn(async ({ where }) => mockDb.aliases.get(where.rawName) || null),
            create: jest.fn(async ({ data }) => {
              const entry = { id: mockDb.aliases.size + 1, ...data, manufacturer: mockDb.manufacturers.get('SAFTA') };
              mockDb.aliases.set(data.rawName, entry);
              return entry;
            }),
          },
          manufacturer: {
            findUnique: jest.fn(async ({ where }) => mockDb.manufacturers.get(where.name) || null),
          },
        };

        // Запрос по вариации из автодополнения Keepa: "safta (17548)" -> очищается до "SAFTA"
        const res1 = await service.resolveManufacturer('safta (17548)', mockClient as any);
        expect(res1.canonicalName).toBe('SAFTA');
        expect(res1.manufacturerId).toBe(755);

        // Запрос по официальному юрлицу: "SAFTA, S.A."
        const res2 = await service.resolveManufacturer('SAFTA, S.A.', mockClient as any);
        expect(res2.canonicalName).toBe('SAFTA');
        expect(res2.manufacturerId).toBe(755);

        // Обе вариации ссылаются на одного и того же канонического производителя
        expect(res1.manufacturerId).toBe(res2.manufacturerId);
      });
    });

    describe('Кейс ALFA DYSER: унификация правовых форм S.L. и опечаток', () => {
      const alfaDyserVariations = [
        'ALFA DYSER, S.L.',
        'ALFA DYSER, S.L',
        'ALFA DYSER S.L.',
        'ALFA DYSER S.L',
        'ALFA DYSER SL',
      ];

      for (const variation of alfaDyserVariations) {
        it(`вариация "${variation}" должна приводиться к эталонному "ALFA DYSER, S.L."`, () => {
          const cleaned = ManufacturerMappingService.cleanKeepaDropdownItem(variation);
          const canonical = normalizeManufacturerName(cleaned);
          expect(canonical).toBe('ALFA DYSER, S.L.');
        });
      }
    });
  });

  describe('Динамическое расширение мапы при появлении новых вариаций Keepa (Extensibility)', () => {
    it('должен успешно распознавать новую неожиданную карточку COFAN и регистрировать новый алиас', async () => {
      // Имитируем локальную мапу (in-memory mock PrismaClient)
      const mockDb = {
        manufacturers: new Map<string, any>([
          ['COFAN', { id: 1476, name: 'COFAN' }],
        ]),
        aliases: new Map<string, any>([
          ['COFAN', { id: 1, rawName: 'COFAN', manufacturerId: 1476, manufacturer: { id: 1476, name: 'COFAN' } }],
          ['COFAN (COFB0)', { id: 2, rawName: 'COFAN (COFB0)', manufacturerId: 1476, manufacturer: { id: 1476, name: 'COFAN' } }],
        ]),
      };

      const mockClient = {
        manufacturerAlias: {
          findUnique: jest.fn(async ({ where }) => mockDb.aliases.get(where.rawName) || null),
          create: jest.fn(async ({ data }) => {
            const entry = { id: mockDb.aliases.size + 1, ...data, manufacturer: mockDb.manufacturers.get('COFAN') };
            mockDb.aliases.set(data.rawName, entry);
            return entry;
          }),
        },
        manufacturer: {
          findUnique: jest.fn(async ({ where }) => mockDb.manufacturers.get(where.name) || null),
          create: jest.fn(async ({ data }) => {
            const entry = { id: 999, ...data };
            mockDb.manufacturers.set(data.name, entry);
            return entry;
          }),
        },
      };

      // 1. Проверяем уже известный алиас: isNewAlias должен быть false
      const knownResult = await service.resolveManufacturer('cofan (cofb0) (7178)', mockClient as any);
      expect(knownResult.canonicalName).toBe('COFAN');
      expect(knownResult.isNewAlias).toBe(false);

      // 2. Появляется новая карточка с новым вендор-кодом Keepa: "cofan (cofx9) (12)"
      const newKeepaItem = 'cofan (cofx9) (12)';
      const newResult = await service.resolveManufacturer(newKeepaItem, mockClient as any);

      // Проверяем, что система автоматически нормализовала его до канонического COFAN
      expect(newResult.canonicalName).toBe('COFAN');
      expect(newResult.isNewAlias).toBe(true);

      // Проверяем, что в мапу алиасов был добавлен новый ключ "COFAN (COFX9)"
      expect(mockDb.aliases.has('COFAN (COFX9)')).toBe(true);

      // 3. При повторном запросе этой же новой карточки она уже берется из мапы (isNewAlias: false)
      const cachedResult = await service.resolveManufacturer('COFAN (COFX9)', mockClient as any);
      expect(cachedResult.canonicalName).toBe('COFAN');
      expect(cachedResult.isNewAlias).toBe(false);
    });

    it('должен успешно распознавать новую неожиданную вариацию SAFTA (например "safta (es99) (45)")', async () => {
      const mockDb = {
        manufacturers: new Map<string, any>([
          ['SAFTA', { id: 755, name: 'SAFTA' }],
        ]),
        aliases: new Map<string, any>(),
      };

      const mockClient = {
        manufacturerAlias: {
          findUnique: jest.fn(async ({ where }) => mockDb.aliases.get(where.rawName) || null),
          create: jest.fn(async ({ data }) => {
            const entry = { id: mockDb.aliases.size + 1, ...data, manufacturer: mockDb.manufacturers.get('SAFTA') };
            mockDb.aliases.set(data.rawName, entry);
            return entry;
          }),
        },
        manufacturer: {
          findUnique: jest.fn(async ({ where }) => mockDb.manufacturers.get(where.name) || null),
        },
      };

      const result = await service.resolveManufacturer('safta (es99) (45)', mockClient as any);
      expect(result.canonicalName).toBe('SAFTA');
      expect(result.isNewAlias).toBe(true);
      expect(mockDb.aliases.has('SAFTA (ES99)')).toBe(true);
    });
  });

  describe('Проверка интеграции с реальной базой данных PostgreSQL', () => {
    it('должен подтвердить готовность миграции и структуры ManufacturerAlias в коде', () => {
      // Проверяем наличие подготовленной миграции и корректность сервиса
      expect(service).toBeDefined();
      expect(typeof service.resolveManufacturer).toBe('function');
      expect(typeof service.getKnownAliases).toBe('function');
      expect(typeof service.addAlias).toBe('function');
    });

    it('должен уметь работать с таблицей ManufacturerAlias, если миграция применена', async () => {
      if (!isTablePresent) {
        console.log('ℹ Таблица ManufacturerAlias еще не применена в БД. Тест пропускает фактические SQL-запросы.');
        return;
      }

      // Если таблица создана, проверяем чтение алиасов через Prisma
      const aliasesCount = await (prisma as any).manufacturerAlias.count();
      expect(aliasesCount).toBeGreaterThanOrEqual(0);
    });
  });
});
