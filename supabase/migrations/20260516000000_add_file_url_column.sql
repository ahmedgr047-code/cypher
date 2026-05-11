-- إضافة عمود file_url لدعم الروابط الخارجية (Google Drive وغيرها)

-- إضافة العمود الجديد
alter table public.sheet_archive 
add column if not exists file_url text;

-- إضافة قيد التحقق: إما storage_object_path أو file_url يجب أن يكون موجوداً
-- ملاحظة: هذا التحقق اختياري، يمكن إلغاؤه إذا أردت السماح بوجود السجلات بدون أي منهما

-- تحديث السياسات الأمنية إذا لزم الأمر
-- السياسة الحالية تسمح بالقراءة للمستخدمين المصادقين

comment on column public.sheet_archive.file_url is 
'رابط خارجي للملف (مثل Google Drive). يُستخدم عندما لا يكون الملف مخزناً في Supabase Storage.';
