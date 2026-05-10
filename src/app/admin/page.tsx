'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, MessageSquare } from 'lucide-react';
import SheetUploadForm from '@/app/chat-interface/components/SheetUploadForm';

export default function AdminUploadPage() {
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
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            ارفع ملفات PDF أو صوراً أو نصوصاً. تُحفظ في مساحة التخزين وتُفهرس للبحث عندما يكتب الطلاب في
            المحادثة.
          </p>
          <SheetUploadForm />
        </div>
      </main>
    </div>
  );
}
