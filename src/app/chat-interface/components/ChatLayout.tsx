'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatMain from './ChatMain';
import SettingsPanel from './SettingsPanel';
import type { Message, Conversation, FileCard } from '@/types/chat';
import { AttachedFile } from './ChatInput';
import toast from 'react-hot-toast';
import { getChatCompletionWithFailover } from '@/lib/ai/chatCompletion';
import { AI_MAX_HISTORY_CHARS, AI_MAX_HISTORY_MESSAGES } from '@/lib/ai/constants';
import { formatRelativeAr } from '@/lib/formatRelativeAr';
import { formatBytes } from '@/lib/formatBytes';
import { useUserSettings } from '@/components/providers/UserSettingsProvider';
import { chatT } from '@/lib/chat-i18n';

const BASE_SYSTEM_PROMPT = `أنت Cypher، بوت مساعدة خاص بمعهد الشموخ فقط. اسمك أمام المستخدم: Cypher.
طوّرك المهندس والطالب أحمد قريز. لا تذكر Google أو OpenAI أو Anthropic أو Groq أو أي شركة أو اسم نموذج خارجي.

إذا سُئلت عن الهوية أو المنشئ أو «من صنعك» أو «من أنت» أو «ما اسمك» أو «من أنشأك» أو «انت مني» أو ما شابه — أجب باختصار: أنت بوت معهد الشموخ، اسمك Cypher، طورك أحمد قريز، دون الإشارة لشركات أو نماذج عالمية.

لا تضف قسماً عن مقاطع يوتيوب أو روابط فيديو ما لم يطلب المستخدم ذلك صراحةً في رسالته الحالية (كلمات مثل: يوتيوب، youtube، فيديو، مقاطع، فيديوهات، شرح مرئي).

مهمتك: مساعدة الطلاب أكاديمياً بالعربية.

**قاعدة بيانات الشيتات:**
- أسفل هذه الرسالة قد تظهر قائمة بـ "شيتات مطابقة من الأرشيف".
- إذا ظهرت شيتات في القائمة، فهي متاحة للتحميل فوراً — اذكرها للطالب وقل إنها ظهرت في بطاقة التحميل.
- لا تقل "لم يتم العثور" إذا كانت القائمة تحتوي على شيتات.
- إذا كانت القائمة فارغة (لا شيتات)، عندها فقط قل إن لم يتم العثور.
- لا تخترع شيتاً خارج ما يظهر في القائمة أدناه.

صورة أو ملف مرفوع: شرح مختصر.`;

function userRequestedYoutube(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return /يوتيوب|youtube|فيديو|مقطع|فيديوهات|شرح\s+مرئي/i.test(t);
}

function composeSystemContent(
  sheetBlock: string,
  personaExtra: string,
  wantsYoutube: boolean
): string {
  let s = BASE_SYSTEM_PROMPT + sheetBlock;
  if (personaExtra.trim()) {
    s += `\n\n[توجيهات إضافية من المستخدم لهذا الجهاز]\n${personaExtra.trim()}`;
  }
  if (wantsYoutube) {
    s += `\n\nالمستخدم طلب مقاطع فيديو صراحةً: أنهِ الرد بقسم "🎬 مقاطع يوتيوب مقترحة:" مع رابطين حقيقيين بصيغة [عنوان](رابط يوتيوب).`;
  }
  return s;
}

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
  const top = sheets.slice(0, 5);
  if (!top.length) return '';
  const lines = top.map(
    (s, i) =>
      `${i + 1}. ${s.file_name || 'ملف'} (${s.id})${s.caption ? ` — ${s.caption.slice(0, 120)}` : ''}`
  );
  return `\nشيتات مطابقة من الأرشيف:\n${lines.join('\n')}`;
}

function clipHistoryForApi(
  history: Array<{ role: 'user' | 'assistant'; content: unknown }>
): Array<{ role: 'user' | 'assistant'; content: unknown }> {
  const tail = history.slice(-AI_MAX_HISTORY_MESSAGES);
  return tail.map((h) => {
    if (typeof h.content === 'string' && h.content.length > AI_MAX_HISTORY_CHARS) {
      return {
        ...h,
        content: `${h.content.slice(0, AI_MAX_HISTORY_CHARS)}\n…`,
      };
    }
    return h;
  });
}

function sheetToFileCard(row: SheetRow): FileCard {
  return {
    sheetId: row.id,
    fileName: row.file_name || 'شيت',
    subject: row.caption?.slice(0, 80) || 'أرشيف المعهد',
    subjectCode: 'أرشيف',
    semester: '—',
    fileSize: formatBytes(row.file_size),
    pages: 0,
    downloadUrl: `/api/sheets/${row.id}/download`,
    source: 'archive',
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
  const { locale, botPersona } = useUserSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const ui = useMemo(
    () => ({
      connected: chatT(locale, 'connected'),
      placeholderInput: chatT(locale, 'placeholderInput'),
      emptySubtitle: chatT(locale, 'emptySubtitle'),
      footerNote: chatT(locale, 'footerNote'),
    }),
    [locale]
  );

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
          sheets = ((sj.sheets || []) as SheetRow[]).slice(0, 5);
        }
      }

      const newHistory = [...chatHistory, { role: 'user' as const, content: userContent }];
      setChatHistory(newHistory);

      const sheetBlock = buildSheetBlock(sheets);
      const apiTail = clipHistoryForApi(newHistory);
      const youtubeAsk = userRequestedYoutube(q);
      const systemContent = composeSystemContent(sheetBlock, botPersona, youtubeAsk);
      const apiMessages = [
        { role: 'system' as const, content: systemContent },
        ...apiTail.map((h) => ({
          role: h.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: h.content,
        })),
      ];

      const result = await getChatCompletionWithFailover(apiMessages as object[], {
        temperature: 0.45,
        max_tokens: 768,
        timeout: 10,
      });

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
          transition-transform duration-200 ease-out
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
          onOpenSettings={() => setSettingsOpen(true)}
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
          inputPlaceholder={ui.placeholderInput}
          emptySubtitle={ui.emptySubtitle}
          footerNote={ui.footerNote}
          connectedLabel={ui.connected}
        />
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} user={userBar} />
    </div>
  );
}
