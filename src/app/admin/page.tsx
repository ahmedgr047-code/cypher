'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, MessageSquare, Lock, Eye, EyeOff } from 'lucide-react';
import SheetUploadForm from '@/app/chat-interface/components/SheetUploadForm';
import { toast } from 'sonner';

const ADMIN_PASSWORD = 'cypher123ahmed';

export default function AdminUploadPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // نتحقق من localStorage إذا كان مسجل قبل
    const saved = localStorage.getItem('cypher_admin_auth');
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('cypher_admin_auth', 'true');
      toast.success('تم الدخول بنجاح');
    } else {
      toast.error('كلمة السر غير صحيحة');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cypher_admin_auth');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold">لوحة تحكم الأرشيف</h1>
            <p className="text-sm text-muted-foreground mt-1">معهد الشموخ · Cypher</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">كلمة السر</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة السر..."
                  className="input-field w-full pr-3 pl-10 py-3"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-sm font-semibold">
              دخول
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <Link href="/chat-interface" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              العودة للمحادثة
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">رفع الشيتات — Cypher</h1>
              <p className="text-xs text-muted-foreground">معهد الشموخ · التخزين في Supabase</p>
            </div>
          </div>
          <Link
            href="/chat-interface"
            className="btn-ghost flex items-center gap-2 px-3 py-2 rounded-xl text-sm flex-shrink-0"
          >
            <MessageSquare size={16} />
            <span>المحادثة</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              ارفع ملفات PDF أو صوراً أو نصوصاً. تُحفظ في مساحة التخزين وتُفهرس للبحث عندما يكتب الطلاب في
              المحادثة.
            </p>
            <button
              onClick={handleLogout}
              className="btn-ghost text-xs px-3 py-1.5 rounded-lg flex-shrink-0 mr-3"
            >
              خروج
            </button>
          </div>
          <SheetUploadForm />
        </div>
      </main>
    </div>
  );
}
