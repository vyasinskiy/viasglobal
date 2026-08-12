import fs from 'node:fs';
import * as xlsx from 'xlsx';

// Интерфейс для хранения данных о бренде и связанных с ним позициях
export interface BrandData {
  brand: string;
  items: string[];
}

// Главная функция для извлечения брендов и их позиций из Excel-файла
export function extractBrands(filePath: string): BrandData[] {
  // Проверяем, существует ли переданный файл по указанному пути
  if (!fs.existsSync(filePath)) {
    console.error(`Ошибка: Файл ${filePath} не найден.`);
    process.exit(1);
  }

  try {
    // Читаем Excel-файл с помощью библиотеки xlsx
    const workbook = xlsx.readFile(filePath);
    
    // Получаем имя первого листа в книге
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Excel файл не содержит листов.");
    
    // Получаем объект самого листа по его имени
    const sheet = workbook.Sheets[sheetName];
    
    // Конвертируем данные листа в массив объектов (ключи - заголовки столбцов)
    // Параметр defval: '' гарантирует, что пустые ячейки тоже попадут в объект
    const data = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    
    // Если массив пустой, значит файл не содержит данных
    if (data.length === 0) {
      console.error("Ошибка: Файл пуст или имеет неверный формат.");
      process.exit(1);
    }
    
    // Извлекаем все ключи (заголовки колонок) из первой строки данных
    const keys = Object.keys(data[0] || {});
    
    // Вспомогательная функция для поиска реального названия колонки независимо от регистра
    const getRealKey = (searchKey: string) => keys.find(k => k.toLowerCase().trim() === searchKey);
    
    // Ищем точные названия колонок для бренда и производителя
    const brandCol = getRealKey('brand');
    const manufacturerCol = getRealKey('manufacturer');
    
    // Ищем точные названия колонок для названия позиции или ASIN
    const titleCol = getRealKey('title') || getRealKey('product title');
    const asinCol = getRealKey('asin');
    
    // Предупреждаем пользователя, если нужные колонки не найдены
    if (!brandCol && !manufacturerCol) {
      console.warn("Предупреждение: Колонки 'brand' и 'manufacturer' не найдены по имени.");
    }
    
    // Создаем Map (словарь) для группировки уникальных позиций по каждому бренду
    const brandMap = new Map<string, Set<string>>();
    
    // Проходимся по каждой строке данных из Excel
    data.forEach(row => {
      let b = '';
      
      // Пытаемся получить имя бренда из колонки brand, либо из manufacturer
      if (brandCol && row[brandCol]) {
        b = String(row[brandCol]).trim();
      } else if (manufacturerCol && row[manufacturerCol]) {
        b = String(row[manufacturerCol]).trim();
      }
      
      // Если имя бренда пустое, пропускаем эту строку
      if (!b) return;
      
      // Список слов-паразитов, которые не являются реальными брендами
      const ignoreList = ['nan', 'none', 'unknown', '-', ''];
      
      // Если бренд находится в списке игнорируемых, пропускаем строку
      if (ignoreList.includes(b.toLowerCase())) return;
      
      let item = '';
      
      // Пытаемся получить информацию о позиции (название или ASIN)
      if (titleCol && row[titleCol]) {
        item = String(row[titleCol]).trim();
      } else if (asinCol && row[asinCol]) {
        item = `ASIN: ${String(row[asinCol]).trim()}`;
      } else {
        item = 'Неизвестная позиция';
      }
      
      // Если бренд встретился впервые, создаем для него новую запись (Set) в словаре
      if (!brandMap.has(b)) {
        brandMap.set(b, new Set<string>());
      }
      
      // Добавляем найденную позицию в список позиций этого бренда
      if (item) {
        brandMap.get(b)!.add(item);
      }
    });
    
    // Подготавливаем итоговый массив результатов
    const result: BrandData[] = [];
    
    // Сортируем названия брендов по алфавиту для красоты
    const sortedBrands = Array.from(brandMap.keys()).sort();
    
    // Преобразуем данные из словаря (Map) в массив объектов (BrandData[])
    for (const b of sortedBrands) {
      result.push({
        brand: b,
        items: Array.from(brandMap.get(b)!) // Преобразуем Set обратно в обычный массив
      });
    }
      
    // Возвращаем итоговый результат
    return result;
    
  } catch (e: unknown) {
    // В случае ошибки выводим понятное сообщение и завершаем процесс
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error(`Ошибка при обработке файла: ${errorMsg}`);
    process.exit(1);
  }
}

// Проверяем, запущен ли скрипт напрямую из командной строки (а не импортирован как модуль)
const isMainModule = process.argv[1] && fs.realpathSync(__filename) === fs.realpathSync(process.argv[1]);

if (isMainModule) {
  // Получаем путь к файлу из аргументов командной строки (3-й аргумент)
  const filePath = process.argv[2];
  
  // Если путь не передан, выводим подсказку и завершаем скрипт
  if (!filePath) {
    console.error("Пожалуйста, укажите путь к Excel файлу. Например: npx tsx extract.ts keepa/data.xlsx");
    process.exit(1);
  }
  
  // Запускаем процесс извлечения данных
  console.log(`Чтение файла ${filePath}...`);
  const brandsData = extractBrands(filePath);
  
  // Выводим красивые результаты в консоль
  console.log(`\n✅ Найдено уникальных брендов/производителей: ${brandsData.length}`);
  console.log("-".repeat(60));
  brandsData.forEach(bd => {
    console.log(`Бренд: ${bd.brand}`);
    console.log(`Позиции: ${bd.items.slice(0, 3).join(', ')}${bd.items.length > 3 ? ` и еще ${bd.items.length - 3}...` : ''}`);
    console.log("-".repeat(60));
  });
}
