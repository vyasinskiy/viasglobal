# Инструкции для ИИ (verify-private-label)

- **Назначение**: Проверка связки Бренд + Продавец на статус Private Label по данным базы данных.
- **Скрипт**: `backend/scripts/verify-private-label.ts`.
- **Запуск**:
  ```bash
  cd backend && npx tsx scripts/verify-private-label.ts "<brandName>" "<sellerId_or_sellerName>"
  ```
- **Правило перехода при подтверждении Private Label**: Спросить подтверждение на внесение в `PrivateLabel` и при согласии активировать навык `add-private-label`.
- **Правило перехода при подтверждении Wholesale**: Сообщить, что бренд открыт для оптовой торговли, и предложить найти европейских B2B дистрибьюторов, при согласии активировать навык `find-distributor`.
