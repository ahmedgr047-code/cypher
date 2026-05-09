import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name,student_id')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    email: user.email,
    fullName: profile?.full_name ?? user.email?.split('@')[0] ?? 'مستخدم',
    studentId: profile?.student_id ?? null,
  });
}
