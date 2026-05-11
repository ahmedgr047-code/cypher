'use client';

import React, { useState } from 'react';
import { Upload, FileText, Link2, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export const SHEET_MAX_BYTES = 50 * 1024 * 1024;

function safeFileName(name: string) {
  const latinOnly = name
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .trim();
  return latinOnly.slice(0, 50) || 'file';
}

function convertGoogleDriveLink(url: string): string {
  const patterns = [
    /\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /\/\/drive\.google\.com\/uc\?.*?id=([a-zA-Z0-9_-]+)/,
    /\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  
  const idMatch = url.match(/([a-zA-Z0-9_-]{25,})/);
  if (idMatch) {
    return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
  }
  
  return url;
}

function isValidUrl(url: string): boolean {
  return url.startsWith('https://') && url.length > 10;
}

type TabType = 'file' | 'link';

type SheetUploadFormProps = {
  onSuccess?: () => void;
};

export default function SheetUploadForm({ onSuccess }: SheetUploadFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkFileName, setLinkFileName] = useState('');
  const [sharedCaption, setSharedCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setFile(null);
    setLinkUrl('');
    setLinkFileName('');
    setSharedCaption('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const uploadFile = async (userId: string, supabase: any) => {
    if (!file) return { success: false, error: 'لا يوجد ملف' };
    
    if (file.size > SHEET_MAX_BYTES) {
      return { success: false, error: 'الملف كبير جداً (الحد 50 ميجا)' };
    }

    const objectName = `${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const path = `${userId}/${objectName}`;

    try {
      const { error: upErr } = await supabase.storage.from('sheets').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/pdf',
      });
      
      if (upErr) {
        return { success: false, error: upErr.message || 'فشل الرفع للتخزين' };
      }

      const finalCaption = sharedCaption.trim() || null;
      
      const reg = await fetch('/api/sheets/register-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'file',
          path,
          caption: finalCaption,
          fileName: file.name,
          mimeType: file.type || null,
          fileSize: file.size,
        }),
      });
      
      const j = await reg.json();
      if (!reg.ok) {
        await supabase.storage.from('sheets').remove([path]);
        return { success: false, error: j.error || 'فشل تسجيل الشيت' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'حدث خطأ غير متوقع' };
    }
  };

  const saveLink = async () => {
    if (!isValidUrl(linkUrl)) {
      return { success: false, error: 'الرابط يجب أن يبدأ بـ https://' };
    }

    const convertedUrl = convertGoogleDriveLink(linkUrl);
    const finalFileName = linkFileName.trim() || 'ملف خارجي';
    const finalCaption = sharedCaption.trim() || null;

    try {
      const reg = await fetch('/api/sheets/register-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'link',
          fileUrl: convertedUrl,
          caption: finalCaption,
          fileName: finalFileName,
          mimeType: 'application/pdf',
          fileSize: 0,
        }),
      });
      
      const j = await reg.json();
      if (!reg.ok) {
        return { success: false, error: j.error || 'فشل حفظ الرابط' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'حدث خطأ غير متوقع' };
    }
  };

  const handleSubmit = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('سجّل الدخول أولاً');
      return;
    }

    setUploading(true);

    if (activeTab === 'file') {
      if (!file) {
        toast.error('اختر ملفاً أولاً');
        setUploading(false);
        return;
      }

      const result = await uploadFile(user.id, supabase);

      if (result.success) {
        toast.success('تم رفع الشيت بنجاح');
        reset();
        onSuccess?.();
      } else {
        toast.error(result.error || 'فشل الرفع');
      }
    } else {
      if (!linkUrl.trim() || !linkFileName.trim()) {
        toast.error('أدخل الرابط واسم الملف');
        setUploading(false);
        return;
      }

      const result = await saveLink();

      if (result.success) {
        toast.success('تم حفظ الرابط بنجاح');
        reset();
        onSuccess?.();
      } else {
        toast.error(result.error || 'فشل الحفظ');
      }
    }

    setUploading(false);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
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
          <FileText size={16} />
          رفع ملف
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

      {/* الوصف المشترك */}
      <label className="block">
        <span className="text-sm font-medium text-muted-foreground mb-2 block">
          الوصف / المادة <span className="text-xs text-muted-foreground">(يُستخدم في البحث)</span>
        </span>
        <input
          type="text"
          value={sharedCaption}
          onChange={(e) => setSharedCaption(e.target.value)}
          disabled={uploading}
          placeholder="مثال: أساسيات الشبكات"
          className="input-field w-full text-sm py-3"
        />
      </label>

      {/* محتوى Tab رفع الملف */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-muted-foreground mb-2 block">اختيار ملف</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
              disabled={uploading}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-border file:bg-muted file:text-foreground"
              onChange={handleFileChange}
            />
          </label>

          {file && (
            <div className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-primary flex-shrink-0" />
                <span className="text-sm truncate flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground font-mono-data">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* محتوى Tab إضافة رابط */}
      {activeTab === 'link' && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-muted-foreground mb-2 block">رابط الملف</span>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={uploading}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full text-sm p-3 rounded-lg border border-border bg-background input-field"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-muted-foreground mb-2 block">اسم الملف</span>
            <input
              type="text"
              value={linkFileName}
              onChange={(e) => setLinkFileName(e.target.value)}
              disabled={uploading}
              placeholder="مثال: شيت الشبكات.pdf"
              className="w-full text-sm p-3 rounded-lg border border-border bg-background input-field"
            />
          </label>
        </div>
      )}

      {/* زر الحفظ */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={uploading || (activeTab === 'file' ? !file : !linkUrl || !linkFileName)}
        className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl"
      >
        {uploading ? (
          <>جاري الحفظ...</>
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
