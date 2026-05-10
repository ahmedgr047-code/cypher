'use client';

import React, { useState } from 'react';
import { X, LogOut, Moon, Sun, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useUserSettings } from '@/components/providers/UserSettingsProvider';
import { chatT } from '@/lib/chat-i18n';

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  user: { fullName: string; email: string; studentId: string | null };
};

export default function SettingsPanel({ open, onClose, user }: SettingsPanelProps) {
  const router = useRouter();
  const { theme, setTheme, locale, setLocale, botPersona, setBotPersona } = useUserSettings();
  const [draftPersona, setDraftPersona] = useState(botPersona);

  React.useEffect(() => {
    if (open) setDraftPersona(botPersona);
  }, [open, botPersona]);

  const t = (k: import('@/lib/chat-i18n').ChatUiKey) => chatT(locale, k);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success(locale === 'ar' ? 'تم تسجيل الخروج' : 'Signed out');
    onClose();
    router.push('/');
    router.refresh();
  };

  const savePersona = () => {
    setBotPersona(draftPersona.trim());
    toast.success(locale === 'ar' ? 'تم حفظ التوجيهات' : 'Instructions saved');
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 overlay-backdrop"
      onClick={onClose}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-foreground">{t('settings')}</h2>
          <button type="button" onClick={onClose} className="btn-ghost p-2 rounded-lg" aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-5 flex-1">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('displayName')}</p>
            <p className="text-sm text-foreground font-medium">{user.fullName}</p>
            <p className="text-xs text-muted-foreground font-mono-data mt-0.5" dir="ltr">
              {user.studentId || user.email}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Sun size={14} className="inline opacity-70" />
              {t('theme')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 rounded-xl text-sm flex items-center justify-center gap-2 border ${
                  theme === 'dark'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <Moon size={16} />
                {t('themeDark')}
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 rounded-xl text-sm flex items-center justify-center gap-2 border ${
                  theme === 'light'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <Sun size={16} />
                {t('themeLight')}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Languages size={14} className="inline opacity-70" />
              {t('language')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLocale('ar')}
                className={`flex-1 py-2 rounded-xl text-sm border ${
                  locale === 'ar'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {t('langAr')}
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`flex-1 py-2 rounded-xl text-sm border ${
                  locale === 'en'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {t('langEn')}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">{t('botPersona')}</label>
            <textarea
              value={draftPersona}
              onChange={(e) => setDraftPersona(e.target.value)}
              rows={4}
              placeholder={t('botPersonaHint')}
              className="input-field w-full text-sm resize-y min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t('botPersonaHint')}</p>
            <button
              type="button"
              onClick={savePersona}
              className="btn-primary w-full mt-3 py-2.5 text-sm"
            >
              {t('savePersona')}
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
