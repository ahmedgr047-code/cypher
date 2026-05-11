'use client';

import React, { useState } from 'react';
import { Upload, FileText, Link2, File, ExternalLink, X, Plus, Layers } from 'lucide-react';
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

type FileItem = {
  id: string;
  file: File;
  caption: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
};

type LinkItem = {
  id: string;
  url: string;
  fileName: string;
  caption: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
};

type SheetUploadFormProps = {
  /** بعد نجاح الرفع */
  onSuccess?: () => void;
};

export default function SheetUploadForm({ onSuccess }: SheetUploadFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const reset = () => {
    setFiles([]);
    setLinks([]);
    setSharedCaption('');
    setProgress({ current: 0, total: 0 });
  };

  // إضافة ملفات متعددة
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FileItem[] = Array.from(selectedFiles).map(file => ({
      id: crypto.randomUUID(),
      file,
      caption: '',
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  // إزالة ملف من القائمة
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // تحديث وصف ملف
  const updateFileCaption = (id: string, caption: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, caption } : f));
  };

  // إضافة رابط جديد
  const addLink = () => {
    const newLink: LinkItem = {
      id: crypto.randomUUID(),
      url: '',
      fileName: '',
      caption: '',
      status: 'pending',
    };
    setLinks(prev => [...prev, newLink]);
  };

  // إزالة رابط من القائمة
  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  // تحديث بيانات رابط
  const updateLink = (id: string, updates: Partial<LinkItem>) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  // رفع ملف واحد
  const uploadSingleFile = async (fileItem: FileItem, userId: string, supabase: any) => {
    const { file, caption } = fileItem;
    
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

      const finalCaption = caption.trim() || sharedCaption.trim() || null;
      
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

  // حفظ رابط واحد
  const saveSingleLink = async (linkItem: LinkItem) => {
    const { url, fileName, caption } = linkItem;
    
    if (!isValidUrl(url)) {
      return { success: false, error: 'الرابط يجب أن يبدأ بـ https://' };
    }

    const convertedUrl = convertGoogleDriveLink(url);
    const finalFileName = fileName.trim() || 'ملف خارجي';
    const finalCaption = caption.trim() || sharedCaption.trim() || null;

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error('سجّل الدخول أولاً');
      return;
    }

    // وضع رفع الملفات
    if (activeTab === 'file') {
      if (files.length === 0) {
        toast.error('اختر ملفاً واحداً على الأقل');
        return;
      }

      setUploading(true);
      setProgress({ current: 0, total: files.length });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < files.length; i++) {
        setProgress({ current: i + 1, total: files.length });
        
        // تحديث الحالة لـ uploading
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'uploading' } : f
        ));

        const result = await uploadSingleFile(files[i], user.id, supabase);

        if (result.success) {
          successCount++;
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'success' } : f
          ));
        } else {
          errorCount++;
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'error', error: result.error } : f
          ));
        }
      }

      if (successCount > 0) {
        toast.success(`تم رفع ${successCount} شيت بنجاح`);
      }
      if (errorCount > 0) {
        toast.error(`فشل رفع ${errorCount} شيت`);
      }

      setUploading(false);
      if (successCount > 0) {
        reset();
        onSuccess?.();
      }
      return;
    }

    // وضع إضافة روابط
    if (activeTab === 'link') {
      if (links.length === 0) {
        toast.error('أضف رابطاً واحداً على الأقل');
        return;
      }

      // التحقق من البيانات
      const invalidLink = links.find(l => !l.url.trim() || !l.fileName.trim());
      if (invalidLink) {
        toast.error('جميع الروابط يجب أن تحتوي على رابط واسم ملف');
        return;
      }

      setUploading(true);
      setProgress({ current: 0, total: links.length });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < links.length; i++) {
        setProgress({ current: i + 1, total: links.length });
        
        setLinks(prev => prev.map((l, idx) => 
          idx === i ? { ...l, status: 'uploading' } : l
        ));

        const result = await saveSingleLink(links[i]);

        if (result.success) {
          successCount++;
          setLinks(prev => prev.map((l, idx) => 
            idx === i ? { ...l, status: 'success' } : l
          ));
        } else {
          errorCount++;
          setLinks(prev => prev.map((l, idx) => 
            idx === i ? { ...l, status: 'error', error: result.error } : l
          ));
        }
      }

      if (successCount > 0) {
        toast.success(`تم حفظ ${successCount} رابط بنجاح`);
      }
      if (errorCount > 0) {
        toast.error(`فشل حفظ ${errorCount} رابط`);
      }

      setUploading(false);
      if (successCount > 0) {
        reset();
        onSuccess?.();
      }
      return;
    }
  };

  // الحصول على نص الزر
  const getButtonText = () => {
    if (uploading) {
      return `جاري الحفظ… (${progress.current}/${progress.total})`;
    }
    if (activeTab === 'file') {
      const count = files.length;
      return count > 1 ? `رفع ${count} ملف` : 'رفع وحفظ في الأرشيف';
    }
    const count = links.length;
    return count > 1 ? `حفظ ${count} رابط` : 'حفظ الرابط';
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
          <Layers size={16} />
          رفع ملفات متعددة
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
          إضافة روابط
        </button>
      </div>

      {/* محتوى Tab رفع الملفات */}
      {activeTab === 'file' && (
        <>
          {/* الوصف المشترك للجميع */}
          <label className="block">
            <span className="text-sm font-medium text-muted-foreground mb-2 block">
              وصف / مادة مشترك <span className="text-xs text-muted-foreground">(يُستخدم في البحث)</span>
            </span>
            <input
              type="text"
              value={sharedCaption}
              onChange={(e) => setSharedCaption(e.target.value)}
              disabled={uploading}
              placeholder="مثال: أساسيات الشبكات — جميع الشيتات"
              className="input-field w-full text-sm py-3"
            />
            <p className="text-xs text-muted-foreground mt-1">
              يمكن إضافة وصف منفصل لكل ملف أسفل، أو استخدام هذا الوصف لكل الملفات
            </p>
          </label>

          {/* زر اختيار ملفات */}
          <label className="block">
            <span className="text-sm font-medium text-muted-foreground mb-2 block">اختيار ملفات متعددة</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
              multiple
              disabled={uploading}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-border file:bg-muted file:text-foreground"
              onChange={handleFilesChange}
            />
          </label>

          {/* قائمة الملفات المختارة */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                الملفات المختارة ({files.length}):
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {files.map((fileItem) => (
                  <div 
                    key={fileItem.id}
                    className={`rounded-xl border p-3 space-y-2 ${
                      fileItem.status === 'error' ? 'border-red-500 bg-red-50/5' :
                      fileItem.status === 'success' ? 'border-green-500 bg-green-50/5' :
                      fileItem.status === 'uploading' ? 'border-primary bg-primary/5' :
                      'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-primary flex-shrink-0" />
                      <span className="text-sm truncate flex-1">{fileItem.file.name}</span>
                      <span className="text-xs text-muted-foreground font-mono-data">
                        {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => removeFile(fileItem.id)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    
                    {/* وصف منفصل للملف */}
                    <input
                      type="text"
                      value={fileItem.caption}
                      onChange={(e) => updateFileCaption(fileItem.id, e.target.value)}
                      disabled={uploading}
                      placeholder="وصف منفصل لهذا الملف (اختياري)"
                      className="w-full text-xs p-2 rounded-lg border border-border bg-background"
                    />

                    {/* حالة الرفع */}
                    {fileItem.status === 'uploading' && (
                      <div className="text-xs text-primary">جاري الرفع...</div>
                    )}
                    {fileItem.status === 'success' && (
                      <div className="text-xs text-green-500">✓ تم الرفع</div>
                    )}
                    {fileItem.status === 'error' && (
                      <div className="text-xs text-red-500">✗ {fileItem.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* محتوى Tab إضافة روابط */}
      {activeTab === 'link' && (
        <>
          {/* الوصف المشترك للجميع */}
          <label className="block">
            <span className="text-sm font-medium text-muted-foreground mb-2 block">
              وصف / مادة مشترك <span className="text-xs text-muted-foreground">(يُستخدم في البحث)</span>
            </span>
            <input
              type="text"
              value={sharedCaption}
              onChange={(e) => setSharedCaption(e.target.value)}
              disabled={uploading}
              placeholder="مثال: أساسيات الشبكات — جميع الروابط"
              className="input-field w-full text-sm py-3"
            />
            <p className="text-xs text-muted-foreground mt-1">
              يمكن إضافة وصف منفصل لكل رابط أسفل، أو استخدام هذا الوصف لكل الروابط
            </p>
          </label>

          {/* قائمة الروابط */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">
                الروابط ({links.length}):
              </div>
              <button
                type="button"
                onClick={addLink}
                disabled={uploading}
                className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus size={12} />
                إضافة رابط
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2">
              {links.map((linkItem, index) => (
                <div 
                  key={linkItem.id}
                  className={`rounded-xl border p-3 space-y-2 ${
                    linkItem.status === 'error' ? 'border-red-500 bg-red-50/5' :
                    linkItem.status === 'success' ? 'border-green-500 bg-green-50/5' :
                    linkItem.status === 'uploading' ? 'border-primary bg-primary/5' :
                    'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono-data">#{index + 1}</span>
                    <span className="text-xs font-medium flex-1">رابط {index + 1}</span>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => removeLink(linkItem.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* رابط */}
                  <input
                    type="url"
                    value={linkItem.url}
                    onChange={(e) => updateLink(linkItem.id, { url: e.target.value })}
                    disabled={uploading || linkItem.status === 'uploading'}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full text-sm p-2 rounded-lg border border-border bg-background"
                  />

                  {/* اسم الملف */}
                  <input
                    type="text"
                    value={linkItem.fileName}
                    onChange={(e) => updateLink(linkItem.id, { fileName: e.target.value })}
                    disabled={uploading || linkItem.status === 'uploading'}
                    placeholder="اسم الملف (مثال: شيت الشبكات.pdf)"
                    className="w-full text-sm p-2 rounded-lg border border-border bg-background"
                  />

                  {/* وصف منفصل */}
                  <input
                    type="text"
                    value={linkItem.caption}
                    onChange={(e) => updateLink(linkItem.id, { caption: e.target.value })}
                    disabled={uploading || linkItem.status === 'uploading'}
                    placeholder="وصف منفصل (اختياري)"
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background"
                  />

                  {/* حالة الحفظ */}
                  {linkItem.status === 'uploading' && (
                    <div className="text-xs text-primary">جاري الحفظ...</div>
                  )}
                  {linkItem.status === 'success' && (
                    <div className="text-xs text-green-500">✓ تم الحفظ</div>
                  )}
                  {linkItem.status === 'error' && (
                    <div className="text-xs text-red-500">✗ {linkItem.error}</div>
                  )}
                </div>
              ))}

              {links.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                  لا توجد روابط. اضغط "إضافة رابط" لبدء الإضافة
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* زر الحفظ */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={
          uploading || 
          (activeTab === 'file' && files.length === 0) || 
          (activeTab === 'link' && links.length === 0)
        }
        className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl"
      >
        {uploading ? (
          <>{getButtonText()}</>
        ) : activeTab === 'file' ? (
          <>
            <Upload size={18} />
            {getButtonText()}
          </>
        ) : (
          <>
            <ExternalLink size={18} />
            {getButtonText()}
          </>
        )}
      </button>
    </div>
  );
}
