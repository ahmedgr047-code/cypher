"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/app-sidebar";
import { SettingsPanel } from "@/components/settings-panel";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string>("1");

  const handleNewChat = () => {
    // Would create new chat in real implementation
    setActiveChatId(Date.now().toString());
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
      />

      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarOpen ? 280 : 72 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="min-h-screen"
      >
        {children}
      </motion.main>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
