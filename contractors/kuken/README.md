# Поставщик ALFA DYSER, S.L. (Бренд KUKEN)

Документация по взаимодействию с испанским дистрибьютором ALFA DYSER, S.L. и обработке каталога продукции бренда KUKEN.

## Контактная информация

- **Организация:** ALFA DYSER, S.L.
- **CIF:** B-60163441
- **Город:** Барселона, Испания
- **Email:** `alfa@alfadyser.es`, `atencionalcliente@alfadyser.com`
- **Официальный сайт:** [https://alfadyser.es/](https://alfadyser.es/)
- **Портал B2B:** [https://alfadyser.es/es/customer/account/login/](https://alfadyser.es/es/customer/account/login/)

---

## Прайс-лист `viasglobal.xlsx`

Поставщик прислал персональный файл с оптовыми ценами: [viasglobal.xlsx](file:///Users/usuario/code/viasglobal/contractors/kuken/viasglobal.xlsx).

### Структура таблицы (Hoja1)

Файл содержит 28 позиций бытовой техники и персонального ухода без строки заголовков:
- **Колонка A:** Системный ID позиции
- **Колонка B:** Артикул (Referencia производителя, например, `34178`)
- **Колонка C:** Описание товара (например, `PLANCHA VAPOR 2200W.SUELA CERAMICA KUKEN`)
- **Колонка D:** Оптовая чистая цена **NETTO** (€ без НДС)
- **Колонка E:** Коэффициент / скидка (`0.65`)
- **Колонка F:** Кратность заказа (`1`)
- **Колонка G:** Бренд (`KUKEN`)
- **Колонка H:** Штрихкод **EAN** (13 цифр)

---

## Налоговый расчет себестоимости (Recargo de Equivalencia)

В Испании для статуса Autónomo на режиме Recargo de Equivalencia действует ставка:
- НДС (IVA): 21%
- Дополнительный налог (Recargo de Equivalencia): 5.2%
- Суммарный коэффициент себестоимости: `costPrice = priceNet * 1.262`

---

## Результаты сопоставления прайс-листа с базой данных

Из **28 позиций** прайс-листа:
- **20 позиций** уже есть в нашей базе данных и сопоставлены с активными листингами ASIN Amazon.
- **8 позиций** являются новинками поставщика (фены Brushless, настенные фены, выпрямители волос), которые пока отсутствуют в базе ASIN.

### Таблица сопоставления

| № | Артикул | EAN | Цена NET (€) | Себестоимость RE (€) | В базе | ASIN | BuyBox (€) | BSR | Наименование товара |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 34178 | 8425160341787 | 12.37 | 15.61 | Да | B0BDVSM5VV | 22.06 | 19 407 | Plancha Vapor 2200W Suela Cerámica |
| 2 | 34438 | 8425160344382 | 11.82 | 14.92 | Да | B0GDNS1FNL | 26.99 | 19 407 | Plancha Vapor 2200W Suela Inox |
| 3 | 37311 | 8425160373115 | 13.36 | 16.86 | Да | B0H4R1JV74 | 29.99 | 18 999 | Plancha Vapor 2400W Suela Cerámica |
| 4 | 34529 | 8425160345297 | 12.81 | 16.17 | Да | B0H4QTQC8X | 29.99 | 18 999 | Plancha Vapor 2400W Suela Inox |
| 5 | 35536 | 8425160355364 | 14.12 | 17.82 | Да | B0BDVTDP7T | 31.27 | 19 407 | Plancha Vapor 2600W Suela Cerámica |
| 6 | 36089 | 8425160360894 | 13.58 | 17.14 | Да | B0BDVTVK2Y | 29.86 | 19 407 | Plancha Vapor 2600W Suela Inox |
| 7 | 34087 | 8425160340872 | 19.05 | 24.04 | Да | B0BDWFF78B | 36.95 | 19 407 | Plancha Vapor 2800W Suela Cerámica |
| 8 | 34092 | 8425160340926 | 18.50 | 23.35 | Да | B08TRBYZSN | 39.94 | 19 407 | Plancha Vapor 2800W Suela Inox |
| 9 | 34098 | 8425160340988 | 21.24 | 26.80 | Да | B0999QM7BT | 35.00 | 19 407 | Plancha Vapor 3000W Suela Cerámica |
| 10 | 34103 | 8425160341039 | 20.69 | 26.11 | Да | B08TRBQLND | 35.00 | 19 407 | Plancha Vapor 3000W Suela Inox |
| 11 | 34532 | 8425160345327 | 23.76 | 29.99 | Да | B0H4RC5GKN | 39.99 | 18 999 | Plancha Vapor 3500W Suela Cerámica |
| 12 | 34513 | 8425160345136 | 11.82 | 14.92 | Да | B0H5W26FF6 | 24.99 | 19 969 | Secador Prof. Iónico 2000W Negro Mate |
| 13 | 39966 | 8425160399665 | 11.82 | 14.92 | Да | B0CSPBZS4Q | 23.99 | 19 969 | Secador Prof. Iónico 1600W Blanco Plegable |
| 14 | 34316 | 8425160343163 | 11.82 | 14.92 | Да | B0CSPHRCFH | 26.70 | 19 969 | Secador Prof. Iónico 2000W Negro |
| 15 | 34974 | 8425160349745 | 10.73 | 13.54 | Да | B0H4QZHK7L | 20.99 | 19 969 | Secador Viaje Plegable 1600W Blanco |
| 16 | 37071 | 8425160370718 | 15.22 | 19.21 | Да | B0CSPMQZF8 | 28.99 | 19 969 | Secador Prof. Iónico 2100W Burdeos |
| 17 | 35644 | 8425160356446 | 15.22 | 19.21 | Да | B0CSPDCPKJ | 28.99 | 19 969 | Secador Prof. Iónico 2100W Gris/Dorado |
| 18 | 36237 | 8425160362379 | 15.22 | 19.21 | Да | B0CSPP7K83 | 28.99 | 19 969 | Secador Prof. Iónico 2100W Gris/Magenta |
| 19 | 34658 | 8425160346584 | 32.74 | 41.32 | Нет | - | - | - | Secador Prof. Brushless 1600W Negro |
| 20 | 34546 | 8425160345464 | 31.64 | 39.93 | Нет | - | - | - | Secador Prof. Brushless Mini 1400W |
| 21 | 38032 | 8425160380328 | 17.41 | 21.97 | Да | B0CSPFP1TQ | 32.99 | 19 969 | Secador Prof. Iónico 2400W Gris Lateral |
| 22 | 39147 | 8425160391478 | 17.41 | 21.97 | Да | B0CSPCQQSS | 30.99 | 19 969 | Secador Prof. Iónico 2400W Gris/Azul |
| 23 | 35635 | 8425160356354 | 24.85 | 31.36 | Нет | - | - | - | Secador Pared Baño 2000W |
| 24 | 34436 | 8425160344368 | 34.38 | 43.39 | Нет | - | - | - | Secador Prof. Brushless 1800W Blanco |
| 25 | 34455 | 8425160344559 | 34.38 | 43.39 | Нет | - | - | - | Secador Prof. Brushless 1800W Gris |
| 26 | 35574 | 8425160355746 | 49.82 | 62.87 | Нет | - | - | - | Secador Prof. Deluxe Ion 1900W Brushless |
| 27 | 35180 | 8425160351809 | 12.48 | 15.75 | Нет | - | - | - | Plancha Pelo Alisar Cerámica 35W Kuken |
| 28 | 34347 | 8425160343477 | 24.53 | 30.96 | Нет | - | - | - | Plancha Pelo Alisar Cerámica 70W Kuken |

---

## Статус интеграции в базу данных

- **Импорт выполнен:** `npx tsx scripts/import-distributor-prices.ts ../contractors/kuken/viasglobal.xlsx "Alfadyser (Kuken)" --contracted`
- **Дистрибьютор:** `Alfadyser (Kuken)` (ID: 5) переведен в статус **`ACCOUNT_OPENED`**.
- **Бренд:** `KUKEN` (ID: 504) переведен в статус **`CONTRACTED`**.
- **Снапшоты цен:** Создано **28 записей** в таблице `DistributorPriceSnapshot`.
- **Привязка к ASIN:** **20 товаров** связаны с дистрибьютором и поставлены в очередь `RequestProductQueue` с приоритетом `999999` для актуализации габаритов и комиссий Keepa.
- **Новинки поставщика:** Список из **8 несопоставленных EAN** сохранен в [unmatched_eans.txt](file:///Users/usuario/code/viasglobal/contractors/kuken/unmatched_eans.txt) для дальнейшего мониторинга и создания монопольных карточек товаров.
- **Просмотр доходности позиций:** Товары доступны в сводном представлении `ContractedAllProductsView` и проверяются скриптом `npx tsx scripts/get-distributor-snapshot.ts <ASIN_или_EAN>`.

