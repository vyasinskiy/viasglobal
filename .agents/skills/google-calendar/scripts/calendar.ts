/**
 * @file calendar.ts
 * @description Утилита для прямого взаимодействия с Google Calendar API через сервисный аккаунт (Service Account)
 * Поддерживает команды:
 * - list: вывод списка ближайших событий
 * - create: создание события с цветовой кодировкой и стандартизированным оформлением
 * - delete: удаление события по идентификатору
 */

import { google, calendar_v3, tasks_v1 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

/**
/**
 * Две основные категории событий компании Viasglobal:
 * 1. Legal: юридические, налоговые и регуляторные вопросы (контрастный ярко-оранжевый Tangerine, colorId: 6)
 * 2. E-commerce: опт, поставщики, закупки, Amazon FBA и витрина (бирюзовый Peacock, colorId: 7)
 * Цветовая палитра Google Calendar API: https://developers.google.com/calendar/api/v3/reference/colors/get
 */
export const CALENDAR_CATEGORIES: Record<string, { colorId: string; name: string; prefix: string }> = {
  'Legal': {
    colorId: '6', // Tangerine (яркий контрастный оранжевый)
    name: 'Юридические, налоговые и нормативные вопросы (Hacienda, RAP, договоры, нотариат)',
    prefix: '[Legal]',
  },
  'E-commerce': {
    colorId: '7', // Peacock (глубокий бирюзово-синий контраст)
    name: 'Электронная коммерция, Amazon FBA, опт и поставщики',
    prefix: '[E-commerce]',
  },
};

/**
 * Нормализация переданной категории к одному из двух основных типов (Legal или E-commerce)
 */
export function normalizeCategoryKey(rawCategory?: string): 'Legal' | 'E-commerce' {
  if (!rawCategory) return 'Legal';
  const lower = rawCategory.toLowerCase().trim();

  // Признаки категории Legal (налоги, юриспруденция, экология RAP, нотариат, договоры)
  if (
    lower.includes('legal') ||
    lower.includes('rap') ||
    lower.includes('envase') ||
    lower.includes('tax') ||
    lower.includes('hacienda') ||
    lower.includes('aeat') ||
    lower.includes('admin') ||
    lower.includes('notar') ||
    lower.includes('procircular') ||
    lower.includes('miterd')
  ) {
    return 'Legal';
  }

  // Признаки категории E-commerce (продажи, товары, закупки, амазон, поставщики)
  if (
    lower.includes('e-com') ||
    lower.includes('ecom') ||
    lower.includes('amazon') ||
    lower.includes('fba') ||
    lower.includes('fbm') ||
    lower.includes('b2b') ||
    lower.includes('wholesale') ||
    lower.includes('opt') ||
    lower.includes('supplier') ||
    lower.includes('distributor') ||
    lower.includes('shop') ||
    lower.includes('kuken') ||
    lower.includes('cofan') ||
    lower.includes('safta')
  ) {
    return 'E-commerce';
  }

  return 'Legal';
}

/**
 * Функция поиска пути к JSON-файлу сервисного аккаунта Google
 * Ищет путь по цепочке: переменные окружения -> корень .secrets -> папка скилла
 */
export function findServiceAccountKeyPath(): string | null {
  // 1. Проверяем переменную окружения GOOGLE_SERVICE_ACCOUNT_KEY_PATH
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
    const envPath = path.resolve(process.cwd(), process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
    if (fs.existsSync(envPath)) {
      return envPath;
    }
  }

  // 2. Проверяем стандартные локации в репозитории
  const candidatePaths = [
    path.resolve(process.cwd(), '.secrets/google-service-account.json'),
    path.resolve(process.cwd(), 'backend/.secrets/google-service-account.json'),
    path.resolve(__dirname, '../.secrets/google-service-account.json'),
    path.resolve(process.cwd(), 'google-service-account.json'),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

const TOKENS_PATH = path.resolve(process.cwd(), '.secrets/google-oauth-tokens.json');
const OAUTH_CREDS_PATH = path.resolve(process.cwd(), '.secrets/google-oauth-credentials.json');

/**
 * Получение авторизованного OAuth2 клиента пользователя (если выполнена авторизация через auth-tasks.ts)
 */
export function getOAuth2Client(): any | null {
  if (fs.existsSync(TOKENS_PATH) && fs.existsSync(OAUTH_CREDS_PATH)) {
    try {
      const rawCreds = JSON.parse(fs.readFileSync(OAUTH_CREDS_PATH, 'utf-8'));
      const clientInfo = rawCreds.installed || rawCreds.web || rawCreds;
      const oauth2Client = new google.auth.OAuth2(clientInfo.client_id, clientInfo.client_secret);
      const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8'));
      oauth2Client.setCredentials(tokens);
      return oauth2Client;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Инициализация авторизованного клиента Google Calendar
 */
export async function getCalendarClient(): Promise<{ calendar: calendar_v3.Calendar; calendarId: string }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  // 1. Приоритет: OAuth2 клиент пользователя (прямой доступ)
  const oauthClient = getOAuth2Client();
  if (oauthClient) {
    const calendar = google.calendar({ version: 'v3', auth: oauthClient });
    return { calendar, calendarId };
  }

  // 2. Резерв: сервисный аккаунт
  const keyPath = findServiceAccountKeyPath();
  if (!keyPath) {
    throw new Error(
      `Файл ключа сервисного аккаунта Google не найден!\n` +
      `Пожалуйста, сохраните JSON-ключ в файл .secrets/google-service-account.json ` +
      `или укажите путь в переменной GOOGLE_SERVICE_ACCOUNT_KEY_PATH в .env.\n` +
      `Подробная инструкция: .agents/skills/google-calendar/references/setup-google-calendar.md`
    );
  }

  // Создаем аутентификацию на основе JSON-ключа сервисного аккаунта
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/tasks',
    ],
  });

  const authClient = await auth.getClient();
  const calendar = google.calendar({ version: 'v3', auth: authClient as any });

  return { calendar, calendarId };
}

/**
 * Инициализация авторизованного клиента Google Tasks
 */
export async function getTasksClient(): Promise<tasks_v1.Tasks> {
  // 1. Приоритет: OAuth2 клиент пользователя (прямой доступ к личному списку задач)
  const oauthClient = getOAuth2Client();
  if (oauthClient) {
    return google.tasks({ version: 'v1', auth: oauthClient });
  }

  // 2. Резерв: сервисный аккаунт
  const keyPath = findServiceAccountKeyPath();
  if (!keyPath) {
    throw new Error('Файл ключа сервисного аккаунта Google или OAuth токенов не найден!');
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/tasks',
    ],
  });
  const authClient = await auth.getClient();
  return google.tasks({ version: 'v1', auth: authClient as any });
}

