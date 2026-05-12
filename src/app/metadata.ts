import type { Metadata, Viewport } from 'next';

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
