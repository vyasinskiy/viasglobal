# Инструкции для ИИ (create-welcome-letter skill)

*Правила для ИИ:*
1. Триггер: активация при запросах вида "сделай приветственное письмо".
2. Если переданы ASIN — обязательно запускать скрипт `scripts/get-eans-by-asins.ts` для поиска EAN в базе данных.
3. Сохранять форматирование реквизитов и формулировок из [`other/welcome_letter/template.md`](file:///Users/usuario/code/viasglobal/other/welcome_letter/template.md).
