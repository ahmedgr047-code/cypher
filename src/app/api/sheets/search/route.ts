import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function sanitizeLike(q: string): string {
  return q.replace(/%/g, '').trim().slice(0, 120);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('q')?.trim() ?? '';
  if (!raw) {
    return NextResponse.json({ sheets: [] as unknown[] });
  }

  const safe = sanitizeLike(raw);
  if (!safe) {
    return NextResponse.json({ sheets: [] as unknown[] });
  }

  const pattern = `%${safe}%`;

  const [{ data: byName, error: e1 }, { data: byCaption, error: e2 }] = await Promise.all([
    supabase
      .from('telegram_sheets')
      .select('id,file_name,caption,file_size,mime_type,created_at')
      .ilike('file_name', pattern)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('telegram_sheets')
      .select('id,file_name,caption,file_size,mime_type,created_at')
      .ilike('caption', pattern)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (e1 || e2) {
    return NextResponse.json({ error: e1?.message || e2?.message }, { status: 500 });
  }

  const map = new Map<string, (typeof byName)[0]>();
  for (const row of [...(byName ?? []), ...(byCaption ?? [])]) {
    if (row?.id) map.set(row.id, row);
  }
  const sheets = [...map.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return NextResponse.json({ sheets });
}
