'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatMain from './ChatMain';
import type { Message, Conversation, FileCard } from '@/types/chat';
import { AttachedFile } from './ChatInput';
import toast from 'react-hot-toast';
import { getChatCompletion } from '@/lib/ai/chatCompletion';
import { formatRelativeAr } from '@/lib/formatRelativeAr';
import { formatBytes } from '@/lib/formatBytes';

const SYSTEM_PROMPT = `أنت Cypher، مساعد دراسي ذكي لمعهد الشموخ. تتحدث باللغة العربية دائماً.
مهمتك مساعدة الطلاب في الفهم والشرح وتلخيص المواد الدراسية.
عند الإجابة على أي سؤال أو شرح أي موضوع، أضف في نهاية ردك قسماً بعنوان "🎬 مقاطع يوتيوب مقترحة:" وفيه 2-3 روابط يوتيوب حقيقية ومفيدة ذات صلة بالموضوع بالصيغة التالية:
[عنوان المقطع](https://www.youtube.com/watch?v=XXXX)
إذا أرسل الطالب صورة أو ملف، قم بتحليله وشرح محتواه بالتفصيل.`;

type DbMessage = {
  id: string;
  role: string;
  content: string;
  extra: Record<string, unknown> | null;
  created_at: string;
};

type SheetRow = {
  id: string;
  file_name: string | null;
  caption: string | null;
  file_size: number | null;
};

function buildSheetBlock(sheets: SheetRow[]): string {
  if (!sheets?.length) return '';
  const lines = sheets.map(
    (s, i) =>
      `${i + 1}. ${s.file_name || 'ملف'} (معرّف الشيت: ${s.id})${s.caption ? ` — ${s.caption}` : ''}`
  );
  return `\n\nالشيتات المطابقة في قاعدة البيانات (مزامنة من قناة تلغرام):\n${lines.join('\n')}\nعند الإفادة بشيت معيّن، اذكر اسمه بوضوح. قد تظهر للطالب بطاقة تحميل مباشرة تحت ردك عند توفر ملف مطابق.`;
}

function sheetToFileCard(row: SheetRow): FileCard {
  return {
    sheetId: row.id,
    fileName: row.file_name || 'شيت',
    subject: row.caption?.slice(0, 80) || 'من قناة تلغرام',
    subjectCode: 'تلغرام',
    semester: '—',
    fileSize: formatBytes(row.file_size),
    pages: 0,
    downloadUrl: `/api/sheets/${row.id}/download`,
    source: 'telegram',
  };
}

function dbMsgToUi(m: DbMessage): Message {
  const ts = new Date(m.created_at).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const extra = (m.extra || {}) as Record<string, unknown>;
  if (m.role === 'user') {
    return {
      id: m.id,
      role: 'user',
      content: m.content,
      timestamp: ts,
      attachmentPreview: extra.attachmentPreview as string | undefined,
      attachmentName: extra.attachmentName as string | undefined,
    };
  }
  return {
    id: m.id,
    role: 'bot',
    content: m.content,
    timestamp: ts,
    fileCard: extra.fileCard as FileCard | undefined,
  };
}

function dbMsgToHistory(m: DbMessage): { role: 'user' | 'assistant'; content: unknown } {
  const extra = (m.extra || {}) as Record<string, unknown>;
  if (m.role === 'user') {
    return { role: 'user', content: extra.modelContent ?? m.content };
  }
  return { role: 'assistant', content: m.content };
}

