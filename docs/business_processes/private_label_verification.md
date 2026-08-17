# Алгоритм проверки Private Label (Связка Бренд + Продавец)

Данный бизнес-процесс описывает шаги для программного подтверждения гипотезы о том, что конкретный продавец торгует определенным брендом по модели Private Label (является владельцем или эксклюзивным дистрибьютором).

## Шаг 1: Быстрая проверка по совпадению названий
Если название Бренда и имя Продавца (Seller) полностью или очевидным образом совпадают (например, бренд `Paramount City` и продавец `Paramount City` или `ParaCity`), то связка **автоматически подтверждается** как Private Label.
*В этом случае загрузка и анализ выгрузки товаров продавца не требуется.*

## Шаг 2: Подготовка выгрузки товаров (Keepa)
Если названия не совпадают (например, бренд `TOPCHANCES`, а продавец `Paramount City`), необходимо доказать эксклюзивность продаж. Для этого нужно сделать экспорт всех товаров данного продавца через Keepa в формате Excel (`.xlsx`).

## Шаги 3 и 4: Программный анализ эксклюзивности и BuyBox
Анализ выполняется скриптом (см. ниже). Скрипт ищет товары нужного бренда в выгрузке продавца и проверяет две ключевые метрики:
1. **Эксклюзивные продажи:** Подсчет количества товаров в рамках бренда, где продавец является **единственным** на листинге (используется колонка `New Offer Count: Current` со значением `1`).
2. **Доминирование в BuyBox:** Подсчет количества товаров, где целевой продавец удерживает BuyBox (колонка `Buy Box: Buy Box Seller`).

Если продавец доминирует в BuyBox (близко к 100%) и/или является единственным продавцом на подавляющем большинстве листингов бренда, связка Бренд + Продавец подтверждается как Private Label.

---

### Скрипт для автоматической проверки (Node.js)
Скрипт использует библиотеку `xlsx` для парсинга выгрузки.

```typescript
// Скрипт для проверки Private Label по выгрузке Keepa
import xlsx from 'xlsx';

// Настройки
const EXCEL_FILE_PATH = './keepa/exports/paramaunt_products.xlsx';
const TARGET_BRAND = 'TOPCHANCES'; // Бренд, который мы проверяем
const TARGET_SELLER_ID = 'A2125XITGCFMVZ'; // Опционально: ID или часть имени продавца из колонки Buy Box Seller

function verifyPrivateLabel() {
    const wb = xlsx.readFile(EXCEL_FILE_PATH);
    const sheetName = wb.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);

    let totalBrandItems = 0;
    let singleSellerItems = 0;
    let buyBoxWins = 0;
    const bbSellers: Record<string, number> = {};

    data.forEach((row: any) => {
        const brand = row['Brand'] || row['brand'] || row['BRAND'];
        
        // Фильтруем только по нужному бренду
        if (!brand || brand.toUpperCase() !== TARGET_BRAND.toUpperCase()) return;

        totalBrandItems++;
        
        // Проверка 1: Продавец только один
        const offerCount = parseInt(row['New Offer Count: Current']);
        if (!isNaN(offerCount) && offerCount === 1) {
            singleSellerItems++;
        }
        
        // Проверка 2: Кто владеет BuyBox
        const bbSeller = row['Buy Box: Buy Box Seller'];
        if (bbSeller) {
            bbSellers[bbSeller] = (bbSellers[bbSeller] || 0) + 1;
            // Считаем победы целевого продавца (по совпадению строки)
            if (bbSeller.includes(TARGET_SELLER_ID) || bbSeller.toLowerCase().includes('paramount')) {
                 buyBoxWins++;
            }
        }
    });

    console.log(`\n=== Результаты проверки Private Label для бренда: ${TARGET_BRAND} ===`);
    console.log(`Всего товаров бренда у продавца: ${totalBrandItems}`);
    console.log(`Товаров с единственным продавцом: ${singleSellerItems} (${((singleSellerItems/totalBrandItems)*100).toFixed(1)}%)`);
    console.log(`Удержаний BuyBox целевым продавцом: ${buyBoxWins} (${((buyBoxWins/totalBrandItems)*100).toFixed(1)}%)`);
    
    console.log('\nТоп владельцев BuyBox на этих листингах:');
    const sortedBb = Object.entries(bbSellers).sort((a, b) => b[1] - a[1]).slice(0, 3);
    sortedBb.forEach(([seller, count]) => console.log(`  ${seller} : ${count}`));

    if ((singleSellerItems / totalBrandItems) > 0.5 || (buyBoxWins / totalBrandItems) > 0.9) {
        console.log('\n[РЕЗУЛЬТАТ] ВЫВОД ПОДТВЕРЖДЕН: Это Private Label связка.');
    } else {
         console.log('\n[РЕЗУЛЬТАТ] НЕТ ПОДТВЕРЖДЕНИЯ: Это похоже на оптовые продажи (Wholesale).');
    }
}

verifyPrivateLabel();
```
