---
name: fetch-keepa-viewer
description: Автоматическая выгрузка данных по пачке EAN/ASIN через Keepa Product Viewer без затрат API токенов с использованием сохраненной веб-сессии.
---

# Навык: Fetch Keepa Viewer (Выгрузка товаров без API токенов)

Этот навык позволяет выгружать до 10,000 EAN или ASIN кодов за один раз через веб-интерфейс Keepa Product Viewer (`https://keepa.com/#!viewer`) абсолютно бесплатно (без расхода лимитов Keepa API токенов).

## Авторизация и сохранение сессии (делается 1 раз)

Сессия пользователя (cookies и localStorage) сохраняется в `.agents/skills/fetch-keepa-viewer/auth/storage_state.json`.

Если файл сессии отсутствует или устарел, запускается одноразовая авторизация:

```bash
cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/fetch-keepa-viewer/scripts/save-session.ts
```

1. Откроется окно Google Chrome.
2. Пользователь входит в свой аккаунт Keepa и выбирает регион Испания (amazon.es).
3. В терминале нажимается `ENTER`.
4. Сессия сохраняется в `storage_state.json` (файл защищен в `.gitignore`).

## Автономная выгрузка списка товаров

Для выгрузки списка кодов:

```bash
cd /Users/usuario/code/viasglobal/backend && npx tsx ../.agents/skills/fetch-keepa-viewer/scripts/fetch-viewer.ts <путь_к_файлу_с_кодами.txt> <куда_сохранить_выгрузку.xlsx> [domainId]
```

- Полученный `.xlsx` файл затем сразу передается в навык `parse-keepa`:
  ```bash
  cd /Users/usuario/code/viasglobal/backend && npx tsx scripts/parse-keepa.ts <путь_к_сохраненному.xlsx>
  ```
- **Обязательная сплошная выгрузка прайс-листов дистрибьюторов**: при работе с новым прайс-листом дистрибьютора **все 100% EAN из прайс-листа** обязаны быть прогнаны через Keepa Product Viewer (`fetch-viewer.ts`) и импортированы в базу данных через `parse-keepa.ts`. Это необходимо для того, чтобы:
  1. В таблице `ProductFinder` создались самые свежие снапшоты с актуальными ценами Buy Box, FBA комиссиями, габаритами и BSR (даже если у товаров нет высокого BSR и они не попали в выгрузку бренда через Product Finder).
  2. В базе данных гарантированно появились связки `ASIN <-> EAN` для последующей безошибочной привязки дистрибьютора и расчета юнит-экономики в `ContractedAllProductsView`.
- **Обработка несопоставленных EAN**: несопоставленные EAN из прайс-листов дистрибьюторов (которые Keepa вернула как Unknown/NotFound) сохраняются в файл `<дистрибьютор>_unmatched_eans.txt` как список позиций, не заведенных на Amazon, для дальнейшего анализа под создание карточек.

