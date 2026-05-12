"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Settings, User, LogOut, MessageSquare, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
import { CypherLogo } from "@/components/ui/CypherLogo";
import { cn } from "@/lib/utils";

interface ChatHistory {
  id: string;
  title: string;
  date: string;
}

interface NewSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  activeChatId?: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  user: { fullName: string; email: string; studentId: string | null };
}

const mockChatHistory: ChatHistory[] = [
  { id: "1", title: "React Component Help", date: "Today" },
  { id: "2", title: "Python Script Debug", date: "Today" },
  { id: "3", title: "CSS Flexbox Tutorial", date: "Yesterday" },
  { id: "4", title: "Java OOP Concepts", date: "Yesterday" },
  { id: "5", title: "Database Design", date: "Last week" },
];

export function NewSidebar({
  isOpen,
  onToggle,
  onOpenSettings,
  activeChatId,
  onSelectChat,
  onNewChat,
  user
}: NewSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : 320,
          transition: { type: "spring", stiffness: 300, damping: 30 }
        }}
        className="fixed right-0 top-0 h-full w-80 bg-black border-l border-red-500/20 z-50 lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-red-500/20">
            <div className="flex items-center gap-3">
              <CypherLogo size="sm" />
              <div>
                <h3 className="text-white font-semibold">Cypher</h3>
                <p className="text-red-400 text-xs">Libyan Genius</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden text-red-400 hover:text-red-300"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-red-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.fullName}</p>
                <p className="text-red-400 text-xs truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={onNewChat}
              className="w-full bg-red-600 hover:bg-red-700 text-white border border-red-500/30"
            >
              <Plus className="w-4 h-4 ml-2" />
              محادثة جديدة
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-4">
            <h4 className="text-red-400 text-xs font-semibold mb-3 uppercase tracking-wider">
              المحادثات السابقة
            </h4>
            <div className="space-y-2">
              {mockChatHistory.map((conv) => (
                <motion.button
                  key={conv.id}
                  onClick={() => onSelectChat(conv.id)}
                  className={cn(
                    "w-full text-right p-3 rounded-lg border transition-all duration-200",
                    activeChatId === conv.id
                      ? "bg-red-600/20 border-red-500/50 text-white"
                      : "bg-black/50 border-red-500/20 text-gray-300 hover:bg-red-600/10 hover:border-red-500/40"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-red-400 truncate mt-1">{conv.date}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-300"
                      onClick={() => console.log('Delete conversation')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-red-500/20 space-y-2">
            <Button
              variant="ghost"
              onClick={onOpenSettings}
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-600/10"
            >
              <Settings className="w-4 h-4 ml-2" />
              الإعدادات
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-600/10"
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
