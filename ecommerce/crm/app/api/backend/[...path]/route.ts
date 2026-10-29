// ecommerce/crm/app/api/backend/[...path]/route.ts
// Универсальный серверный BFF-прокси для маршрутизации запросов из браузера во внутренний контейнер backend:3000
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Базовый адрес микросервиса ecommerce/backend внутри Docker-сети или локального окружения
function getBackendBaseUrl(): string {
  return (process.env.BACKEND_API_URL || 'http://backend:3000').replace(/\/+$/, '');
}

// Общий обработчик проксирования HTTP-методов (GET, POST, PATCH, PUT, DELETE)
async function proxyRequest(
  req: NextRequest,
  context: { params: { path: string[] } }
) {
  try {
    // Безопасное формирование относительного пути из массива сегментов
    const rawPath = context.params?.path;
    const subPath = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath || '');
    const search = req.nextUrl.search || '';
    const targetUrl = `${getBackendBaseUrl()}/${subPath}${search}`;

    // Подготавливаем заголовки для пересылки на бэкенд
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    const contentType = req.headers.get('content-type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    // Для изменяющих методов считываем тело запроса
    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const rawBody = await req.text();
      if (rawBody) {
        body = rawBody;
      }
    }

    // Выполняем запрос к контейнеру backend
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseText = await upstreamRes.text();
    let parsedJson: unknown;
    try {
      parsedJson = responseText ? JSON.parse(responseText) : {};
    } catch {
      parsedJson = { raw: responseText };
    }

    return NextResponse.json(parsedJson, { status: upstreamRes.status });
  } catch (err: any) {
    console.error('Ошибка проксирования запроса к backend API:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Не удалось связаться с сервисом ecommerce/backend',
        error: err?.message || 'Backend connection error',
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxyRequest(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxyRequest(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxyRequest(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxyRequest(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxyRequest(req, ctx);
}