/**
/**
 * Получение или создание списка задач (Tasklist)
 */
export async function getOrCreateTaskList(targetName: string): Promise<string> {
  const tasks = await getTasksClient();
  const listRes = await tasks.tasklists.list({ maxResults: 100 });
  const items = listRes.data.items || [];
  
  // Если запрашивается дефолтный список 'Tasks'
  if (targetName.toLowerCase() === 'tasks' || targetName.toLowerCase() === '@default') {
    const defaultList = items.find((item) => item.id === '@default' || item.title?.toLowerCase() === 'tasks');
    if (defaultList && defaultList.id) {
      return defaultList.id;
    }
  }

  // Ищем существующий список задач
  const existing = items.find((item) => item.title?.toLowerCase() === targetName.toLowerCase());
  if (existing && existing.id) {
    return existing.id;
  }

  // Если списка нет, создаем новый список
  const createRes = await tasks.tasklists.insert({
    requestBody: {
      title: targetName,
    },
  });

  return createRes.data.id!;
}

/**
 * Создание задачи в Google Tasks
 */
export async function createGoogleTask(params: {
  category: string;
  title: string;
  dueDate?: string; // YYYY-MM-DD или ISO
  notes?: string;
  listName?: string;
}) {
  const tasks = await getTasksClient();
  const normCategory = normalizeCategoryKey(params.category);
  // По умолчанию задачи всегда помещаются в единый общий список 'Tasks'
  const targetListName = params.listName || 'Tasks';
  const tasklistId = await getOrCreateTaskList(targetListName);

  const { summary } = formatEventSummary(normCategory, params.title);

  let dueIso: string | undefined;
  if (params.dueDate) {
    const d = new Date(params.dueDate);
    dueIso = d.toISOString();
  }

  const res = await tasks.tasks.insert({
    tasklist: tasklistId,
    requestBody: {
      title: summary,
      notes: params.notes || '',
      due: dueIso,
    },
  });

  return { task: res.data, tasklistId, category: targetListName };
}

