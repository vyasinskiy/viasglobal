// ecommerce/crm/lib/watcher-client.ts
// Клиент для обращений к микросервису accruals-watcher
import axios from 'axios';

const WATCHER_API_URL = process.env.WATCHER_API_URL || 'http://accruals-watcher:4500';

export const watcherClient = axios.create({
  baseURL: WATCHER_API_URL,
});

