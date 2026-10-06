import { NextResponse, type NextRequest } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    if (fileId.startsWith('data:')) {
      const matches = fileId.match(/^data:(.+?);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        return new Response(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
      return NextResponse.json({ error: 'Invalid Data URI format' }, { status: 400 });
    }

    // Если чек уже является внешней ссылкой (HTTP/HTTPS)
    if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
      return NextResponse.redirect(fileId);
    }

    // Сначала пробуем получить файл чека из хранилища S3 или локального каталога uploads accountant
    try {
      const { accountantClient } = await import('../../../../lib/accountant-client');
      const { data } = await accountantClient.get(`/payments/receipt/signed-url?key=${encodeURIComponent(fileId)}`);
      if (data?.downloadUrl) {
        // Если это внешний публичный URL (например реальный S3 bucket https://...)
        const isExternal = data.downloadUrl.startsWith('https://') &&
          !data.downloadUrl.includes('accountant') &&
          !data.downloadUrl.includes('localhost');
        if (isExternal) {
          return NextResponse.redirect(data.downloadUrl);
        }

        // Иначе это локальный сервис accountant (http://...:3005/...)
        // Скачиваем бинарный файл через внутренний клиент и отдаем клиенту
        const fileRes = await accountantClient.get(`/storage/download?key=${encodeURIComponent(fileId)}`, {
          responseType: 'arraybuffer',
        });
        const contentType = fileRes.headers['content-type'] || 
          (fileId.toLowerCase().endsWith('.pdf') || fileId === '***' ? 'application/pdf' : 'image/jpeg');

        return new Response(fileRes.data, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${fileId.split('/').pop() || 'receipt'}"`,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    } catch {
      // Если файл не найден в accountant, пробуем Telegram API fallback ниже
    }

    if (!token) {
      return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 500 });
    }

    // 1. Get file path from Telegram API
    const fileInfoUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
    const fileInfoRes = await axios.get(fileInfoUrl);
    const filePath = fileInfoRes.data?.result?.file_path;

    if (!filePath) {
      return NextResponse.json({ error: 'Failed to retrieve file path from Telegram' }, { status: 404 });
    }

    // 2. Download the actual image
    const fileDownloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const imageRes = await axios.get(fileDownloadUrl, { responseType: 'arraybuffer' });

    // 3. Return the image as response with correct content-type
    const contentType = imageRes.headers['content-type'] || 'image/jpeg';
    return new Response(imageRes.data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
