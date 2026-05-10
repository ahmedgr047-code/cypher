'use client';

import React, { useRef, useEffect } from 'react';
import { Menu, Bot, RotateCcw } from 'lucide-react';
import type { Message } from '@/types/chat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import { AttachedFile } from './ChatInput';

interface ChatMainProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string, attachment?: AttachedFile) => void;
  onOpenSidebar: () => void;
  conversationTitle: string;
  quickChips: string[];
  inputPlaceholder?: string;
  emptySubtitle?: string;
  footerNote?: string;
  connectedLabel?: string;
}

export default function ChatMain({
  messages,
  isTyping,
  onSendMessage,
  onOpenSidebar,
  conversationTitle,
  quickChips,
  inputPlaceholder = 'اكتب سؤالك أو ارفع ملفاً للتحليل…',
  emptySubtitle = 'أخبرني باسم المادة والفصل الدراسي وسأجلب لك الشيت أو المنهج فوراً من قناة الدكتور على تلغرام',
  footerNote = 'مرتبط بقنوات تلغرام معهد الشموخ',
  connectedLabel = 'Cypher متصل',
}: ChatMainProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // `auto` أوفر للمحاكيات والأجهزة الضعيفة من `smooth`
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [messages, isTyping]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Topbar */}
      <div className="flex-shrink-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 gap-3">
        {/* Left: mobile menu + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="btn-ghost p-2 rounded-lg lg:hidden flex-shrink-0"
            aria-label="فتح القائمة"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{conversationTitle}</p>
          </div>
        </div>

        {/* Right: bot status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="status-online w-2 h-2 flex-shrink-0" />
            <span className="text-xs text-muted-foreground hidden sm:block">{connectedLabel}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center glow-red-sm">
            <Bot size={16} className="text-white" />
          </div>
        </div>
      </div>

      {/* Messages area — overscroll-behavior يقلل التعليق على اللمس */}
      <div
        className="flex-1 overflow-y-auto overscroll-y-contain scrollbar-thin px-4 py-4 space-y-4 [contain:content]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {isEmpty ? (
          <EmptyChat
            quickChips={quickChips}
            onChipClick={onSendMessage}
            subtitle={emptySubtitle}
            footerNote={footerNote}
          />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} aria-hidden />
          </>
        )}
      </div>

      {/* Quick chips (only shown when not empty, above input) */}
      {!isEmpty && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-border">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            {quickChips.slice(0, 4).map((chip) => (
              <button
                key={`chip-${chip}`}
                onClick={() => onSendMessage(chip)}
                className="quick-chip flex-shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-card">
        <ChatInput onSend={onSendMessage} disabled={isTyping} placeholder={inputPlaceholder} />
      </div>
    </div>
  );
}

function EmptyChat({
  quickChips,
  onChipClick,
  subtitle,
  footerNote,
}: {
  quickChips: string[];
  onChipClick: (text: string) => void;
  subtitle: string;
  footerNote: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center">
      {/* Logo */}
      <div className="mb-6 glow-red rounded-2xl">
        <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="url(#empty-logo-grad)" />
          <path
            d="M10 14C10 11.8 11.8 10 14 10H34C36.2 10 38 11.8 38 14V28C38 30.2 36.2 32 34 32H26L20 38V32H14C11.8 32 10 30.2 10 28V14Z"
            fill="white"
            fillOpacity="0.95"
          />
          <line x1="16" y1="18" x2="32" y2="18" stroke="#E8192C" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="22" x2="28" y2="22" stroke="#E8192C" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="26" x2="24" y2="26" stroke="#E8192C" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="18" r="2.5" fill="#E8192C" />
          <defs>
            <linearGradient id="empty-logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF3347" />
              <stop offset="1" stopColor="#8B0A16" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">كيف يمكنني مساعدتك؟</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">{subtitle}</p>

      {/* Quick chips grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {quickChips.map((chip) => (
          <button
            key={`empty-chip-${chip}`}
            onClick={() => onChipClick(chip)}
            className="quick-chip text-right px-4 py-3 rounded-xl text-sm"
            style={{ borderRadius: '12px' }}
          >
            <span className="text-primary ml-1">📄</span> {chip}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <RotateCcw size={12} />
        <span>{footerNote}</span>
      </div>
    </div>
  );
}