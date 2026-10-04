// rent/apps/admin-ui/middleware.ts
// Промежуточный слой Next.js для защиты всех страниц и эндпоинтов паролем
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await isAuthenticated(req);

  // Обработка запросов к API
  if (pathname.startsWith('/api/')) {
    // Разрешаем проверку health и маршруты аутентификации без куки
    if (pathname.startsWith('/api/auth/') || pathname === '/api/health') {
      return NextResponse.next();
    }
    // Если сессия невалидна, отдаем 401 Unauthorized
    if (!authed) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Если пользователь не авторизован и идет не на /login, перенаправляем на форму логина
  if (!authed) {
    if (pathname === '/login') {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Если пользователь уже авторизован и зашел на /login, перенаправляем в корень
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

// Конфигурация путей, на которых работает middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
