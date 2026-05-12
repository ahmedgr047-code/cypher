"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Bot, User, Expand, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StudySheetCard } from "@/components/ui/StudySheetCard";
import { cn } from "@/lib/utils";
import type { Message, FileCard } from "@/types/chat";

interface AttachedFile {
  file: File;
  type: "image" | "file";
  dataUri: string;
}

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
  onCodeGenerated?: (code: { language: string; content: string }) => void;
  onExpandCode?: (code: { language: string; content: string }) => void;
  persona?: { name: string; personality: string };
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
  onCodeGenerated,
  onExpandCode,
  persona
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
      // Create a synthetic form event
      const formEvent = new Event('submit', { cancelable: true }) as any;
      formEvent.preventDefault = () => {};
      handleSubmit(formEvent);
    }
  };

  const handleExpandCode = (code: { language: string; content: string }) => {
    // Future: implement code expansion in workbench
    console.log("Expand code:", code);
    onExpandCode?.(code);
  };

  const handleChipClick = (chip: string) => {
    setInput(chip);
    textareaRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-black" dir="rtl">
      {/* Topbar */}
      <div className="flex-shrink-0 h-14 bg-black/80 backdrop-blur-sm border-b border-red-500/20 flex items-center justify-between px-4 gap-3">
        {/* Left: mobile menu + title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="text-red-400 hover:text-red-300 hover:bg-red-600/10 shrink-0 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">{conversationTitle}</h1>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-red-400">{connectedLabel}</span>
            </div>
          </div>
        </div>

        {/* Right: bot status */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1 bg-red-600/20 border border-red-500/30 rounded-full">
            <Bot className="w-3 h-3 text-red-400" />
            <span className="text-xs text-red-300">
              {isTyping ? 'يكتب...' : 'متصل'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Empty state with quick chips */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border border-red-500/30 mb-6">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">مرحباً بك في Cypher</h2>
            <p className="text-red-400 text-sm mb-8 max-w-md">{emptySubtitle}</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {quickChips.map((chip, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  onClick={() => handleChipClick(chip)}
                  className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-300 text-sm hover:bg-red-600/30 hover:border-red-500/50 transition-all duration-200"
                >
                  {chip}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
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
                {message.role === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-red-400" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-xs lg:max-w-md xl:max-w-lg",
                    message.role === "user"
                      ? "bg-red-600 text-white rounded-2xl rounded-tl-none"
                      : "bg-red-950/50 border border-red-500/30 text-white rounded-2xl rounded-tr-none"
                  )}
                >
                  <div className="p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                    {/* Code blocks */}
                    {message.content.includes('```') && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-red-500/30">
                        <div className="bg-red-600/10 px-3 py-2 text-xs text-red-400 flex items-center justify-between">
                          <span>
                            {message.content.match(/```(\w+)?/)?.[1] || 'code'}
                          </span>
                          <button
                            onClick={() => {
                              const codeMatch = message.content.match(/```(\w+)?\n([\s\S]*?)\n```/);
                              if (codeMatch) {
                                handleExpandCode({
                                  language: codeMatch[1] || 'text',
                                  content: codeMatch[2].trim()
                                });
                              }
                            }}
                            className="text-red-300 hover:text-red-200 flex items-center gap-1"
                          >
                            <Expand className="w-3 h-3" />
                            فتح
                          </button>
                        </div>
                        <pre className="p-3 text-xs overflow-x-auto bg-red-600/5">
                          <code className="text-red-100">
                            {message.content.match(/```[\s\S]*?\n([\s\S]*?)\n```/)?.[1]}
                          </code>
                        </pre>
                      </div>
                    )}

                    {/* File cards */}
                    {message.fileCard && (
                      <div className="mt-3">
                        <StudySheetCard
                          title={message.fileCard.fileName}
                          fileSize={message.fileCard.fileSize}
                        />
                      </div>
                    )}

                    {message.fileCards && message.fileCards.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.fileCards.map((fileCard, index) => (
                          <StudySheetCard
                            key={index}
                            title={fileCard.fileName}
                            fileSize={fileCard.fileSize}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-red-400" />
              </div>
              <div className="bg-red-950/50 border border-red-500/30 rounded-2xl rounded-tr-none px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-red-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-4 border-t border-red-500/20">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              className="bg-red-950/50 border border-red-500/30 rounded-xl text-white placeholder-red-500/50 resize-none h-12 pr-12"
              rows={1}
            />
            
            {/* File attach button */}
            <label className="absolute left-3 top-3 cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <Paperclip className="w-4 h-4 text-red-400 hover:text-red-300 transition-colors" />
            </label>
          </div>

          <Button
            type="submit"
            disabled={!input.trim()}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 h-12 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 ml-2" />
            إرسال
          </Button>
        </form>

        <p className="text-xs text-red-500 text-center mt-2">{footerNote}</p>
      </div>
    </div>
  );
}