/**
 * Получение списка задач
 */
export async function listGoogleTasks(category?: string) {
  const tasks = await getTasksClient();
  const normCategory = category ? normalizeCategoryKey(category) : undefined;

  const tasklists = await tasks.tasklists.list({ maxResults: 100 });
  const lists = tasklists.data.items || [];

  const targetLists = normCategory
    ? lists.filter((l) => l.title?.toLowerCase() === normCategory.toLowerCase())
    : lists;

  const result: Array<{ listTitle: string; listId: string; tasks: tasks_v1.Schema$Task[] }> = [];

  for (const list of targetLists) {
    if (!list.id) continue;
    const itemsRes = await tasks.tasks.list({
      tasklist: list.id,
      showCompleted: false,
      showHidden: false,
      maxResults: 100,
    });
    result.push({
      listTitle: list.title || 'Без названия',
      listId: list.id,
      tasks: itemsRes.data.items || [],
    });
  }

  return result;
}

/**
 * Пометить задачу выполненной (status: 'completed')
 */
export async function completeGoogleTask(taskId: string, category?: string, listName = 'Tasks') {
  const tasks = await getTasksClient();
  // По умолчанию все задачи хранятся в общем списке 'Tasks'
  const targetListName = listName || 'Tasks';
  const tasklistId = await getOrCreateTaskList(targetListName);

  try {
    const res = await tasks.tasks.patch({
      tasklist: tasklistId,
      task: taskId,
      requestBody: {
        status: 'completed',
      },
    });
    return res.data;
  } catch (err: any) {
    // Если в основном списке не найдено, ищем задачу по всем спискам пользователя
    const listRes = await tasks.tasklists.list({ maxResults: 100 });
    for (const l of listRes.data.items || []) {
      if (!l.id || l.id === tasklistId) continue;
      try {
        const res = await tasks.tasks.patch({
          tasklist: l.id,
          task: taskId,
          requestBody: {
            status: 'completed',
          },
        });
        return res.data;
      } catch {
        // Продолжаем поиск
      }
    }
    throw err;
  }
}

/**
 * Удалить задачу
 */
export async function deleteGoogleTask(taskId: string, category?: string, listName = 'Tasks') {
  const tasks = await getTasksClient();
  const targetListName = listName || 'Tasks';
  const tasklistId = await getOrCreateTaskList(targetListName);

  try {
    await tasks.tasks.delete({
      tasklist: tasklistId,
      task: taskId,
    });
    return { success: true, taskId };
  } catch (err: any) {
    const listRes = await tasks.tasklists.list({ maxResults: 100 });
    for (const l of listRes.data.items || []) {
      if (!l.id || l.id === tasklistId) continue;
      try {
        await tasks.tasks.delete({
          tasklist: l.id,
          task: taskId,
        });
        return { success: true, taskId };
      } catch {
        // Продолжаем поиск
      }
    }
    throw err;
  }
}

/**
 * Форматирование заголовка события в соответствии со стандартом категорий
 */
