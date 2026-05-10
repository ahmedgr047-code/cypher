'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_THEME = 'cypher_theme';
const STORAGE_LOCALE = 'cypher_locale';
const STORAGE_PERSONA = 'cypher_bot_persona';

export type ThemeMode = 'dark' | 'light';
export type UiLocale = 'ar' | 'en';

type UserSettingsContextValue = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  locale: UiLocale;
  setLocale: (l: UiLocale) => void;
  botPersona: string;
  setBotPersona: (s: string) => void;
  /** جاهز بعد قراءة التخزين المحلي */
  hydrated: boolean;
};

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

function applyDomTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', theme === 'light');
}

function applyDomLocale(locale: UiLocale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale === 'en' ? 'en' : 'ar';
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [locale, setLocaleState] = useState<UiLocale>('ar');
  const [botPersona, setBotPersonaState] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(STORAGE_THEME) as ThemeMode | null;
      if (t === 'light' || t === 'dark') {
        setThemeState(t);
        applyDomTheme(t);
      }
      const l = localStorage.getItem(STORAGE_LOCALE) as UiLocale | null;
      const effLocale = l === 'ar' || l === 'en' ? l : 'ar';
      setLocaleState(effLocale);
      applyDomLocale(effLocale);
      const p = localStorage.getItem(STORAGE_PERSONA);
      if (p) setBotPersonaState(p);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyDomTheme(theme);
    try {
      localStorage.setItem(STORAGE_THEME, theme);
    } catch {
      /* ignore */
    }
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    applyDomLocale(locale);
    try {
      localStorage.setItem(STORAGE_LOCALE, locale);
    } catch {
      /* ignore */
    }
  }, [locale, hydrated]);

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);
  const setLocale = useCallback((l: UiLocale) => setLocaleState(l), []);

  const setBotPersona = useCallback((s: string) => {
    setBotPersonaState(s);
    try {
      localStorage.setItem(STORAGE_PERSONA, s);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      locale,
      setLocale,
      botPersona,
      setBotPersona,
      hydrated,
    }),
    [theme, setTheme, locale, setLocale, botPersona, setBotPersona, hydrated]
  );

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings() {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error('useUserSettings must be used within UserSettingsProvider');
  return ctx;
}
