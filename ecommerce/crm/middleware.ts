// ecommerce/crm/middleware.ts
// Промежуточный слой Next.js для защиты всех страниц и эндпоинтов Viasglobal CRM паролем
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated, SESSION_COOKIE, sessionCookieOptions } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await isAuthenticated(req);

  // Обработка запросов к внутренним API маршрутам
  if (pathname.startsWith('/api/')) {
    // Разрешаем публичную проверку здоровья и маршруты входа/выхода без куки
    if (pathname.startsWith('/api/auth/') || pathname === '/api/health') {
      return NextResponse.next();
    }
    // Если сессия невалидна, возвращаем 401 Unauthorized
    if (!authed) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Если пользователь не авторизован и запрашивает защищенную страницу, перенаправляем на /login
  if (!authed) {
    if (pathname === '/login') {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Если пользователь уже авторизован и открыл /login, перенаправляем на главный дашборд
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Для авторизованных переходов автоматически продлеваем срок действия cookie (скользящая сессия 400 дней)
  const res = NextResponse.next();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const cookieOpts = await sessionCookieOptions(token);
    res.cookies.set(cookieOpts);
  }

  return res;
}

// Исключаем статические ресурсы из проверки middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png).*)'],
};

