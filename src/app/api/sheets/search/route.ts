import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function sanitizeLike(q: string): string {
  // نحذف % باش ما يخربش الـ pattern matching
  // ونحتفظ بالعربي والإنجليزي والأرقام
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

  // البحث الأساسي بالنص كامل
  const fullPattern = `%${safe}%`;

  // كمان نبحث بكل كلمة على حدا (أول 3 كلمات)
  const words = safe.split(/\s+/).filter(w => w.length >= 2).slice(0, 3);
  const wordConditions = words.map(w => `file_name.ilike.%${w}%,caption.ilike.%${w}%`).join(',');

  // نجرب البحث بالنص الكامل أولاً
  let byName: any[] | null = null;
  let byCaption: any[] | null = null;
  let e1: any = null;
  let e2: any = null;

  // البحث 1: بالنص الكامل في file_name
  const r1 = await supabase
    .from('sheet_archive')
    .select('id,file_name,caption,file_size,mime_type,created_at')
    .ilike('file_name', fullPattern)
    .order('created_at', { ascending: false })
    .limit(10);
  byName = r1.data;
  e1 = r1.error;

  // البحث 2: بالنص الكامل في caption
  const r2 = await supabase
    .from('sheet_archive')
    .select('id,file_name,caption,file_size,mime_type,created_at')
    .ilike('caption', fullPattern)
    .order('created_at', { ascending: false })
    .limit(10);
  byCaption = r2.data;
  e2 = r2.error;

  // البحث 3: إذا ماكاينش نتايج، نجرب البحث بالكلمات المنفصلة
  let byWords: any[] | null = null;
  if ((!byName || byName.length === 0) && (!byCaption || byCaption.length === 0) && words.length > 1) {
    // نبحث بأول كلمة مهمة (نحذف "شيت"، "مادة"، "ملف" إلخ)
    const stopWords = ['شيت', 'مادة', 'ملف', 'file', 'sheet', 'شيتات'];
    const importantWords = words.filter(w => !stopWords.includes(w.toLowerCase()));
    if (importantWords.length > 0) {
      const mainWord = importantWords[0];
      const wordPattern = `%${mainWord}%`;
      const r3 = await supabase
        .from('sheet_archive')
        .select('id,file_name,caption,file_size,mime_type,created_at')
        .or(`file_name.ilike.${wordPattern},caption.ilike.${wordPattern}`)
        .order('created_at', { ascending: false })
        .limit(10);
      byWords = r3.data;
    }
  }

  if (e1 || e2) {
    return NextResponse.json({ error: e1?.message || e2?.message }, { status: 500 });
  }

  // ندمج النتائج من كل البحوث (byName + byCaption + byWords)
  type SheetResult = { id: string; file_name: string | null; caption: string | null; file_size: number | null; mime_type: string | null; created_at: string };
  const map = new Map<string, SheetResult>();

  const allResults = [...(byName ?? []), ...(byCaption ?? []), ...(byWords ?? [])];
  for (const row of allResults) {
    if (row?.id) map.set(row.id, row as SheetResult);
  }

  const sheets = [...map.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return NextResponse.json({ sheets });
}
