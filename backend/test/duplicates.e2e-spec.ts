import * as dotenv from 'dotenv';
dotenv.config();
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from './../src/prisma/prisma.service';
import { AppModule } from './../src/app.module';

describe('Проверка базы данных на дубликаты (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('не должно быть дубликатов брендов (без учета регистра)', async () => {
    const brands = await prisma.brand.findMany();
    
    const lowercaseNames = new Map<string, number[]>();
    for (const b of brands) {
      const key = b.name.trim().toLowerCase();
      if (!lowercaseNames.has(key)) {
        lowercaseNames.set(key, []);
      }
      lowercaseNames.get(key)!.push(b.id);
    }

    const duplicates: { name: string; ids: number[] }[] = [];
    for (const [name, ids] of lowercaseNames) {
      if (ids.length > 1) {
        duplicates.push({ name, ids });
      }
    }

    if (duplicates.length > 0) {
      console.error('Найдены дубликаты брендов:', duplicates);
    }
    
    expect(duplicates.length).toBe(0);
  });

  it('не должно быть дубликатов производителей (без учета регистра)', async () => {
    const manufacturers = await prisma.manufacturer.findMany();
    
    const lowercaseNames = new Map<string, number[]>();
    for (const m of manufacturers) {
      const key = m.name.trim().toLowerCase();
      if (!lowercaseNames.has(key)) {
        lowercaseNames.set(key, []);
      }
      lowercaseNames.get(key)!.push(m.id);
    }

    const duplicates: { name: string; ids: number[] }[] = [];
    for (const [name, ids] of lowercaseNames) {
      if (ids.length > 1) {
        duplicates.push({ name, ids });
      }
    }

    if (duplicates.length > 0) {
      console.error('Найдены дубликаты производителей:', duplicates);
    }
    
    expect(duplicates.length).toBe(0);
  });
  
  it('не должно быть дубликатов дистрибьюторов (без учета регистра)', async () => {
    const distributors = await prisma.distributor.findMany();
    
    const lowercaseNames = new Map<string, number[]>();
    for (const d of distributors) {
      const key = d.name.trim().toLowerCase();
      if (!lowercaseNames.has(key)) {
        lowercaseNames.set(key, []);
      }
      lowercaseNames.get(key)!.push(d.id);
    }

    const duplicates: { name: string; ids: number[] }[] = [];
    for (const [name, ids] of lowercaseNames) {
      if (ids.length > 1) {
        duplicates.push({ name, ids });
      }
    }

    if (duplicates.length > 0) {
      console.error('Найдены дубликаты дистрибьюторов:', duplicates);
    }
    
    expect(duplicates.length).toBe(0);
  });
});
