"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Bot, User, Expand } from "lucide-react";
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
  inputPlaceholder = 'Message Cypher...',
  emptySubtitle = 'أخبرني باسم المادة وسأساعدك؛ الشيتات المطابقة تُستخرج من أرشيف المعهد.',
  footerNote = 'Cypher may produce inaccurate information. Verify important details.',
  connectedLabel = 'Cypher متصل',
  onCodeGenerated,
  onExpandCode,
  persona
}: NewChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input;
    setInput("");

    // Call the original onSendMessage callback (keeps same logic)
    onSendMessage(messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const formEvent = new Event('submit', { cancelable: true }) as any;
      formEvent.preventDefault = () => {};
      handleSubmit(formEvent);
    }
  };

  const handleExpandCode = (code: { language: string; content: string }) => {
    console.log("Expand code:", code);
    onExpandCode?.(code);
  };

  const handleChipClick = (chip: string) => {
    setInput(chip);
    textareaRef.current?.focus();
  };

  const isEmpty = messages.length === 0;
  const personaName = persona?.name || "Cypher";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Persona Status - New Design from new cypher ui */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">
            {isTyping ? (
              <span className="text-primary">{personaName} is analyzing your request...</span>
            ) : (
              <span>{personaName} is ready to help</span>
            )}
          </span>
        </motion.div>
      </div>

      {/* Messages - New Design from new cypher ui */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 min-h-0">
        {/* Quick Chips for Empty State */}
        {isEmpty && quickChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {quickChips.map((chip, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                onClick={() => handleChipClick(chip)}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                {chip}
              </motion.button>
            ))}
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

                {/* Code Blocks */}
                {message.role === "bot" && message.content.includes('```') && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-primary/20">
                    <div className="bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
                      <span>Code</span>
                      <div className="flex items-center gap-2">
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
                          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                          <Expand className="w-3 h-3" />
                          Open in Workbench
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground mt-2 opacity-60">
                  {new Date(message.timestamp).toLocaleTimeString([], {
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

        {/* Typing Indicator - New Design from new cypher ui */}
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

      {/* Input Area - New Design from new cypher ui */}
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
          {footerNote}
        </p>
      </div>
    </div>
  );
}
