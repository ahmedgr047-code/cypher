"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Settings,
  LogOut,
  User,
  Plus,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CypherLogo } from "@/components/cypher-logo";
import { cn } from "@/lib/utils";

interface ChatHistory {
  id: string;
  title: string;
  date: string;
}

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  activeChatId?: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

const mockChatHistory: ChatHistory[] = [
  { id: "1", title: "React Component Help", date: "Today" },
  { id: "2", title: "Python Script Debug", date: "Today" },
  { id: "3", title: "CSS Flexbox Tutorial", date: "Yesterday" },
  { id: "4", title: "Java OOP Concepts", date: "Yesterday" },
  { id: "5", title: "Database Design", date: "Last week" },
];

export function AppSidebar({
  isOpen,
  onToggle,
  onOpenSettings,
  activeChatId,
  onSelectChat,
  onNewChat,
}: AppSidebarProps) {
  const [chatHistory] = useState<ChatHistory[]>(mockChatHistory);

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 72 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40"
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <Link href="/chat" className="flex items-center gap-3">
            <CypherLogo size="sm" animate={false} />
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-bold text-lg text-foreground"
                >
                  Cypher
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={onNewChat}
            className={cn(
              "w-full bg-primary hover:bg-primary/90 text-primary-foreground",
              !isOpen && "p-2"
            )}
          >
            <Plus className="w-4 h-4" />
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="ml-2 overflow-hidden whitespace-nowrap"
                >
                  New Chat
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
              >
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      activeChatId === chat.id
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                    )}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate text-sm">{chat.title}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed view - just icons */}
          {!isOpen && (
            <div className="space-y-2">
              {chatHistory.slice(0, 5).map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={cn(
                    "w-full p-2 rounded-lg flex items-center justify-center transition-colors",
                    activeChatId === chat.id
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button
            onClick={onOpenSettings}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors",
              !isOpen && "justify-center"
            )}
          >
            <Settings className="w-4 h-4" />
            {isOpen && <span className="text-sm">Settings</span>}
          </button>

          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors",
              !isOpen && "justify-center"
            )}
          >
            <User className="w-4 h-4" />
            {isOpen && <span className="text-sm">Account</span>}
          </button>

          <Link
            href="/login"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors",
              !isOpen && "justify-center"
            )}
          >
            <LogOut className="w-4 h-4" />
            {isOpen && <span className="text-sm">Logout</span>}
          </Link>
        </div>
      </motion.aside>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </>
  );
}
