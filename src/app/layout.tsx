import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import { UserSettingsProvider } from '@/components/providers/UserSettingsProvider';

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body className={geist.className}>
        <UserSettingsProvider>{children}</UserSettingsProvider>
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