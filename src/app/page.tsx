import React from 'react';
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Layout is now handled by app/layout.tsx
  // This page will render the chat interface through the layout
  // Redirect to chat interface as the main page
  redirect('/chat-interface');
}