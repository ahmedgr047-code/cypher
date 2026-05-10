import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Cypher — رفع الشيتات',
  description: 'لوحة رفع الشيتات والمناهج إلى أرشيف المعهد',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const raw = process.env.CYPHER_ADMIN_EMAILS?.trim();
  if (raw) {
    const allowed = new Set(
      raw
        .split(/[,;\n]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    const em = user.email?.toLowerCase();
    if (!em || !allowed.has(em)) {
      redirect('/chat-interface');
    }
  }

  return <>{children}</>;
}
