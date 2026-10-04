// rent/apps/admin-ui/app/api/auth/logout/route.ts
// Обработчик сброса авторизационной cookie
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
