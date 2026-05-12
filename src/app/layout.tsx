"use client";

import React, { useState, useEffect } from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import { UserSettingsProvider } from '@/components/providers/UserSettingsProvider';
import { NewSidebar } from '@/components/NewSidebar';
import { default as NewWorkbench } from '@/components/NewWorkbench';
import AuthCards from '@/components/AuthCards';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Cypher — المساعد الدراسي لمعهد الشموخ',
  description:
    'Cypher هو مساعد دراسي ذكي لطلاب معهد الشموخ — ابحث عن الشيتات والمناهج بسهولة وحملها مباشرة.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
  user: { fullName: string; email: string; studentId: string | null } | null;
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  unread: boolean;
}

interface CodeBlock {
  language: string;
  content: string;
  id: string;
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workbenchOpen, setWorkbenchOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const user = await response.json();
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user
          });
          
          // Load conversations
          const convResponse = await fetch('/api/conversations');
          if (convResponse.ok) {
            const convData = await convResponse.json();
            setConversations(convData.conversations || []);
            if (convData.conversations?.length > 0) {
              setActiveConvId(convData.conversations[0].id);
            }
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null
          });
        }
      } catch (error) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: 'فشل الاتصال بالخادم'
        });
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const user = await response.json();
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user
        });
      } else {
        const error = await response.json();
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'فشل تسجيل الدخول'
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'فشل الاتصال بالخادم'
      }));
    }
  };

  const handleSignup = async (fullName: string, email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });

      if (response.ok) {
        const user = await response.json();
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user
        });
      } else {
        const error = await response.json();
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'فشل إنشاء الحساب'
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'فشل الاتصال بالخادم'
      }));
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/conversations', { method: 'POST' });
      if (response.ok) {
        const conv = await response.json();
        setConversations(prev => [conv.conversation, ...prev]);
        setActiveConvId(conv.conversation.id);
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    setSidebarOpen(false);
  };

  const handleOpenSettings = () => {
    // Future: Implement settings modal
    console.log('Open settings');
  };

  const handleRunCode = (code: string, language: string) => {
    // Future: Implement code execution
    console.log(`Run ${language} code:`, code);
  };

  // Show auth cards if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <html lang="ar" dir="rtl" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
        <body className={geist.className}>
          <AuthCards
            onLogin={handleLogin}
            onSignup={handleSignup}
            onForgotPassword={() => console.log('Forgot password')}
            error={authState.error}
            loading={authState.isLoading}
          />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                color: '#F5F5F5',
                fontFamily: 'var(--font-geist)',
              },
            }}
          />
        </body>
      </html>
    );
  }

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body className={geist.className}>
        <UserSettingsProvider>
          <div className="flex h-screen bg-black overflow-hidden">
            {/* Sidebar */}
            <NewSidebar
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              onOpenSettings={handleOpenSettings}
              activeChatId={activeConvId}
              onSelectChat={handleSelectConv}
              onNewChat={handleNewChat}
              user={authState.user!}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              {children}
            </div>
          </div>

          {/* Workbench - Fixed at bottom */}
          <NewWorkbench
            isOpen={workbenchOpen}
            onClose={() => setWorkbenchOpen(false)}
            codeBlocks={codeBlocks}
            onRunCode={handleRunCode}
          />

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                color: '#F5F5F5',
                fontFamily: 'var(--font-geist)',
              },
            }}
          />
        </UserSettingsProvider>
      </body>
    </html>
  );
}