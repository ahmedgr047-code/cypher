"use client";

import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { UserSettingsProvider } from '@/components/providers/UserSettingsProvider';
import { NewSidebar } from '@/components/NewSidebar';
import { default as NewWorkbench } from '@/components/NewWorkbench';
import AuthCards from '@/components/AuthCards';
import { DebugPanel } from '@/components/DebugPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

interface LayoutClientProps {
  children: React.ReactNode;
}

export default function LayoutClient({ children }: LayoutClientProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workbenchOpen, setWorkbenchOpen] = useState(false);
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [lastError, setLastError] = useState<string | undefined>();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const response = await fetch('/api/profile');
        
        if (!response.ok) {
          console.log('Profile response not ok:', response.status);
          setConnectionStatus('error');
          setLastError(`فشل الاتصال: ${response.status} ${response.statusText}`);
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: 'غير مصرح بالدخول'
          });
          return;
        }

        const user = await response.json();
        console.log('User authenticated:', user);
        setConnectionStatus('success');
        setLastError(undefined);
        
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user
        });
        
        // Load conversations
        try {
          const convResponse = await fetch('/api/conversations');
          if (convResponse.ok) {
            const convData = await convResponse.json();
            setConversations(convData.conversations || []);
            if (convData.conversations?.length > 0) {
              setActiveConvId(convData.conversations[0].id);
            }
          }
        } catch (convError) {
          console.error('Failed to load conversations:', convError);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: 'فشل الاتصال بالخادم. الرجاء التحقق من إعدادات Supabase.'
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

  const handleToggleWorkbench = () => {
    setWorkbenchOpen(!workbenchOpen);
  };

  const handleToggleSplitScreen = () => {
    setIsSplitScreen(!isSplitScreen);
  };

  const testConnection = async () => {
    setConnectionStatus('loading');
    setLastError(undefined);
    
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        setConnectionStatus('success');
        setLastError('الاتصال ناجح!');
      } else {
        setConnectionStatus('error');
        setLastError(`فشل الاتصال: ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      setLastError(`خطأ في الشبكة: ${error}`);
    }
  };

  // Show auth cards if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <AuthCards
        onLogin={handleLogin}
        onSignup={handleSignup}
        onForgotPassword={() => console.log('Forgot password')}
        error={authState.error}
        loading={authState.isLoading}
      />
    );
  }

  return (
    <UserSettingsProvider>
      <div className="flex h-screen bg-black overflow-hidden">
        {/* Sidebar */}
        <NewSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={handleOpenSettings}
          activeChatId={activeConvId || undefined}
          onSelectChat={handleSelectConv}
          onNewChat={handleNewChat}
          user={authState.user!}
        />

        {/* Main Content */}
        <div className={cn(
          "flex flex-col min-w-0",
          isSplitScreen && workbenchOpen && "lg:flex-row lg:h-full"
        )}>
          {/* Chat Interface */}
          <div className={cn(
            "flex-1 flex flex-col min-w-0",
            isSplitScreen && workbenchOpen && "lg:w-1/2 lg:border-l lg:border-red-500/20"
          )}>
            {children}
          </div>

          {/* Workbench in Split Screen */}
          {isSplitScreen && workbenchOpen && (
            <div className="hidden lg:flex lg:w-1/2 flex-col min-w-0">
              <NewWorkbench
                isOpen={true}
                onClose={() => setWorkbenchOpen(false)}
                codeBlocks={codeBlocks}
                onRunCode={handleRunCode}
                isSplitScreen={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Workbench - Fixed at bottom (not split screen) */}
      {!isSplitScreen && (
        <NewWorkbench
          isOpen={workbenchOpen}
          onClose={() => setWorkbenchOpen(false)}
          codeBlocks={codeBlocks}
          onRunCode={handleRunCode}
          isSplitScreen={false}
        />
      )}

      {/* Debug Panel */}
      <DebugPanel
        onTestConnection={testConnection}
        connectionStatus={connectionStatus}
        lastError={lastError}
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
  );
}
