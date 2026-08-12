import pandas as pd
import argparse
import sys
import os

def extract_brands(file_path):
    if not os.path.exists(file_path):
        print(f"Ошибка: Файл {file_path} не найден.")
        sys.exit(1)
        
    print(f"Чтение файла {file_path}...")
    try:
        # Читаем Excel файл
        df = pd.read_excel(file_path, engine='openpyxl')
        
        # Ищем колонки 'manufacturer' и 'brand' (учитываем разный регистр)
        cols_lower = {str(c).lower().strip(): c for c in df.columns}
        
        brand_col = cols_lower.get('brand')
        manufacturer_col = cols_lower.get('manufacturer')
        
        # Если по имени не нашли, пробуем по индексам колонок (DR = 121, DS = 122, если 0-индексация)
        if not brand_col and not manufacturer_col:
            print("Предупреждение: Колонки 'brand' и 'manufacturer' не найдены по имени. Пробуем найти по индексам колонок DR и DS.")
            if len(df.columns) > 122:
                brand_col = df.columns[122] # DS
                manufacturer_col = df.columns[121] # DR
            else:
                print("Ошибка: В файле недостаточно колонок для поиска по индексам DR и DS.")
                sys.exit(1)
            
        brands = set()
        
        if brand_col:
            brands.update(df[brand_col].dropna().astype(str).unique())
            
        if manufacturer_col:
            brands.update(df[manufacturer_col].dropna().astype(str).unique())
            
        # Очистка от пустых значений и мусора
        ignore_list = ['nan', 'none', 'unknown', '-', '']
        cleaned_brands = sorted({
            b.strip() for b in brands 
            if b.strip() and b.strip().lower() not in ignore_list
        })
        
        print(f"\n✅ Найдено уникальных брендов/производителей: {len(cleaned_brands)}")
        print("-" * 40)
        for b in cleaned_brands:
            print(b)
        print("-" * 40)
            
    except Exception as e:
        print(f"Ошибка при обработке файла: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Извлечение уникальных брендов из выгрузки Keepa.")
    parser.add_argument("file_path", help="Путь к файлу Excel")
    args = parser.parse_args()
    
    extract_brands(args.file_path)
