// ecommerce/crm/app/api/auth/login/route.ts
// Обработчик проверки пароля и установки сессионной куки в Viasglobal E-Commerce CRM
import { NextResponse } from 'next/server';
import { passwordValid, sessionCookieOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Извлекаем тело запроса с паролем
    const body = (await req.json()) as { password?: string };
    const password = body.password || '';

    // Сверяем введенный пароль с эталонным
    if (!passwordValid(password)) {
      return NextResponse.json(
        { success: false, error: 'Неверный пароль администратора' },
        { status: 401 }
      );
    }

    // При успешной проверке выдаем HTTP-Only cookie с подписанным HMAC-токеном
    const response = NextResponse.json({ success: true });
    const cookieOpts = await sessionCookieOptions();
    response.cookies.set(cookieOpts);
    return response;
  } catch (error) {
    console.error('Ошибка при входе в систему CRM:', error);
    return NextResponse.json(
      { success: false, error: 'Некорректный формат запроса' },
      { status: 400 }
    );
  }
}

