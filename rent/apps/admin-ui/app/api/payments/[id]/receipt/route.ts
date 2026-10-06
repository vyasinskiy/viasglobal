import { NextResponse } from 'next/server';
import { accountantClient } from '../../../../../lib/accountant-client';

/**
 * Прикрепление чека к платежу (POST)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { data } = await accountantClient.post(`/payments/${params.id}/receipt`, body);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Удаление прикрепленного чека у платежа (DELETE)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data } = await accountantClient.delete(`/payments/${params.id}/receipt`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Получение ссылки на просмотр/скачивание чека платежа (GET)
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data } = await accountantClient.get(`/payments/${params.id}/receipt`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
