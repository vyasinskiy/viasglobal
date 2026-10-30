// ecommerce/crm/lib/accountant-client.ts
// Клиент для обращений к микросервису viasrent-accountant
import axios from 'axios';

const ACCOUNTANT_API_URL = process.env.ACCOUNTANT_API_URL || 'http://viasrent-accountant:3005';

export const accountantClient = axios.create({
  baseURL: `${ACCOUNTANT_API_URL}/accountant`,
});

