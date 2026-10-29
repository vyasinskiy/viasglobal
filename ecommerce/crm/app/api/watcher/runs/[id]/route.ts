import { NextResponse } from 'next/server';
import { watcherClient } from '../../../../../lib/watcher-client';

/**
 * Обработчик GET-запроса для получения данных конкретного запуска сканирования по ID
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Вызываем прямой эндпоинт микросервиса watcher
    const { data } = await watcherClient.get(`/scraping/runs/${params.id}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    // Отказоустойчивый запасной вариант: если сервис watcher еще не перезагрузился с новым роутом,
    // запрашиваем список последних запусков и находим запуск по ID в памяти
    try {
      const { data: runs } = await watcherClient.get('/scraping/runs');
      if (Array.isArray(runs)) {
        const found = runs.find((r: any) => String(r.id) === String(params.id));
        if (found) {
          return NextResponse.json(found);
        }
      }
    } catch {
      // Игнорируем ошибку резервного запроса
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
