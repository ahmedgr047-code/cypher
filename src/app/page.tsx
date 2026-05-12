import React from 'react';

export default function RootPage() {
  // Layout is now handled by app/layout.tsx
  // This page will render the chat interface through the layout
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-red-400 text-sm">
        Loading Cypher...
      </div>
    </div>
  );
}