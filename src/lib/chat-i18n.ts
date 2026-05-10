import type { UiLocale } from '@/components/providers/UserSettingsProvider';

export type ChatUiKey =
  | 'settings'
  | 'theme'
  | 'themeDark'
  | 'themeLight'
  | 'language'
  | 'langAr'
  | 'langEn'
  | 'botPersona'
  | 'botPersonaHint'
  | 'displayName'
  | 'logout'
  | 'close'
  | 'connected'
  | 'placeholderInput'
  | 'emptySubtitle'
  | 'footerNote'
  | 'savePersona';

const STRINGS: Record<UiLocale, Record<ChatUiKey, string>> = {
  ar: {
    settings: 'الإعدادات',
    theme: 'المظهر',
    themeDark: 'ليلي',
    themeLight: 'نهاري',
    language: 'اللغة',
    langAr: 'العربية',
    langEn: 'English',
    botPersona: 'شخصية إضافية للبوت (اختياري)',
    botPersonaHint:
      'توجيهات تُضاف لسلوك Cypher في هذه الجهاز فقط، مثل: ركّز على حل التمارين خطوة بخطوة.',
    displayName: 'الاسم',
    logout: 'تسجيل الخروج',
    close: 'إغلاق',
    connected: 'Cypher متصل',
    placeholderInput: 'اكتب سؤالك أو ارفع ملفاً للتحليل…',
    emptySubtitle:
      'أخبرني باسم المادة وسأساعدك؛ الشيتات المطابقة تظهر من قاعدة البيانات عند البحث.',
    footerNote: 'معهد الشموخ — مساعد دراسي ذكي',
    savePersona: 'حفظ التوجيهات',
  },
  en: {
    settings: 'Settings',
    theme: 'Appearance',
    themeDark: 'Dark',
    themeLight: 'Light',
    language: 'Language',
    langAr: 'العربية',
    langEn: 'English',
    botPersona: 'Extra bot instructions (optional)',
    botPersonaHint:
      'Hints added to Cypher on this device only, e.g. focus on step-by-step exercises.',
    displayName: 'Name',
    logout: 'Log out',
    close: 'Close',
    connected: 'Cypher online',
    placeholderInput: 'Ask a question or upload a file…',
    emptySubtitle:
      'Tell me the subject name for help; matching sheets appear when found in search.',
    footerNote: 'Al-Shumoukh Institute — study assistant',
    savePersona: 'Save instructions',
  },
};

export function chatT(locale: UiLocale, key: ChatUiKey): string {
  return STRINGS[locale][key] ?? STRINGS.ar[key] ?? key;
}
