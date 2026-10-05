import { NextResponse, type NextRequest } from 'next/server';
import { accountantClient } from '../../../../../lib/accountant-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const { data } = await accountantClient.get(`/invoices/${id}`);
    if (data && data.downloadUrl) {
      // Если ссылка внутренняя (в сети Docker), скачиваем и отдаем файл напрямую клиенту
      if (data.downloadUrl.startsWith('http://accountant:') || data.downloadUrl.startsWith('http://localhost:')) {
        const fileRes = await fetch(data.downloadUrl);
        if (fileRes.ok) {
          const blob = await fileRes.arrayBuffer();
          const filename = data.invoice?.periodLabel && data.invoice?.accountExternalId
            ? `${data.invoice.periodLabel}_${data.invoice.accountExternalId}.pdf`
            : `invoice_${id}.pdf`;

          return new NextResponse(blob, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${filename}"`
            }
          });
        }
      }
      return NextResponse.redirect(data.downloadUrl);
    }

    return NextResponse.json({ error: 'Invoice PDF download URL not found or storage is empty' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
