/*
  # إضافة جدول sheet_archive

  1. New Tables
    - `sheet_archive` - تخزين معلومات الملفات المرفوعة
      - `id` (uuid, primary key)
      - `storage_object_path` (text, unique) - مسار الملف في bucket storage
      - `file_name` (text) - اسم الملف الأصلي
      - `caption` (text) - وصف المادة (يُستخدم في البحث)
      - `mime_type` (text) - نوع الملف (PDF, image, text)
      - `file_size` (bigint) - حجم الملف بالبايت
      - `created_at` (timestamp) - وقت الإضافة

  2. Security
    - تفعيل RLS على الجدول
    - سياسة للقراءة العامة (جميع المستخدمين يقرأون)
    - سياسات للإدراج والتعديل والحذف (للمستخدمين المسجلين فقط)

  3. Important
    - يجب إنشاء bucket "sheets" يدوياً من Supabase Dashboard
*/

CREATE TABLE IF NOT EXISTS public.sheet_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_object_path text NOT NULL UNIQUE,
  file_name text NOT NULL DEFAULT 'sheet',
  caption text,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sheet_archive_created_at_idx
  ON public.sheet_archive (created_at DESC);

ALTER TABLE public.sheet_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sheet_archive_select_all" ON public.sheet_archive;
CREATE POLICY "sheet_archive_select_all"
  ON public.sheet_archive FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "sheet_archive_insert_authenticated" ON public.sheet_archive;
CREATE POLICY "sheet_archive_insert_authenticated"
  ON public.sheet_archive FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "sheet_archive_update_authenticated" ON public.sheet_archive;
CREATE POLICY "sheet_archive_update_authenticated"
  ON public.sheet_archive FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "sheet_archive_delete_authenticated" ON public.sheet_archive;
CREATE POLICY "sheet_archive_delete_authenticated"
  ON public.sheet_archive FOR DELETE
  TO authenticated
  USING (true);
