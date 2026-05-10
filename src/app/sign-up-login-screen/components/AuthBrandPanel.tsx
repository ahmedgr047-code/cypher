'use client';

import React from 'react';

export default function AuthBrandPanel() {
  return (
    <div className="w-full h-full gradient-brand flex flex-col items-center justify-center p-12 relative overflow-hidden">
      {/* Background decorative circles */}
      <div
        className="absolute rounded-full border border-primary opacity-10"
        style={{ width: '600px', height: '600px', top: '-200px', right: '-200px' }}
      />
      <div
        className="absolute rounded-full border border-primary opacity-10"
        style={{ width: '400px', height: '400px', bottom: '-100px', left: '-100px' }}
      />
      <div
        className="absolute rounded-full opacity-5"
        style={{
          width: '300px',
          height: '300px',
          top: '30%',
          left: '10%',
          background: 'var(--primary)',
          filter: 'blur(80px)',
        }}
      />
      {/* Logo + name */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo mark */}
        <div className="mb-6 glow-red rounded-2xl">
          <CypherLogoMarkLarge />
        </div>

        <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Cypher</h1>
        <p className="text-xl text-white opacity-70 mb-2 font-medium">معهد الشموخ</p>
        <div className="w-12 h-0.5 bg-primary rounded-full mb-6" />
        <p className="text-white opacity-60 text-base leading-relaxed max-w-xs text-center">
          مساعدك الدراسي الذكي — ابحث عن أي شيت أو منهج في ثوانٍ واحصل عليه مباشرة
        </p>

        {/* Feature pills */}
        <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
          {[
            { icon: '📚', label: 'جميع الشيتات والمناهج في مكان واحد' },
            { icon: '⚡', label: 'مساعدة دراسية فورية داخل المنصة' },
            { icon: '🔒', label: 'حساب شخصي آمن لكل طالب' },
          ]?.map((f) => (
            <div
              key={`feature-${f?.icon}`}
              className="flex items-center gap-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-xl px-4 py-3"
            >
              <span className="text-lg">{f?.icon}</span>
              <span className="text-white text-sm opacity-80">{f?.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CypherLogoMarkLarge() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="url(#logo-grad-lg)" />
      <path
        d="M10 14C10 11.8 11.8 10 14 10H34C36.2 10 38 11.8 38 14V28C38 30.2 36.2 32 34 32H26L20 38V32H14C11.8 32 10 30.2 10 28V14Z"
        fill="white"
        fillOpacity="0.95"
      />
      <line x1="16" y1="18" x2="32" y2="18" stroke="#E8192C" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="22" x2="28" y2="22" stroke="#E8192C" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="26" x2="24" y2="26" stroke="#E8192C" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="18" r="2.5" fill="#E8192C" />
      <defs>
        <linearGradient id="logo-grad-lg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF3347" />
          <stop offset="1" stopColor="#8B0A16" />
        </linearGradient>
      </defs>
    </svg>
  );
}