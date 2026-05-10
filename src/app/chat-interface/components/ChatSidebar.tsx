'use client';

import React, { useState } from 'react';
import { Search, Plus, X, MessageSquare, BookOpen, LogOut, Settings } from 'lucide-react';
import type { Conversation, SubjectRow } from '@/types/chat';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useUserSettings } from '@/components/providers/UserSettingsProvider';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConvId: string;
  onSelectConv: (id: string) => void;
  onNewChat: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
  user: { fullName: string; email: string; studentId: string | null };
}

export default function ChatSidebar({
  conversations,
  activeConvId,
  onSelectConv,
  onNewChat,
  onClose,
  onOpenSettings,
  user,
}: ChatSidebarProps) {
  const { locale } = useUserSettings();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/');
    router.refresh();
  };

  const openCatalog = async () => {
    setCatalogOpen(true);
    const r = await fetch('/api/subjects');
    if (r.ok) {
      const j = await r.json();
      setSubjects(j.subjects || []);
    }
  };

  const initial = user.fullName?.trim()?.charAt(0) || '؟';

  return (
    <div className="h-full bg-card border-l border-border flex flex-col" dir="rtl">
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CypherLogoMark size={32} />
            <div>
              <h1 className="text-sm font-bold text-foreground">Cypher</h1>
              <p className="text-xs text-muted-foreground">معهد الشموخ</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="btn-ghost p-1.5 rounded-lg lg:hidden"
              aria-label="إغلاق القائمة"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <button
          onClick={onNewChat}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={15} />
          محادثة جديدة
        </button>
      </div>

      <div className="px-3 py-3 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث في المحادثات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pr-9 pl-3 py-2 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <MessageSquare size={28} className="text-muted-foreground mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">لا توجد محادثات مطابقة</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConvId}
                onClick={() => onSelectConv(conv.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 flex-shrink-0 space-y-1">
        <button
          type="button"
          onClick={openCatalog}
          className="sidebar-item w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground"
        >
          <BookOpen size={15} />
          <span>كتالوج المواد</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
          className="sidebar-item w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground"
        >
          <Settings size={15} />
          <span>{locale === 'en' ? 'Settings' : 'الإعدادات'}</span>
        </button>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate font-mono-data" dir="ltr">
              {user.studentId || user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-ghost p-1 rounded-md flex-shrink-0"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {catalogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-backdrop"
          onClick={() => setCatalogOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">المواد الدراسية</h2>
              <button
                type="button"
                onClick={() => setCatalogOpen(false)}
                className="btn-ghost p-1.5 rounded-lg"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
              {subjects.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">لا توجد بيانات</p>
              ) : (
                subjects.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-border bg-background/50 px-3 py-2.5 text-right"
                  >
                    <p className="text-xs font-semibold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.code} · {s.semester}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`sidebar-item w-full text-right px-3 py-2.5 flex flex-col gap-0.5 ${
        isActive ? 'active' : ''
      }`}
    >
      <span
        className={`text-xs font-medium truncate w-full ${
          isActive ? 'text-primary' : 'text-foreground'
        }`}
      >
        {conv.title}
      </span>
      <span className="text-xs text-muted-foreground truncate w-full">{conv.preview}</span>
      <span className="text-xs text-muted-foreground opacity-60">{conv.timestamp}</span>
    </button>
  );
}

function CypherLogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#sb-logo-grad)" />
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
        <linearGradient id="sb-logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF3347" />
          <stop offset="1" stopColor="#8B0A16" />
        </linearGradient>
      </defs>
    </svg>
  );
}
