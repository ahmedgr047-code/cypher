"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Bot, User, Menu, Code2, Activity, Wifi, WifiOff, AlertTriangle, Sparkles, Zap, Shield, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AttachedFile {
  file: File;
  type: "image" | "file";
  dataUri: string;
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [lastError, setLastError] = useState<string | undefined>();
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Check connection and authentication
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          setConnectionStatus('success');
          setLastError(undefined);
        } else {
          setConnectionStatus('error');
          setLastError('فشل الاتصال بالخادم');
        }
      } catch (error) {
        setConnectionStatus('error');
        setLastError('خطأ في الشبكة');
      }
    };
    
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachedFile(null);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.choices[0].message.content,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, botMessage]);
      } else {
        const error = await response.json();
        setLastError(error.error || 'فشل في إرسال الرسالة');
      }
    } catch (error) {
      setLastError('خطأ في الاتصال بالذكاء الاصطناعي');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const formEvent = new Event('submit', { cancelable: true }) as any;
      formEvent.preventDefault = () => {};
      handleSubmit(formEvent);
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedFile({
          file,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          dataUri: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const quickChips = [
    "ابحث عن شيتات الرياضيات",
    "شرح درس الفيزياء",
    "مساعدة في الكيمياء",
    "ملخصات الأحياء"
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col" dir="rtl">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/80 backdrop-blur-md border-b border-red-500/20 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border border-red-500/30"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">Cypher AI</h1>
              <p className="text-red-400 text-sm">المساعد الذكي لطلاب معهد الشموخ</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                connectionStatus === 'loading' ? 'bg-yellow-500 animate-pulse' :
                connectionStatus === 'success' ? 'bg-green-500' :
                'bg-red-500'
              )} />
              <span className="text-red-400 text-sm">
                {connectionStatus === 'loading' ? 'جاري الاتصال...' :
                 connectionStatus === 'success' ? 'متصل' :
                 'فشل الاتصال'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-600/10"
              onClick={() => window.location.href = '/chat-interface'}
            >
              <MessageSquare className="w-4 h-4 ml-2" />
              المحادثات
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-4xl"
        >
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border border-red-500/30"
            >
              <Bot className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl font-bold text-white mb-4"
            >
              مرحباً بك في Cypher AI
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-red-400 text-lg mb-8 max-w-2xl mx-auto"
            >
              المساعد الذكي الذي يساعدك في العثور على الشيتات والمناهج الدراسية بسهولة
            </motion.p>
          </div>

          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-red-950/30 border border-red-500/20 rounded-2xl p-6"
          >
            {/* Quick Chips */}
            {messages.length === 0 && (
              <div className="mb-6">
                <p className="text-red-400 text-sm mb-3">ابدأ بـ:</p>
                <div className="flex flex-wrap gap-2">
                  {quickChips.map((chip, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                      onClick={() => setInput(chip)}
                      className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-300 text-sm hover:bg-red-600/30 hover:border-red-500/50 transition-all duration-200"
                    >
                      {chip}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Display */}
            <div className="mb-6 max-h-96 overflow-y-auto space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-start" : "justify-end"
                    )}
                  >
                    <div className={cn(
                      "max-w-xs lg:max-w-md",
                      message.role === "user" 
                        ? "bg-red-600 text-white rounded-2xl rounded-tl-none" 
                        : "bg-red-950/50 border border-red-500/30 text-white rounded-2xl rounded-tr-none"
                    )}>
                      <div className="flex items-start gap-2 p-3">
                        {message.role === "user" ? (
                          <User className="w-4 h-4 text-white/80 mt-1 flex-shrink-0" />
                        ) : (
                          <Bot className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                        )}
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div className="bg-red-950/50 border border-red-500/30 rounded-2xl rounded-tr-none p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-red-400" />
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="w-2 h-2 bg-red-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-red-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-red-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Error Display */}
            {lastError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 bg-red-900/40 border border-red-500/30 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-semibold text-sm mb-1">خطأ</p>
                    <p className="text-red-300 text-xs">{lastError}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب سؤالك أو اطلب مساعدة..."
                  className="bg-red-950/50 border border-red-500/30 rounded-xl text-white placeholder-red-500/50 resize-none h-12 pr-12"
                  rows={1}
                />
                
                {/* File Attach Button */}
                <label className="absolute left-3 top-3 cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileAttach}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Paperclip className="w-4 h-4 text-red-400 hover:text-red-300 transition-colors" />
                </label>
              </div>

              <Button
                type="submit"
                disabled={!input.trim() && !attachedFile}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 h-12 rounded-xl transition-all duration-200 shadow-lg"
              >
                <Send className="w-4 h-4 ml-2" />
                إرسال
              </Button>
            </form>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-6 text-center">
              <Zap className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">بحث سريع</h3>
              <p className="text-red-400 text-sm">ابحث عن الشيتات والمناهج بذكاء اصطناعي</p>
            </div>
            
            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-6 text-center">
              <Shield className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">آمن وموثوق</h3>
              <p className="text-red-400 text-sm">بيانات من أرشيف معهد الشموخ الرسمي</p>
            </div>
            
            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-6 text-center">
              <Sparkles className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">ذكاء اصطناعي</h3>
              <p className="text-red-400 text-sm">مساعد ذكي متطور لمساعدتك في دراستك</p>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
