// ecommerce/crm/lib/watcher-client.ts
// Клиент для обращений к микросервису viasrent-watcher
import axios from 'axios';

const WATCHER_API_URL = process.env.WATCHER_API_URL || 'http://viasrent-watcher:4500';

export const watcherClient = axios.create({
  baseURL: WATCHER_API_URL,
});

