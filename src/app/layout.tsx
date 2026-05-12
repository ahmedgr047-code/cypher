import { Geist, Geist_Mono } from 'next/font/google';
import '../styles/tailwind.css';
import LayoutClient from './layout-client';
import { metadata, viewport } from './metadata';

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

export { metadata, viewport };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body className={geist.className}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}