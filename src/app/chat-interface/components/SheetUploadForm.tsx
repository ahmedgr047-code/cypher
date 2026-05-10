'use client';

import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export const SHEET_MAX_BYTES = 50 * 1024 * 1024;

function safeFileName(name: string) {
  return name.replace(/[^\w.\-\s\u0600-\u06FF]+/g, '_').trim().slice(0, 120) || 'file';
}

type SheetUploadFormProps = {
  /** بعد نجاح الرفع */
  onSuccess?: () => void;
};

export default function SheetUploadForm({ onSuccess }: SheetUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setFile(null);
    setCaption('');
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('اختر ملفاً');
      return;
    }
    if (file.size > SHEET_MAX_BYTES) {
      toast.error('الملف كبير جداً (الحد 50 ميجا)');
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error('سجّل الدخول أولاً');
      return;
    }

    const objectName = `${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const path = `${user.id}/${objectName}`;

    setUploading(true);
    try {
      // التحقق من وجود الـ bucket
      const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
      if (bucketsErr || !buckets?.some(b => b.name === 'sheets')) {
        toast.error('Bucket "sheets" غير موجود. اذهب إلى Supabase Dashboard → Storage → Create bucket → اسمه "sheets"');
        setUploading(false);
        return;
      }

      const { error: upErr } = await supabase.storage.from('sheets').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/pdf',
      });
      if (upErr) {
        console.error(upErr);
        if (upErr.message?.includes('not found')) {
          toast.error('Bucket "sheets" غير موجود. اذهب إلى Supabase Dashboard → Storage → Create bucket → اسمه "sheets" → Create');
        } else {
          toast.error(upErr.message || 'فشل الرفع للتخزين');
        }
        return;
      }

      const reg = await fetch('/api/sheets/register-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          caption: caption.trim() || null,
          fileName: file.name,
          mimeType: file.type || null,
          fileSize: file.size,
        }),
      });
      const j = await reg.json();
      if (!reg.ok) {
        toast.error(j.error || 'فشل تسجيل الشيت');
        await supabase.storage.from('sheets').remove([path]);
        return;
      }

      toast.success('تم حفظ الشيت — يمكن للطلاب البحث عنه الآن');
      reset();
      onSuccess?.();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="text-sm font-medium text-muted-foreground mb-2 block">ملف PDF أو صورة أو نص</span>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
          disabled={uploading}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-border file:bg-muted file:text-foreground"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {file && (
        <div className="flex items-center gap-3 text-sm text-foreground bg-muted/50 rounded-xl px-4 py-3 border border-border">
          <FileText size={18} className="text-primary flex-shrink-0" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-muted-foreground flex-shrink-0 font-mono-data">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
      )}

      <label className="block">
        <span className="text-sm font-medium text-muted-foreground mb-2 block">
          وصف / مادة (يُستخدم في البحث في المحادثة)
        </span>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={uploading}
          rows={4}
          placeholder="مثال: أساسيات الشبكات — الشيت 2"
          className="input-field w-full text-sm resize-y min-h-[100px]"
        />
      </label>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={uploading || !file}
        className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl"
      >
        {uploading ? (
          <>جاري الرفع إلى Supabase…</>
        ) : (
          <>
            <Upload size={18} />
            رفع وحفظ في الأرشيف
          </>
        )}
      </button>
    </div>
  );
}
