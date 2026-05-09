import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (convErr || !conv) {
    return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id,role,content,extra,created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let body: { role?: string; content?: string; extra?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'جسم الطلب غير صالح' }, { status: 400 });
  }

  const { role, content, extra = {} } = body;
  if (!role || !['user', 'assistant'].includes(role) || typeof content !== 'string') {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (convErr || !conv) {
    return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: id,
      role,
      content,
      extra,
    })
    .select('id,role,content,extra,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: data });
}
