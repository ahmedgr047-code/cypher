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

  // Try to get user's custom chips first
  const { data: userChips, error: userError } = await supabase
    .from('user_quick_chips')
    .select('label,sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  // If user has custom chips, return them
  if (!userError && userChips && userChips.length > 0) {
    const labels = userChips.map((r) => r.label);
    return NextResponse.json({ chips: labels });
  }

  // Otherwise, get default chips
  const { data, error } = await supabase
    .from('quick_chips')
    .select('label,sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Arabic Fus-ha chips
  const defaultChips = (data ?? []).map((r) => r.label);
  const enhancedChips = [
    "أريد مساعدة في مشكلة برمجية",
    "أعطني فكرة لمشروع جديد",
    "اشرح لي هذا المفهوم التقني",
    "كيف أبدأ تعلم البرمجة؟",
    "الكود لا يعمل بشكل صحيح",
    "عندي خطأ في بايثون",
    "ساعدني في إصلاح كود HTML",
    "كيف أنشئ موقع ويب؟",
    "ما رأيك في هذه الفكرة؟",
    "تحقق من هذا الكود",
    ...defaultChips
  ];
  
  return NextResponse.json({ chips: enhancedChips });
}
