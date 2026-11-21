import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import kn from './locales/kn.json';

export const SUPPORTED_LANGUAGES = ['en', 'ta', 'hi', 'te', 'kn'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

const rawLang = typeof window !== 'undefined' ? localStorage.getItem('civicresolve_lang') || 'en' : 'en';
const savedLanguage = SUPPORTED_LANGUAGES.includes(rawLang as any) ? rawLang : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta },
    hi: { translation: hi },
    te: { translation: te },
    kn: { translation: kn },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
  load: 'languageOnly',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Keep document.documentElement.lang synchronized
if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLanguage;
}

i18n.on('languageChanged', (lng) => {
  const code = (lng || 'en').split('-')[0];
  if (typeof document !== 'undefined') {
    document.documentElement.lang = code;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('civicresolve_lang', code);
    window.dispatchEvent(new CustomEvent('civicresolve_lang_changed', { detail: code }));
  }
});

export default i18n;
