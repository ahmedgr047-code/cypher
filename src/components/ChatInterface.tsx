"use client";

import { useState, useRef, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Bot, User, Expand, Menu, RotateCcw, Code2 } from "lucide-react";
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

interface ChatInterfaceProps {
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
  onWorkbenchToggle?: () => void;
  workbenchOpen?: boolean;
}

// Context for workbench
const WorkbenchContext = createContext<{
  openWorkbench: (codeBlocks: Array<{ language: string; content: string; id: string }>) => void;
  closeWorkbench: () => void;
}>({
  openWorkbench: () => {},
  closeWorkbench: () => {}
});

export const useWorkbench = () => useContext(WorkbenchContext);

export default function ChatInterface({
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
  onWorkbenchToggle,
  workbenchOpen = false
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [codeBlocks, setCodeBlocks] = useState<Array<{ language: string; content: string; id: string }>>([]);

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

    // Call onSendMessage callback
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

  const handleExpandCode = (code: { language: string; content: string }, messageId: string) => {
    const codeBlock = {
      ...code,
      id: `${messageId}-${Date.now()}`
    };
    setCodeBlocks(prev => [...prev, codeBlock]);
    onWorkbenchToggle?.();
  };

  const handleChipClick = (chip: string) => {
    setInput(chip);
    textareaRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  // Extract code blocks from bot messages
  useEffect(() => {
    const extractedCodeBlocks: Array<{ language: string; content: string; id: string }> = [];
    
    messages.forEach(message => {
      if (message.role === 'bot' && message.content) {
        // Simple regex to extract code blocks
        const codeRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
        let match;
        
        while ((match = codeRegex.exec(message.content)) !== null) {
          extractedCodeBlocks.push({
            language: match[1] || 'text',
            content: match[2].trim(),
            id: `${message.id}-${extractedCodeBlocks.length}`
          });
        }
      }
    });
    
    setCodeBlocks(extractedCodeBlocks);
  }, [messages]);

  return (
    <WorkbenchContext.Provider value={{ 
      openWorkbench: (blocks) => setCodeBlocks(blocks), 
      closeWorkbench: () => setCodeBlocks([]) 
    }}>
      <div className="flex flex-col h-full bg-black" dir="rtl">
        {/* Topbar */}
        <div className="flex-shrink-0 h-14 bg-black/80 backdrop-blur-sm border-b border-red-500/20 flex items-center justify-between px-4 gap-3">
          {/* Left: mobile menu + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenSidebar}
              className="lg:hidden p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 transition-colors flex-shrink-0"
              aria-label="فتح القائمة"
            >
              <Menu size={18} className="text-red-400" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{conversationTitle}</p>
            </div>
          </div>

          {/* Right: bot status + workbench toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {codeBlocks.length > 0 && (
              <Button
                onClick={onWorkbenchToggle}
                variant="ghost"
                size="sm"
                className={cn(
                  "text-red-400 hover:text-red-300 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20",
                  workbenchOpen && "bg-red-600/30 border-red-500/40"
                )}
              >
                <Code2 className="w-4 h-4 ml-1" />
                Workbench
                {codeBlocks.length > 0 && (
                  <span className="mr-1 px-1.5 py-0.5 bg-red-600 rounded text-xs text-white">
                    {codeBlocks.length}
                  </span>
                )}
              </Button>
            )}
            
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-400 hidden sm:block">{connectedLabel}</span>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border border-red-500/30">
              <Bot size={16} className="text-white" />
            </div>
          </div>
        </div>

        {/* Messages area - Adaptive Layout */}
        <div className="flex-1 overflow-hidden">
          {/* Desktop: Side-by-Side */}
          <div className="hidden lg:flex h-full">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 min-h-0">
                {isEmpty && quickChips.length > 0 && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center">
                    <div className="mb-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border border-red-500/30"
                      >
                        <span className="text-white font-bold text-2xl">C</span>
                      </motion.div>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">كيف يمكنني مساعدتك؟</h2>
                    <p className="text-sm text-red-400 mb-8 max-w-sm leading-relaxed">{emptySubtitle}</p>
                    <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                      {quickChips.slice(0, 6).map((chip, index) => (
                        <motion.button
                          key={`chip-${index}`}
                          onClick={() => handleChipClick(chip)}
                          className="text-right px-4 py-3 rounded-xl text-sm bg-black/50 border border-red-500/20 hover:bg-red-600/10 hover:border-red-500/40 transition-all duration-200"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {chip}
                        </motion.button>
                      ))}
                    </div>
                    <div className="mt-8 flex items-center gap-2 text-xs text-red-500/60">
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
                      {message.role === "bot" && (
                        <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-red-400" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3",
                          message.role === "user"
                            ? "bg-red-600 text-white"
                            : "bg-black/50 border border-red-500/20"
                        )}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>

                        {/* Inline Sheet Cards */}
                        {message.fileCards && message.fileCards.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.fileCards.map((fileCard, index) => (
                              <div key={index} className="inline-block">
                                <StudySheetCard
                                  title={fileCard.fileName}
                                  fileSize={fileCard.fileSize}
                                  onDownload={() => {
                                    window.open(fileCard.downloadUrl, '_blank');
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Code blocks with expand button */}
                        {message.content && message.content.includes('```') && (
                          <div className="mt-3">
                            {(() => {
                              const codeRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
                              const matches = [];
                              let match;
                              while ((match = codeRegex.exec(message.content)) !== null) {
                                matches.push({
                                  language: match[1] || 'text',
                                  content: match[2].trim(),
                                  id: `${message.id}-${matches.length}`
                                });
                              }
                              
                              return matches.map((code, index) => (
                                <div key={code.id} className="mb-2 last:mb-0">
                                  <div className="bg-black/70 border border-red-500/20 rounded-lg overflow-hidden">
                                    <div className="bg-red-900/20 px-3 py-1.5 text-xs text-red-400 flex items-center justify-between">
                                      <span>{code.language}</span>
                                      <button 
                                        onClick={() => handleExpandCode(code, message.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 text-xs"
                                      >
                                        <Expand className="w-3 h-3" />
                                        فتح في Workbench
                                      </button>
                                    </div>
                                    <pre className="p-3 text-xs overflow-x-auto max-h-32">
                                      <code className="text-gray-300">{code.content}</code>
                                    </pre>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )}

                        <p className="text-[10px] text-red-500/60 mt-2 opacity-60">
                          {message.timestamp}
                        </p>
                      </div>

                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-red-400" />
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
                      <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="bg-black/50 border border-red-500/20 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-red-500 rounded-full"
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
            </div>
          </div>

          {/* Mobile: Top-Bottom Layout */}
          <div className="lg:hidden flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 min-h-0">
              {/* Same content as desktop but simplified for mobile */}
              {isEmpty && quickChips.length > 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center">
                  <div className="mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border border-red-500/30"
                    >
                      <span className="text-white font-bold text-lg">C</span>
                    </motion.div>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2">كيف يمكنني مساعدتك؟</h2>
                  <p className="text-sm text-red-400 mb-6 max-w-sm leading-relaxed">{emptySubtitle}</p>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                    {quickChips.slice(0, 4).map((chip, index) => (
                      <motion.button
                        key={`chip-${index}`}
                        onClick={() => handleChipClick(chip)}
                        className="text-right px-3 py-2 rounded-lg text-sm bg-black/50 border border-red-500/20 hover:bg-red-600/10 hover:border-red-500/40 transition-all duration-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {chip}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages for mobile */}
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
                      <div className="w-6 h-6 rounded-full bg-red-600/20 flex items-center justify-center">
                        <Bot className="w-3 h-3 text-red-400" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[90%] rounded-xl px-3 py-2",
                        message.role === "user"
                          ? "bg-red-600 text-white"
                          : "bg-black/50 border border-red-500/20"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      
                      <p className="text-[9px] text-red-500/60 mt-1 opacity-60">
                        {message.timestamp}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-red-600/30 flex items-center justify-center">
                        <User className="w-3 h-3 text-red-400" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="p-4 border-t border-red-500/20 bg-black/80 backdrop-blur-sm shrink-0">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 bg-black/50 border border-red-500/20 rounded-2xl p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-300 shrink-0"
              >
                <Paperclip className="w-5 h-5" />
              </Button>

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white placeholder-red-900/50"
                rows={1}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-300 shrink-0"
              >
                <Mic className="w-5 h-5" />
              </Button>

              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="bg-red-600 hover:bg-red-700 text-white shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>

          <p className="text-[10px] text-center text-red-500/60 mt-2">
            Cypher قد ينتج معلومات غير دقيقة. تحقق من التفاصيل المهمة.
          </p>
        </div>
      </div>
    </WorkbenchContext.Provider>
  );
}