function mapConv(row: {
  id: string;
  title: string;
  preview: string;
  updated_at: string;
}): Conversation {
  return {
    id: row.id,
    title: row.title,
    preview: row.preview,
    timestamp: formatRelativeAr(row.updated_at),
    unread: false,
  };
}

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: unknown }>>(
    []
  );
  const [quickChips, setQuickChips] = useState<string[]>([]);
  const [userBar, setUserBar] = useState<{ fullName: string; email: string; studentId: string | null }>({
    fullName: '',
    email: '',
    studentId: null,
  });
  const [bootstrapped, setBootstrapped] = useState(false);
  const loadingThreadRef = useRef(false);

  const refreshConversations = useCallback(async () => {
    const r = await fetch('/api/conversations');
    if (!r.ok) return;
    const j = await r.json();
    const rows = j.conversations as Array<{
      id: string;
      title: string;
      preview: string;
      updated_at: string;
    }>;
    setConversations(rows.map(mapConv));
    return rows;
  }, []);

  const loadThread = useCallback(async (convId: string) => {
    loadingThreadRef.current = true;
    const r = await fetch(`/api/conversations/${convId}/messages`);
    loadingThreadRef.current = false;
    if (!r.ok) {
      toast.error('تعذر تحميل الرسائل');
      return;
    }
    const j = await r.json();
    const dbMsgs = (j.messages || []) as DbMessage[];
    setMessages(dbMsgs.map(dbMsgToUi));
    setChatHistory(dbMsgs.map(dbMsgToHistory));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profRes, chipsRes, convRows] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/quick-chips'),
          fetch('/api/conversations'),
        ]);

        if (!cancelled && profRes.ok) {
          const p = await profRes.json();
          setUserBar({
            fullName: p.fullName,
            email: p.email,
            studentId: p.studentId,
          });
        }

        if (!cancelled && chipsRes.ok) {
          const c = await chipsRes.json();
          setQuickChips(c.chips?.length ? c.chips : []);
        }

        if (!cancelled && convRows.ok) {
          const j = await convRows.json();
          const rows = j.conversations as Array<{
            id: string;
            title: string;
            preview: string;
            updated_at: string;
          }>;

          if (rows.length === 0) {
            const create = await fetch('/api/conversations', { method: 'POST' });
            if (create.ok) {
              const cj = await create.json();
              const conv = cj.conversation;
              setConversations([mapConv(conv)]);
              setActiveConvId(conv.id);
              setMessages([]);
              setChatHistory([]);
            }
          } else {
            setConversations(rows.map(mapConv));
            const first = rows[0].id;
            setActiveConvId(first);
            await loadThread(first);
          }
        }
      } catch {
        if (!cancelled) toast.error('تعذر تهيئة المحادثة');
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadThread]);

  const handleNewChat = async () => {
    const r = await fetch('/api/conversations', { method: 'POST' });
    if (!r.ok) {
      toast.error('تعذر إنشاء محادثة');
      return;
    }
    const j = await r.json();
    const conv = j.conversation;
    setConversations((prev) => [mapConv(conv), ...prev]);
    setActiveConvId(conv.id);
    setMessages([]);
    setChatHistory([]);
    setSidebarOpen(false);
  };

  const handleSelectConv = async (id: string) => {
    if (id === activeConvId || loadingThreadRef.current) return;
    setActiveConvId(id);
    setSidebarOpen(false);
    await loadThread(id);
  };

  const handleSendMessage = async (text: string, attachment?: AttachedFile) => {
    if (!activeConvId) {
      toast.error('لا توجد محادثة نشطة');
      return;
    }

    const displayContent = attachment
      ? `${text}${text ? '\n' : ''}📎 ${attachment.file.name}`
      : text;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      attachmentPreview: attachment?.type === 'image' ? attachment.dataUri : undefined,
      attachmentName: attachment ? attachment.file.name : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    let userContent: string | unknown[] = text;
    if (attachment) {
      const contentParts: unknown[] = [];
      if (text) contentParts.push({ type: 'text', text });
      if (attachment.type === 'image') {
        contentParts.push({ type: 'image_url', image_url: { url: attachment.dataUri } });
      } else {
        contentParts.push({ type: 'file', file: { file_data: attachment.dataUri } });
      }
      userContent = contentParts;
    }

    const extra = {
      modelContent: userContent,
      attachmentPreview: attachment?.type === 'image' ? attachment.dataUri : undefined,
      attachmentName: attachment?.file.name,
    };

    try {
      const saveUser = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: displayContent, extra }),
      });
      if (!saveUser.ok) throw new Error('save user');

      const savedUser = await saveUser.json();
      const userRow = savedUser.message as DbMessage;
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...userMsg, id: userRow.id } : m))
      );

      const q = (text || attachment?.file.name || '').trim();
      let sheets: SheetRow[] = [];
      if (q) {
        const sr = await fetch(`/api/sheets/search?q=${encodeURIComponent(q)}`);
        if (sr.ok) {
          const sj = await sr.json();
          sheets = (sj.sheets || []) as SheetRow[];
        }
      }

      const newHistory = [...chatHistory, { role: 'user' as const, content: userContent }];
      setChatHistory(newHistory);

      const sheetBlock = buildSheetBlock(sheets);
      const apiMessages = [
        { role: 'system' as const, content: SYSTEM_PROMPT + sheetBlock },
        ...newHistory.map((h) => ({
          role: h.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: h.content,
        })),
      ];

      const result = await getChatCompletion(
        'GEMINI',
        'gemini/gemini-2.5-flash',
        apiMessages as object[],
        { temperature: 0.7, max_tokens: 2048 }
      );

      const responseText = (result as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]
        ?.message?.content as string;
      const reply = responseText || '';

      const fileCard = sheets.length > 0 ? sheetToFileCard(sheets[0]) : undefined;

      const saveBot = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: reply,
          extra: fileCard ? { fileCard } : {},
        }),
      });
      if (!saveBot.ok) throw new Error('save bot');

      const savedBot = await saveBot.json();
      const botRow = savedBot.message as DbMessage;

      const botMsg: Message = {
        id: botRow.id,
        role: 'bot',
        content: reply,
        timestamp: new Date(botRow.created_at).toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        fileCard,
      };
      setMessages((prev) => [...prev, botMsg]);
      setChatHistory((prev) => [...prev, { role: 'assistant', content: reply }]);

      const titleSeed = text || attachment?.file.name || 'محادثة';
      await fetch(`/api/conversations/${activeConvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleSeed.slice(0, 48),
          preview: reply.slice(0, 120),
        }),
      });
      await refreshConversations();
    } catch {
      toast.error('حدث خطأ في الاتصال بـ Cypher. حاول مرة أخرى.');
      await loadThread(activeConvId);
    } finally {
      setIsTyping(false);
    }
  };

  if (!bootstrapped || !activeConvId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        جاري التحميل…
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 overlay-backdrop lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed lg:relative z-40 h-full
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          w-72 lg:w-72 flex-shrink-0
        `}
        style={{ right: 0 }}
      >
        <ChatSidebar
          conversations={conversations}
          activeConvId={activeConvId}
          onSelectConv={handleSelectConv}
          onNewChat={handleNewChat}
          onClose={() => setSidebarOpen(false)}
          user={userBar}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <ChatMain
          messages={messages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          onOpenSidebar={() => setSidebarOpen(true)}
          conversationTitle={
            conversations.find((c) => c.id === activeConvId)?.title ?? 'محادثة جديدة'
          }
          quickChips={quickChips}
        />
      </div>
    </div>
  );
}
