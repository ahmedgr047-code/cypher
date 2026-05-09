'use client';

import React, { useState } from 'react';
import { Download, FileText, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import type { Message } from '@/types/chat';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: Message;
}

// Parse text and extract YouTube links
function parseContent(content: string): { text: string; youtubeLinks: Array<{ title: string; url: string }> } {
  const youtubeLinks: Array<{ title: string; url: string }> = [];

  // Extract markdown links that are YouTube URLs: [title](url)
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\)]+)\)/g;
  let match;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    youtubeLinks.push({ title: match[1], url: match[2] });
  }

  // Remove the YouTube section from text for cleaner display
  let text = content
    .replace(/🎬 مقاطع يوتيوب مقترحة:?\s*/g, '')
    .replace(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\)]+)\)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { text, youtubeLinks };
}

// Simple markdown renderer for bold, italic, lists, headers
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-bold text-foreground mt-2 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-sm font-bold text-foreground mt-2 mb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-base font-bold text-foreground mt-2 mb-1">{line.slice(2)}</h1>);
    }
    // List items
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-1.5 items-start">
          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s/)?.[1];
      elements.push(
        <div key={i} className="flex gap-1.5 items-start">
          <span className="text-primary font-mono text-xs mt-0.5 flex-shrink-0">{num}.</span>
          <span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />);
    }
    // Normal paragraph
    else {
      elements.push(<p key={i} className="leading-relaxed">{renderInline(line)}</p>);
    }
  });

  return elements;
}

function renderInline(text: string): React.ReactNode {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-secondary px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const { text, youtubeLinks } = isUser ? { text: message.content, youtubeLinks: [] } : parseContent(message.content);

  return (
    <div className={`flex gap-3 message-enter ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 glow-red-sm">
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path
              d="M10 14C10 11.8 11.8 10 14 10H34C36.2 10 38 11.8 38 14V28C38 30.2 36.2 32 34 32H26L20 38V32H14C11.8 32 10 30.2 10 28V14Z"
              fill="white"
              fillOpacity="0.9"
            />
            <line x1="16" y1="18" x2="28" y2="18" stroke="#E8192C" strokeWidth="3" strokeLinecap="round" />
            <line x1="16" y1="24" x2="24" y2="24" stroke="#E8192C" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[80%] sm:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Image preview (user uploaded) */}
        {isUser && message.attachmentPreview && (
          <div className="rounded-xl overflow-hidden border border-border max-w-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={message.attachmentPreview} alt={message.attachmentName ?? 'صورة مرفقة'} className="w-full h-auto object-cover" />
          </div>
        )}

        {/* Attachment name (non-image) */}
        {isUser && message.attachmentName && !message.attachmentPreview && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-muted-foreground">
            <FileText size={13} className="text-primary" />
            <span>{message.attachmentName}</span>
          </div>
        )}

        {/* Text bubble */}
        <div
          className={`px-4 py-3 text-sm leading-relaxed ${
            isUser ? 'chat-bubble-user text-white' : 'chat-bubble-bot text-card-foreground'
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-line">{text}</span>
          ) : (
            <div className="space-y-0.5">{renderMarkdown(text)}</div>
          )}
        </div>

        {/* YouTube links */}
        {youtubeLinks.length > 0 && (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-red-500 w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fill="currentColor"
                  d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12a10 10 0 1020 0 10 10 0 000-20zM12 20a10 10 0 100-20 10 10 0 000 20z"
                />
              </svg>
              <span>مقاطع يوتيوب مقترحة</span>
            </div>
            {youtubeLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary border border-border hover:border-primary transition-colors duration-150 group"
              >
                <div className="w-7 h-7 rounded-lg bg-red-950 border border-red-800 flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-red-400 w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12a10 10 0 1020 0 10 10 0 000-20zM12 20a10 10 0 100-20 10 10 0 000 20z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-foreground group-hover:text-primary transition-colors flex-1 leading-snug line-clamp-2">
                  {link.title}
                </span>
                <ExternalLink size={11} className="text-muted-foreground flex-shrink-0" />
              </a>
            ))}
          </div>
        )}

        {/* File card */}
        {message.fileCard && <FileDeliveryCard fileCard={message.fileCard} />}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground opacity-60 font-mono-data">
          {message.timestamp}
        </span>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-bold text-foreground">أ</span>
        </div>
      )}
    </div>
  );
}

function FileDeliveryCard({ fileCard }: { fileCard: NonNullable<Message['fileCard']> }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(fileCard.downloadUrl, { credentials: 'include' });
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileCard.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      toast.success('تم بدء التحميل', { description: fileCard.fileName });
    } catch {
      toast.error('تعذر تحميل الملف');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="file-card p-4 w-full min-w-[260px] max-w-[340px]">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary bg-opacity-10 border border-primary border-opacity-20 flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight mb-1 truncate">{fileCard.fileName}</p>
          <p className="text-xs text-muted-foreground">{fileCard.subject}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="semester-badge">{fileCard.semester}</span>
        <span className="subject-tag">{fileCard.subjectCode}</span>
        <span className="telegram-badge">📨 تلغرام</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 font-mono-data">
        <span>{fileCard.fileSize}</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>{fileCard.pages} صفحة</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>PDF</span>
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading || downloaded}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
          downloaded ? 'bg-green-950 border border-green-800 text-green-400 cursor-default' : 'btn-primary'
        }`}
      >
        {downloading ? (
          <><Loader2 size={15} className="animate-spin" />جاري التحميل...</>
        ) : downloaded ? (
          <><CheckCircle size={15} />تم التحميل</>
        ) : (
          <><Download size={15} />تحميل الشيت</>
        )}
      </button>
    </div>
  );
}