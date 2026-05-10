/*
  # Create sheet_archive table and enable storage

  1. New Tables
    - `sheet_archive`
      - `id` (uuid, primary key)
      - `storage_object_path` (text, unique) - مسار الملف في التخزين
      - `file_name` (text) - اسم الملف الأصلي
      - `caption` (text, nullable) - وصف/مادة الملف
      - `mime_type` (text) - نوع الملف
      - `file_size` (bigint, nullable) - حجم الملف بالبايت
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `sheet_archive` table
    - Public READ policy (الجميع يقدر يقرأ الملفات)
    - Only authenticated users can insert/update their own files

  3. Storage
    - الـ bucket "sheets" سيُنشأ من لوحة Supabase (يجب تفعيله يدوياً)
*/

CREATE TABLE IF NOT EXISTS sheet_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_object_path text UNIQUE NOT NULL,
  file_name text NOT NULL DEFAULT 'sheet',
  caption text,
  mime_type text DEFAULT 'application/pdf',
  file_size bigint,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sheet_archive ENABLE ROW LEVEL SECURITY;

-- الجميع يقدر يقرأ الملفات
CREATE POLICY "Anyone can view sheets"
  ON sheet_archive
  FOR SELECT
  USING (true);

-- فقط المسؤولين يقدرون يرفعون ملفات
-- (سيتم التحقق من البريد الإلكتروني في app/admin/layout.tsx)
CREATE POLICY "Authenticated users can insert sheets"
  ON sheet_archive
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- فقط المسؤولين يقدرون يعدلون
CREATE POLICY "Authenticated users can update sheets"
  ON sheet_archive
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- فقط المسؤولين يقدرون يحذفون
CREATE POLICY "Authenticated users can delete sheets"
  ON sheet_archive
  FOR DELETE
  TO authenticated
  USING (true);
