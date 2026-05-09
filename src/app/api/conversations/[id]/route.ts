import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let body: { title?: string; preview?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'جسم الطلب غير صالح' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const patch: Record<string, string> = {};
  if (typeof body.title === 'string') patch.title = body.title;
  if (typeof body.preview === 'string') patch.preview = body.preview;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'لا يوجد حقول للتحديث' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('conversations')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id,title,preview,updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  }
  return NextResponse.json({ conversation: data });
}
