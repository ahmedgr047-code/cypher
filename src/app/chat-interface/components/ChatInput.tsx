'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, X, FileText, Image } from 'lucide-react';

export interface AttachedFile {
  file: File;
  dataUri: string;
  type: 'image' | 'document';
}

interface ChatInputProps {
  onSend: (text: string, attachment?: AttachedFile) => void;
  disabled: boolean;
}

async function fileToBase64DataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if ((!trimmed && !attachedFile) || disabled) return;
    onSend(trimmed || '📎 ملف مرفق', attachedFile ?? undefined);
    setValue('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf', 'text/plain',
    ];

    if (!validTypes.includes(file.type)) {
      return;
    }

    const dataUri = await fileToBase64DataUri(file);
    const type = file.type.startsWith('image/') ? 'image' : 'document';
    setAttachedFile({ file, dataUri, type });
  };

  return (
    <div className="px-4 py-3 flex flex-col gap-2" dir="rtl">
      {/* Attachment preview */}
      {attachedFile && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border text-sm">
          {attachedFile.type === 'image' ? (
            <Image size={15} className="text-primary flex-shrink-0" />
          ) : (
            <FileText size={15} className="text-primary flex-shrink-0" />
          )}
          <span className="text-foreground truncate flex-1 text-xs">{attachedFile.file.name}</span>
          <button
            type="button"
            onClick={() => {
              setAttachedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="إزالة الملف"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.txt"
          onChange={handleFileChange}
          className="hidden"
          aria-label="رفع ملف"
        />
        <button
          type="button"
          className="btn-ghost p-2 rounded-xl flex-shrink-0 mb-0.5"
          aria-label="إرفاق ملف أو صورة"
          title="إرفاق ملف أو صورة (صور، PDF، TXT)"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={18} className="text-muted-foreground" />
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="اكتب سؤالك أو ارفع ملفاً للتحليل..."
            disabled={disabled}
            rows={1}
            className="input-field w-full px-4 py-3 text-sm resize-none overflow-hidden placeholder-muted-foreground leading-relaxed"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!value.trim() && !attachedFile)}
          className="btn-primary p-3 rounded-xl flex-shrink-0 mb-0.5 flex items-center justify-center"
          aria-label="إرسال الرسالة"
          style={{ minWidth: '48px', minHeight: '48px' }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}