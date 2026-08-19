# Навык: Генерация приветственного B2B письма (create-welcome-letter)

Навык автоматизирует создание первого B2B-письма поставщикам и производителям на основе шаблона [`other/welcome_letter/template.md`](file:///Users/usuario/code/viasglobal/other/welcome_letter/template.md).

## Возможности
- Интерактивный опрос параметров (название фабрики/дистрибьютора, список позиций).
- Автоматическое извлечение EAN по переданным ASIN из базы данных PostgreSQL (`AsinView`).
- Формирование готового к отправке письма на английском языке с реквизитами Viasglobal.

## Скрипты
- [`scripts/get-eans-by-asins.ts`](file:///Users/usuario/code/viasglobal/.agents/skills/create-welcome-letter/scripts/get-eans-by-asins.ts) — получение EAN по списку ASIN из БД.
