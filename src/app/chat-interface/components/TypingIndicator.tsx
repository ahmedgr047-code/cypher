'use client';

import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 message-enter">
      {/* Bot avatar */}
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 glow-red-sm">
        <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
          <path
            d="M10 14C10 11.8 11.8 10 14 10H34C36.2 10 38 11.8 38 14V28C38 30.2 36.2 32 34 32H26L20 38V32H14C11.8 32 10 30.2 10 28V14Z"
            fill="white"
            fillOpacity="0.9"
          />
          <line x1="16" y1="18" x2="28" y2="18" stroke="#E8192C" strokeWidth="3" strokeLinecap="round" />
          <line x1="16" y1="24" x2="24" y2="24" stroke="#E8192C" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      <div className="chat-bubble-bot px-4 py-3 flex items-center gap-1.5">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}