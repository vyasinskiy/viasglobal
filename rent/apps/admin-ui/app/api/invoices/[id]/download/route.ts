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
      // Проверяем, является ли ссылка внешней публичной (например реальный S3 bucket в облаке)
      const isExternalPublic = data.downloadUrl.startsWith('https://') &&
        !data.downloadUrl.includes('accountant') &&
        !data.downloadUrl.includes('localhost');

      if (isExternalPublic) {
        return NextResponse.redirect(data.downloadUrl);
      }

      // Если ссылка локальная или во внутренней сети Docker (accruals-accountant / accountant / localhost)
      // Проксируем файл напрямую клиенту, чтобы браузер не пытался резолвить внутренние хосты Docker
      const fileRes = await fetch(data.downloadUrl);
      if (fileRes.ok) {
        const blob = await fileRes.arrayBuffer();
        const filename = data.invoice?.periodLabel && data.invoice?.accountExternalId
          ? `${data.invoice.periodLabel}_${data.invoice.accountExternalId}.pdf`
          : `invoice_${id}.pdf`;

        return new NextResponse(blob, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    }

    return NextResponse.json({ error: 'Invoice PDF download URL not found or storage is empty' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
