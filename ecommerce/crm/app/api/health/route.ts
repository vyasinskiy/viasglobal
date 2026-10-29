// ecommerce/crm/app/api/health/route.ts
// Эндпоинт проверки здоровья веб-панели Viasglobal E-Commerce CRM
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'ecommerce-crm',
      backendApiUrl: process.env.BACKEND_API_URL || 'http://backend:3000',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

