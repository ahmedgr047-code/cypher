import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function streamTelegramFile(fileId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN missing');
  }

  const gr = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
  );
  const gj = (await gr.json()) as {
    ok: boolean;
    description?: string;
    result?: { file_path: string };
  };
  if (!gj.ok || !gj.result?.file_path) {
    throw new Error(gj.description || 'getFile failed');
  }

  const path = gj.result.file_path;
  const fileUrl = `https://api.telegram.org/file/bot${token}/${path}`;
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) {
    throw new Error('file fetch failed');
  }
  return { body: fileRes.body, remotePath: path };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('غير مصرح', { status: 401 });
  }

  const { data: row, error } = await supabase
    .from('telegram_sheets')
    .select('telegram_file_id,file_name,mime_type')
    .eq('id', id)
    .single();

  if (error || !row) {
    return new NextResponse('غير موجود', { status: 404 });
  }

  try {
    const { body, remotePath } = await streamTelegramFile(row.telegram_file_id);
    const fallbackName = remotePath.split('/').pop() || 'sheet';
    const fileName = row.file_name || fallbackName;

    const headers = new Headers();
    headers.set(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );
    if (row.mime_type) {
      headers.set('Content-Type', row.mime_type);
    }

    return new NextResponse(body, { headers });
  } catch (e) {
    console.error('sheet download', e);
    return new NextResponse('خطأ تلغرام', { status: 502 });
  }
}
