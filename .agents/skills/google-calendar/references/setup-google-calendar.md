# Настройка доступа к Google Calendar через сервисный аккаунт (Service Account)

Интеграция работает напрямую с Google Calendar API без привязки к локальным приложениям ОС. Сервисный аккаунт действует от имени робота-помощника, которому вы в один клик предоставляете доступ к вашему личному календарю в веб-интерфейсе Google Календаря.

---

## Преимущества сервисного аккаунта
- **Полная автономность**: Никаких всплывающих окон в браузере и обновлений временных токенов — ключ работает бессрочно.
- **Безопасность**: Робот имеет доступ строго к тем календарям, которые вы прямо указали в настройках доступа.
- **Мгновенный отзыв доступа**: Вы можете в любой момент закрыть доступ в настройках календаря Google.

---

## Пошаговая инструкция (занимает 2–3 минуты)

### Шаг 1. Создать проект и включить API
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/).
2. Создайте новый проект (например, `viasglobal-assistant`) или выберите существующий.
3. Включите необходимые API:
   - **Google Calendar API**: [Включить Calendar API](https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=822207386318)
   - **Google Tasks API**: [Включить Tasks API](https://console.developers.google.com/apis/api/tasks.googleapis.com/overview?project=822207386318)

### Шаг 2. Создать сервисный аккаунт (Service Account)
1. В левом меню перейдите в **IAM & Admin** ➔ **Service Accounts** ([прямая ссылка](https://console.cloud.google.com/iam-admin/serviceaccounts)).
2. Нажмите **Create Service Account** (+ Создать сервисный аккаунт).
3. Укажите:
   - **Service account name**: например, `viasglobal-calendar`
   - **Service account ID**: сформируется автоматически (например, `viasglobal-calendar@viasglobal-assistant.iam.gserviceaccount.com`).
4. Нажмите **Create and Continue**, затем **Done** (роли назначать не обязательно).

### Шаг 3. Скачать JSON-ключ
1. В списке сервисных аккаунтов нажмите на созданный аккаунт.
2. Перейдите во вкладку **Keys** (Ключи) ➔ **Add Key** ➔ **Create new key**.
3. Выберите формат **JSON** и нажмите **Create**.
4. Файл ключа скачается на ваш компьютер.
5. Переместите этот файл в репозиторий проекта по пути:
   ```bash
   .secrets/google-service-account.json
   ```
   *(Папка `.secrets` и файлы `*service-account.json` уже добавлены в `.gitignore` и никогда не попадут в Git).*

### Шаг 4. Поделиться календарем с сервисным аккаунтом
1. Откройте [Google Календарь](https://calendar.google.com/) в браузере.
2. В левой панели найдите календарь `yasinsky93@gmail.com` (или нужный рабочий календарь) и нажмите на три точки рядом с ним ➔ **Настройки и общий доступ** (*Settings and sharing*).
3. Прокрутите до раздела **Доступ для отдельных пользователей** (*Share with specific people or groups*).
4. Нажмите **Добавить пользователей** (*Add people*).
5. Вставьте email вашего сервисного аккаунта (из Шага 2, например `viasglobal-calendar@...iam.gserviceaccount.com`).
6. В выпадающем списке прав выберите:
   **Внесение изменений в мероприятия** (*Make changes to events*).
7. Нажмите **Отправить** (*Send*).

---

## Проверка работы

После сохранения ключа в `.secrets/google-service-account.json` проверьте подключение:
```bash
npx tsx .agents/skills/google-calendar/scripts/calendar.ts list --days 7
```
Команда выведет список ваших предстоящих мероприятий из Google Календаря.