export function formatEventSummary(categoryKey?: string, title = ''): { summary: string; colorId: string } {
  const normKey = normalizeCategoryKey(categoryKey);
  const category = CALENDAR_CATEGORIES[normKey];
  
  // Если заголовок уже содержит префикс категории, не дублируем его
  let cleanTitle = title.trim();
  if (cleanTitle.startsWith(category.prefix)) {
    return { summary: cleanTitle, colorId: category.colorId };
  }

  // Отрезаем любые другие устаревшие префиксы в квадратных скобках ([RAP/Envases], [Hacienda] и т.д.)
  cleanTitle = cleanTitle.replace(/^\[.*?\]\s*:\s*/, '').replace(/^\[.*?\]\s*/, '');
  const summary = `${category.prefix}: ${cleanTitle}`;

  return { summary, colorId: category.colorId };
}

/**
 * Создание события в Google Calendar
 */
export async function createCalendarEvent(params: {
  title: string;
  category: string;
  startDate: string; // ISO 8601 (например, 2026-10-26T10:00:00+02:00)
  endDate?: string;   // ISO 8601, по умолчанию +1 час
  description?: string;
  calendarId?: string;
  isAllDay?: boolean;
}) {
  const { calendar, calendarId } = await getCalendarClient();
  const targetCalendarId = params.calendarId || calendarId;

  const { summary, colorId } = formatEventSummary(params.category, params.title);

  // Вычисляем конечное время, если оно не передано явно
  let startObj: calendar_v3.Schema$EventDateTime;
  let endObj: calendar_v3.Schema$EventDateTime;

  if (params.isAllDay) {
    // Событие на весь день: передается только дата YYYY-MM-DD
    const dateOnly = params.startDate.split('T')[0];
    startObj = { date: dateOnly };
    endObj = { date: params.endDate ? params.endDate.split('T')[0] : dateOnly };
  } else {
    // Событие с точным временем
    const start = new Date(params.startDate);
    const end = params.endDate ? new Date(params.endDate) : new Date(start.getTime() + 60 * 60 * 1000);
    startObj = { dateTime: start.toISOString(), timeZone: 'Europe/Madrid' };
    endObj = { dateTime: end.toISOString(), timeZone: 'Europe/Madrid' };
  }

  // Формируем тело события
  const eventPayload: calendar_v3.Schema$Event = {
    summary,
    description: params.description || '',
    colorId,
    start: startObj,
    end: endObj,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // за 24 часа
        { method: 'popup', minutes: 120 },  // за 2 часа
        { method: 'popup', minutes: 30 },   // за 30 минут
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: targetCalendarId,
    requestBody: eventPayload,
  });

  return response.data;
}

/**
 * Получение списка предстоящих событий
 */
