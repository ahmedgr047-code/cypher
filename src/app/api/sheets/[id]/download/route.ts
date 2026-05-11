import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
    return new NextResponse('غير مصرح', { status: 401 });
  }

  const { data: row, error } = await supabase
    .from('sheet_archive')
    .select('storage_object_path,file_name,mime_type,file_url')
    .eq('id', id)
    .single();

  if (error) {
    return new NextResponse('غير موجود', { status: 404 });
  }

  // إذا كان file_url موجود، هذا رابط خارجي (Google Drive مثلاً)
  if (row?.file_url) {
    // نعيد توجيه المستخدم للرابط مباشرة
    return NextResponse.redirect(row.file_url, { status: 302 });
  }

  // إذا لم يكن هناك file_url، نتحقق من storage_object_path
  if (!row?.storage_object_path) {
    return new NextResponse('غير موجود', { status: 404 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return new NextResponse('إعدادات الخادم', { status: 503 });
  }

  const { data: blob, error: stErr } = await admin.storage
    .from('sheets')
    .download(row.storage_object_path);

  if (stErr || !blob) {
    console.error('storage download', stErr);
    return new NextResponse('الملف غير متوفر', { status: 404 });
  }

  const buf = await blob.arrayBuffer();
  const headers = new Headers();
  headers.set(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name || 'sheet.pdf')}`
  );
  if (row.mime_type) headers.set('Content-Type', row.mime_type);
  else headers.set('Content-Type', 'application/pdf');

  return new NextResponse(buf, { headers });
}
