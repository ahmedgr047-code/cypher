"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Bot, User, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StudySheetCard } from "@/components/study-sheet-card";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  code?: {
    language: string;
    content: string;
  };
  artifact?: {
    type: "study-sheet";
    title: string;
    fileSize: string;
  };
  timestamp: Date;
}

interface ChatInterfaceProps {
  onCodeGenerated?: (code: { language: string; content: string }) => void;
  onExpandCode?: (code: { language: string; content: string }) => void;
  persona?: { name: string; personality: string };
}

const sampleMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm Fatiha, your AI coding assistant. I can help you with programming questions, code review, and learning new concepts. What would you like to work on today?",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "2",
    role: "user",
    content: "Can you create a study sheet about Python basics for me?",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: "3",
    role: "assistant",
    content: "I've prepared a comprehensive study sheet covering Python fundamentals including variables, data types, control flow, and functions. You can download it below:",
    artifact: {
      type: "study-sheet",
      title: "Python Basics - Complete Study Guide.pdf",
      fileSize: "2.4 MB",
    },
    timestamp: new Date(Date.now() - 30000),
  },
];

export function ChatInterface({ onCodeGenerated, onExpandCode, persona }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I understand you want to learn about this topic. Here's a simple example to get you started:",
        code: {
          language: "python",
          content: `def hello_world():
    """A simple function that prints Hello World"""
    print("Hello, World!")
    return True

# Call the function
if __name__ == "__main__":
    hello_world()`,
        },
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);

      if (onCodeGenerated && aiResponse.code) {
        onCodeGenerated(aiResponse.code);
      }
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExpandCode = (code: { language: string; content: string }) => {
    if (onExpandCode) {
      onExpandCode(code);
    }
  };

  const personaName = persona?.name || "Fatiha";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Persona Status */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">
            {isTyping ? (
              <span className="text-primary">{personaName} is analyzing your code...</span>
            ) : (
              <span>{personaName} is ready to help</span>
            )}
          </span>
        </motion.div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 min-h-0">
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

                {message.code && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-primary/20">
                    <div className="bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
                      <span>{message.code.language}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleExpandCode(message.code!)}
                          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                          <Expand className="w-3 h-3" />
                          Open in Workbench
                        </button>
                        <span className="text-muted-foreground/30">|</span>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          Copy
                        </button>
                      </div>
                    </div>
                    <pre className="p-3 text-xs overflow-x-auto bg-background/50 max-h-40">
                      <code className="text-foreground">{message.code.content}</code>
                    </pre>
                  </div>
                )}

                {message.artifact && message.artifact.type === "study-sheet" && (
                  <div className="mt-4">
                    <StudySheetCard
                      title={message.artifact.title}
                      fileSize={message.artifact.fileSize}
                      onDownload={() => {
                        console.log("Downloading:", message.artifact?.title);
                      }}
                    />
                  </div>
                )}

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
              placeholder="Message Cypher..."
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
          Cypher may produce inaccurate information. Verify important details.
        </p>
      </div>
    </div>
  );
}