export async function listUpcomingEvents(days = 14, calendarIdOverride?: string) {
  const { calendar, calendarId } = await getCalendarClient();
  const targetCalendarId = calendarIdOverride || calendarId;

  const now = new Date();
  const maxDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const response = await calendar.events.list({
    calendarId: targetCalendarId,
    timeMin: now.toISOString(),
    timeMax: maxDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

/**
 * Обновление существующего события в Google Calendar
 */
export async function updateCalendarEvent(params: {
  eventId: string;
  title?: string;
  category?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  calendarId?: string;
}) {
  const { calendar, calendarId } = await getCalendarClient();
  const targetCalendarId = params.calendarId || calendarId;

  // Получаем текущее событие
  const currentEvent = await calendar.events.get({
    calendarId: targetCalendarId,
    eventId: params.eventId,
  });

  const requestBody: calendar_v3.Schema$Event = { ...currentEvent.data };

  if (params.category || params.title) {
    const targetTitle = params.title || currentEvent.data.summary || '';
    // Если категория не указана явно, пробуем определить ее по префиксу или оставить текущую
    let targetCategory = params.category;
    if (!targetCategory) {
      for (const [key, val] of Object.entries(CALENDAR_CATEGORIES)) {
        if (targetTitle.includes(val.prefix) || (currentEvent.data.colorId === val.colorId)) {
          targetCategory = key;
          break;
        }
      }
    }
    const { summary, colorId } = formatEventSummary(targetCategory || 'Routine/Task', targetTitle);
    requestBody.summary = summary;
    requestBody.colorId = colorId;
  }

  if (params.description !== undefined) {
    requestBody.description = params.description;
  }

  const response = await calendar.events.patch({
    calendarId: targetCalendarId,
    eventId: params.eventId,
    requestBody,
  });

  return response.data;
}

/**
 * Удаление события по ID
 */
export async function deleteCalendarEvent(eventId: string, calendarIdOverride?: string) {
  const { calendar, calendarId } = await getCalendarClient();
  const targetCalendarId = calendarIdOverride || calendarId;

  await calendar.events.delete({
    calendarId: targetCalendarId,
    eventId,
  });

  return { success: true, eventId };
}

/**
 * Точка входа для вызова из командной строки (CLI)
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Использование: npx tsx .agents/skills/google-calendar/scripts/calendar.ts <команда> [опции]

Команды событий (Google Calendar):
  list                 Показать предстоящие события (по умолчанию за 14 дней)
                       Опции: --days <кол-во дней>

  create               Создать новое событие
                       Опции:
                         --title "Название"
                         --category "Legal" или "E-commerce"
                         --start "2026-10-26T10:00:00"
                         --end "2026-10-26T11:00:00"
                         --desc "Подробное описание"
                         --allday (если событие на весь день)

  update               Обновить существующее событие
                       Опции:
                         --id <event_id>
                         --title "Новое название"
                         --category "Legal" или "E-commerce"
                         --desc "Новое описание"

  delete               Удалить событие по ID
                       Опции: --id <event_id>

Команды задач (Google Tasks):
  task:list            Показать список задач
                       Опции: --category "Legal" или "E-commerce"

  task:create          Создать задачу в списке Tasks
                       Опции:
                         --title "Название задачи"
                         --category "Legal" или "E-commerce"
                         --due "2026-10-26" (дедлайн)
                         --notes "Описание задачи"

  task:complete        Пометить задачу выполненной (галочка)
                       Опции:
                         --id <task_id>
                         --category "Legal" или "E-commerce"

  task:delete          Удалить задачу
                       Опции:
                         --id <task_id>
                         --category "Legal" или "E-commerce"
`);
    return;
  }

  try {
    if (command === 'list') {
      const daysIdx = args.indexOf('--days');
      const days = daysIdx !== -1 && args[daysIdx + 1] ? parseInt(args[daysIdx + 1], 10) : 14;
      const events = await listUpcomingEvents(days);

      console.log(`\n📅 Предстоящие события на ближайшие ${days} дней (${events.length}):\n`);
      for (const ev of events) {
        const start = ev.start?.dateTime || ev.start?.date || 'Без времени';
        console.log(`• [${start}] ${ev.summary} (ID: ${ev.id})`);
        if (ev.description) {
          console.log(`  Описание: ${ev.description.split('\n')[0]}...`);
        }
      }
    } else if (command === 'create') {
      const getArg = (flag: string): string | undefined => {
        const idx = args.indexOf(flag);
        return idx !== -1 ? args[idx + 1] : undefined;
      };

      const title = getArg('--title');
      const category = getArg('--category') || 'Legal';
      const start = getArg('--start');
      const end = getArg('--end');
      const desc = getArg('--desc');
      const isAllDay = args.includes('--allday');

      if (!title || !start) {
        console.error('Ошибка: Обязательные параметры --title и --start должны быть указаны.');
        process.exit(1);
      }

      const event = await createCalendarEvent({
        title,
        category,
        startDate: start,
        endDate: end,
        description: desc,
        isAllDay,
      });

      console.log(`\n✅ Событие успешно создано в Google Календаре!`);
      console.log(`• Заголовок: ${event.summary}`);
      console.log(`• ID: ${event.id}`);
      console.log(`• Ссылка: ${event.htmlLink}\n`);
    } else if (command === 'update') {
      const getArg = (flag: string): string | undefined => {
        const idx = args.indexOf(flag);
        return idx !== -1 ? args[idx + 1] : undefined;
      };

      const eventId = getArg('--id');
      const title = getArg('--title');
      const category = getArg('--category');
      const desc = getArg('--desc');

      if (!eventId) {
        console.error('Ошибка: Необходимо указать --id <event_id>');
        process.exit(1);
      }

      const event = await updateCalendarEvent({
        eventId,
        title,
        category,
        description: desc,
      });

      console.log(`\n✅ Событие ${eventId} успешно обновлено в Google Календаре!`);
      console.log(`• Заголовок: ${event.summary}`);
      console.log(`• Цвет ID: ${event.colorId}`);
      console.log(`• Ссылка: ${event.htmlLink}\n`);
    } else if (command === 'delete') {
      const idIdx = args.indexOf('--id');
      const eventId = idIdx !== -1 ? args[idIdx + 1] : undefined;
      if (!eventId) {
        console.error('Ошибка: Необходимо указать --id <event_id>');
        process.exit(1);
      }
      await deleteCalendarEvent(eventId);
      console.log(`\n🗑️ Событие ${eventId} успешно удалено из Google Календаря.\n`);
    } else if (command === 'task:list') {
      const getArg = (flag: string): string | undefined => {
        const idx = args.indexOf(flag);
        return idx !== -1 ? args[idx + 1] : undefined;
      };
      const category = getArg('--category');
      const lists = await listGoogleTasks(category);

      console.log(`\n📋 Задачи в Google Tasks:`);
      for (const l of lists) {
        console.log(`\n📂 Список: ${l.listTitle} (${l.tasks.length} задач):`);
        for (const t of l.tasks) {
          const dueStr = t.due ? ` [Дедлайн: ${t.due.split('T')[0]}]` : '';
          console.log(`  ◻️ ${t.title}${dueStr} (ID: ${t.id})`);
          if (t.notes) {
            console.log(`     ${t.notes.split('\n')[0]}...`);
          }
        }
      }
      console.log('');
    } else if (command === 'task:create') {
      const title = getArg('--title');
      const category = getArg('--category') || 'Legal';
      const due = getArg('--due');
      const notes = getArg('--notes') || getArg('--desc');
      const listName = getArg('--list');
      const addToBoth = args.includes('--both');

      if (!title) {
        console.error('Ошибка: Необходимо указать --title "Название задачи"');
        process.exit(1);
      }

      const res = await createGoogleTask({
        title,
        category,
        dueDate: due,
        notes,
        listName,
        addToBoth,
      });

      console.log(`\n✅ Задача успешно создана в Google Tasks!`);
      console.log(`• Список: ${res.category}`);
      console.log(`• Заголовок: ${res.task.title}`);
      if (res.task.due) console.log(`• Дедлайн: ${res.task.due.split('T')[0]}`);
      console.log(`• ID: ${res.task.id}`);
      if (res.secondaryTask) {
        console.log(`• Также добавлена в общий список 'Tasks' (ID: ${res.secondaryTask.id})`);
      }
      console.log('');
    } else if (command === 'task:complete') {
      const getArg = (flag: string): string | undefined => {
        const idx = args.indexOf(flag);
        return idx !== -1 ? args[idx + 1] : undefined;
      };
      const id = getArg('--id');
      const category = getArg('--category') || 'Legal';
      if (!id) {
        console.error('Ошибка: Необходимо указать --id <task_id>');
        process.exit(1);
      }
      await completeGoogleTask(id, category);
      console.log(`\n✅ Задача ${id} отмечена как выполненная (вычеркнута)!\n`);
    } else if (command === 'task:delete') {
      const getArg = (flag: string): string | undefined => {
        const idx = args.indexOf(flag);
        return idx !== -1 ? args[idx + 1] : undefined;
      };
      const id = getArg('--id');
      const category = getArg('--category') || 'Legal';
      if (!id) {
        console.error('Ошибка: Необходимо указать --id <task_id>');
        process.exit(1);
      }
      await deleteGoogleTask(id, category);
      console.log(`\n🗑️ Задача ${id} успешно удалена из Google Tasks.\n`);
    } else {
      console.error(`Неизвестная команда: ${command}. Запустите с флагом --help.`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`\n❌ Ошибка работы с Google Calendar / Tasks:`, err.message || err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
