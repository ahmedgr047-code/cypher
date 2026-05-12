"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Bot, User, Expand, Menu, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StudySheetCard } from "@/components/ui/StudySheetCard";
import { cn } from "@/lib/utils";
import type { Message, FileCard } from "@/types/chat";
import { AttachedFile } from "./ChatInput";

interface NewChatInterfaceProps {
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

export default function NewChatInterface({
  messages,
  isTyping,
  onSendMessage,
  onOpenSidebar,
  conversationTitle,
  quickChips,
  inputPlaceholder = 'اكتب سؤالك أو ارفع ملفاً للتحليل…',
  emptySubtitle = 'أخبرني باسم المادة وسأساعدك؛ الشيتات المطابقة تُستخرج من أرشيف المعهد.',
  footerNote = 'معهد الشموخ — أرشيف الشيتات والمناهج',
  connectedLabel = 'Cypher متصل',
}: NewChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input;
    setInput("");

    // Call the onSendMessage callback
    onSendMessage(messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExpandCode = (code: { language: string; content: string }) => {
    // Future: implement code expansion in workbench
    console.log("Expand code:", code);
  };

  const handleChipClick = (chip: string) => {
    setInput(chip);
    textareaRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  // Convert fileCards to artifacts for StudySheetCard
  const getFileCards = (message: Message): FileCard[] => {
    if (message.role === 'bot' && message.fileCards) {
      return message.fileCards;
    }
    return [];
  };

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 min-h-0">
        {isEmpty && quickChips.length > 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">كيف يمكنني مساعدتك؟</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">{emptySubtitle}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {quickChips.slice(0, 6).map((chip, index) => (
                <motion.button
                  key={`chip-${index}`}
                  onClick={() => handleChipClick(chip)}
                  className="text-right px-4 py-3 rounded-xl text-sm bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {chip}
                </motion.button>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
              <RotateCcw size={12} />
              <span>{footerNote}</span>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {getFileCards(message).map((fileCard, index) => (
                  <div key={index} className="mt-4">
                    <StudySheetCard
                      title={fileCard.fileName}
                      fileSize={fileCard.fileSize}
                      onDownload={() => {
                        window.open(fileCard.downloadUrl, '_blank');
                      }}
                    />
                  </div>
                ))}

                <p className="text-[10px] text-muted-foreground mt-2 opacity-60">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="p-4 border-t border-border bg-background shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2 bg-card border border-border rounded-2xl p-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              rows={1}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <Mic className="w-5 h-5" />
            </Button>

            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Cypher قد ينتج معلومات غير دقيقة. تحقق من التفاصيل المهمة.
        </p>
      </div>
    </div>
  );
}
