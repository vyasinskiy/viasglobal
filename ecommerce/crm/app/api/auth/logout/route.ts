// ecommerce/crm/app/api/auth/logout/route.ts
// Обработчик завершения сессии и сброса авторизационной cookie в Viasglobal CRM
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Очищаем куку, выставляя нулевой срок жизни
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
  return response;
}

