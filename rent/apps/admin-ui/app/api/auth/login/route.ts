// rent/apps/admin-ui/app/api/auth/login/route.ts
// Обработчик проверки пароля и установки сессионной куки
import { NextResponse } from 'next/server';
import { passwordValid, sessionCookieOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Извлекаем тело запроса
    const body = (await req.json()) as { password?: string };
    const password = body.password || '';

    // Сверяем введенный пароль
    if (!passwordValid(password)) {
      return NextResponse.json(
        { success: false, error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    // При успешной проверке отдаем cookie с HMAC-токеном
    const response = NextResponse.json({ success: true });
    const cookieOpts = await sessionCookieOptions();
    response.cookies.set(cookieOpts);
    return response;
  } catch (error) {
    console.error('Ошибка при входе в систему:', error);
    return NextResponse.json(
      { success: false, error: 'Некорректный запрос' },
      { status: 400 }
    );
  }
}
