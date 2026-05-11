'use client';

import React, { useState } from 'react';
import { Upload, FileText, Link2, File, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export const SHEET_MAX_BYTES = 50 * 1024 * 1024;

function safeFileName(name: string) {
  // نخلي بس اللاتيني والأرقام والنقطة والشرطة — نحذف العربي من اسم الملف في التخزين
  const latinOnly = name
    .replace(/[^\w.\-]+/g, '_')  // نحذف كل شي ما عدا a-z, 0-9, ., -, _
    .replace(/_+/g, '_')        // ندمج الشرطات المتكررة
    .trim();
  return latinOnly.slice(0, 50) || 'file';  // نختصر لـ 50 حرف بس
}

// تحويل رابط Google Drive إلى رابط تحميل مباشر
function convertGoogleDriveLink(url: string): string {
  // أنماط روابط Google Drive المختلفة
  const patterns = [
    /\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,                    // /file/d/FILE_ID/view
    /\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,                    // /open?id=FILE_ID
    /\/\/drive\.google\.com\/uc\?.*?id=([a-zA-Z0-9_-]+)/,                   // /uc?id=FILE_ID
    /\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/,             // /file/d/FILE_ID/view
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  
  // إذا كان الرابط يحتوي على ID في أي شكل آخر
  const idMatch = url.match(/([a-zA-Z0-9_-]{25,})/);
  if (idMatch) {
    return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
  }
  
  return url;
}

// التحقق من صحة الرابط
function isValidUrl(url: string): boolean {
  return url.startsWith('https://') && url.length > 10;
}

type TabType = 'file' | 'link';

type SheetUploadFormProps = {
  /** بعد نجاح الرفع */
  onSuccess?: () => void;
};

export default function SheetUploadForm({ onSuccess }: SheetUploadFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setFile(null);
    setExternalUrl('');
    setFileName('');
    setCaption('');
  };

  const handleSubmit = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error('سجّل الدخول أولاً');
      return;
    }

    // وضع رفع الملف
    if (activeTab === 'file') {
      if (!file) {
        toast.error('اختر ملفاً');
        return;
      }
      if (file.size > SHEET_MAX_BYTES) {
        toast.error('الملف كبير جداً (الحد 50 ميجا)');
        return;
      }

      const objectName = `${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const path = `${user.id}/${objectName}`;

      setUploading(true);
      try {
        const { error: upErr } = await supabase.storage.from('sheets').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/pdf',
        });
        if (upErr) {
          console.error(upErr);
          toast.error(upErr.message || 'فشل الرفع للتخزين — هل شغّلت ترحيل SQL للـ bucket sheets؟');
          return;
        }

        const reg = await fetch('/api/sheets/register-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'file',
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
      return;
    }

    // وضع إضافة رابط
    if (activeTab === 'link') {
      const url = externalUrl.trim();
      if (!url) {
        toast.error('أدخل الرابط');
        return;
      }
      if (!isValidUrl(url)) {
        toast.error('الرابط يجب أن يبدأ بـ https://');
        return;
      }

      const convertedUrl = convertGoogleDriveLink(url);
      const finalFileName = fileName.trim() || 'ملف خارجي';

      setUploading(true);
      try {
        const reg = await fetch('/api/sheets/register-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'link',
            fileUrl: convertedUrl,
            caption: caption.trim() || null,
            fileName: finalFileName,
            mimeType: 'application/pdf',
            fileSize: 0,
          }),
        });
        const j = await reg.json();
        if (!reg.ok) {
          toast.error(j.error || 'فشل حفظ الرابط');
          return;
        }

        toast.success('تم حفظ الرابط — يمكن للطلاب البحث عنه الآن');
        reset();
        onSuccess?.();
      } finally {
        setUploading(false);
      }
      return;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs للتبديل بين رفع ملف وإضافة رابط */}
      <div className="flex rounded-xl bg-muted p-1 border border-border">
        <button
          type="button"
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'file'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <File size={16} />
          رفع ملف مباشر
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('link')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'link'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link2 size={16} />
          إضافة رابط
        </button>
      </div>

      {/* محتوى Tab رفع الملف */}
      {activeTab === 'file' && (
        <>
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
        </>
      )}

      {/* محتوى Tab إضافة رابط */}
      {activeTab === 'link' && (
        <>
          <label className="block">
            <span className="text-sm font-medium text-muted-foreground mb-2 block">
              رابط الملف الخارجي <span className="text-xs text-destructive">(يجب أن يبدأ بـ https://)</span>
            </span>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              disabled={uploading}
              placeholder="https://drive.google.com/file/d/..."
              className="input-field w-full text-sm py-3"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              يتم تحويل روابط Google Drive تلقائياً إلى روابط تحميل مباشر
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-muted-foreground mb-2 block">
              اسم الملف <span className="text-xs text-destructive">(مطلوب)</span>
            </span>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={uploading}
              placeholder="مثال: شيت الشبكات.pdf"
              className="input-field w-full text-sm py-3"
            />
          </label>
        </>
      )}

      {/* الوصف المشترك */}
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

      {/* زر الحفظ */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={uploading || (activeTab === 'file' && !file) || (activeTab === 'link' && (!externalUrl || !fileName))}
        className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl"
      >
        {uploading ? (
          <>جاري الحفظ…</>
        ) : activeTab === 'file' ? (
          <>
            <Upload size={18} />
            رفع وحفظ في الأرشيف
          </>
        ) : (
          <>
            <ExternalLink size={18} />
            حفظ الرابط
          </>
        )}
      </button>
    </div>
  );
}
