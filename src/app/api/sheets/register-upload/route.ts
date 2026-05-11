import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: {
    type?: 'file' | 'link';
    path?: string;
    fileUrl?: string;
    caption?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 });
  }

  const type = body.type || 'file';

  // وضع رفع ملف مباشر
  if (type === 'file') {
    const path = body.path?.trim();
    if (!path) {
      return NextResponse.json({ error: 'path مطلوب' }, { status: 400 });
    }

    const prefix = `${user.id}/`;
    if (!path.startsWith(prefix)) {
      return NextResponse.json({ error: 'مسار غير مسموح' }, { status: 403 });
    }

    const size = typeof body.fileSize === 'number' ? body.fileSize : 0;
    if (size <= 0 || size > MAX_BYTES) {
      return NextResponse.json({ error: 'حجم الملف غير مقبول' }, { status: 400 });
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({ error: 'إعدادات الخادم' }, { status: 503 });
    }

    const lastSlash = path.lastIndexOf('/');
    const folder = lastSlash <= 0 ? '' : path.slice(0, lastSlash);
    const fname = lastSlash < 0 ? path : path.slice(lastSlash + 1);
    const { data: listed, error: listErr } = await admin.storage.from('sheets').list(folder, {
      limit: 1000,
    });
    if (listErr || !listed?.some((o) => o.name === fname)) {
      return NextResponse.json({ error: 'الملف غير موجود في التخزين بعد الرفع' }, { status: 400 });
    }

    const { data: inserted, error: insErr } = await admin
      .from('sheet_archive')
      .insert({
        storage_object_path: path,
        file_name: body.fileName?.trim() || path.split('/').pop() || 'sheet',
        caption: body.caption?.trim() || null,
        mime_type: body.mimeType?.trim() || 'application/pdf',
        file_size: size,
        file_url: null,
      })
      .select('id')
      .single();

    if (insErr) {
      console.error('register-upload insert', insErr);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: inserted.id });
  }

  // وضع إضافة رابط خارجي
  if (type === 'link') {
    const fileUrl = body.fileUrl?.trim();
    if (!fileUrl) {
      return NextResponse.json({ error: 'fileUrl مطلوب' }, { status: 400 });
    }
    if (!fileUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'يجب أن يبدأ الرابط بـ https://' }, { status: 400 });
    }

    const fileName = body.fileName?.trim() || 'ملف خارجي';

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({ error: 'إعدادات الخادم' }, { status: 503 });
    }

    const { data: inserted, error: insErr } = await admin
      .from('sheet_archive')
      .insert({
        storage_object_path: '', // فارغ للروابط الخارجية
        file_name: fileName,
        caption: body.caption?.trim() || null,
        mime_type: body.mimeType?.trim() || 'application/pdf',
        file_size: 0,
        file_url: fileUrl,
      })
      .select('id')
      .single();

    if (insErr) {
      console.error('register-upload insert link', insErr);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: inserted.id });
  }

  return NextResponse.json({ error: 'type غير صالح' }, { status: 400 });
}
