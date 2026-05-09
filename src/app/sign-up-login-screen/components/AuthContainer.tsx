'use client';

import React, { useState } from 'react';
import AuthBrandPanel from './AuthBrandPanel';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import ForgotPasswordModal from './ForgotPasswordModal';

export type AuthTab = 'login' | 'signup';

export default function AuthContainer() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [showForgot, setShowForgot] = useState(false);

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <AuthBrandPanel />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-16 py-8 relative min-h-screen">
        {/* Mobile brand header */}
        <div className="lg:hidden flex flex-col items-center mb-8 w-full">
          <div className="flex items-center gap-3 mb-2">
            <CypherLogoMark size={40} />
            <span className="text-2xl font-bold text-foreground tracking-tight">Cypher</span>
          </div>
          <p className="text-muted-foreground text-sm text-center">المساعد الدراسي لمعهد الشموخ</p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="flex border-b border-border mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 pb-3 text-sm font-semibold transition-all duration-200 ${
                activeTab === 'login' ?'tab-active' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 pb-3 text-sm font-semibold transition-all duration-200 ${
                activeTab === 'signup' ?'tab-active' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              إنشاء حساب
            </button>
          </div>

          {/* Form content */}
          <div className="fade-in" key={activeTab}>
            {activeTab === 'login' ? (
              <LoginForm
                onForgotPassword={() => setShowForgot(true)}
                onSwitchToSignup={() => setActiveTab('signup')}
              />
            ) : (
              <SignUpForm onSwitchToLogin={() => setActiveTab('login')} />
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-xs text-muted-foreground text-center w-full px-4">
          © {new Date().getFullYear()} معهد الشموخ — Cypher Bot
        </p>
      </div>

      {/* Forgot password modal */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}

function CypherLogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#E8192C" />
      <rect width="48" height="48" rx="12" fill="url(#logo-grad)" />
      {/* Chat bubble body */}
      <path
        d="M10 14C10 11.8 11.8 10 14 10H34C36.2 10 38 11.8 38 14V28C38 30.2 36.2 32 34 32H26L20 38V32H14C11.8 32 10 30.2 10 28V14Z"
        fill="white"
        fillOpacity="0.95"
      />
      {/* Circuit lines */}
      <line x1="16" y1="18" x2="32" y2="18" stroke="#E8192C" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="22" x2="28" y2="22" stroke="#E8192C" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="26" x2="24" y2="26" stroke="#E8192C" strokeWidth="2" strokeLinecap="round" />
      {/* Node dot */}
      <circle cx="32" cy="18" r="2.5" fill="#E8192C" />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF3347" />
          <stop offset="1" stopColor="#8B0A16" />
        </linearGradient>
      </defs>
    </svg>
  );
}