import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export const LanguageToggle: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeCode, setActiveCode] = useState(() => (i18n.language || 'en').split('-')[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setActiveCode((lng || 'en').split('-')[0]);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const currentLang = LANGUAGES.find((l) => l.code === activeCode) || LANGUAGES[0];

  const handleSelectLanguage = async (code: string) => {
    setActiveCode(code);
    await i18n.changeLanguage(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('civicresolve_lang', code);
      document.documentElement.lang = code;
      window.dispatchEvent(new CustomEvent('civicresolve_lang_changed', { detail: code }));
    }
    setOpen(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400"
        aria-label="Select Language"
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Select regional language"
      >
        <Globe className="w-3.5 h-3.5 text-orange-400" />
        <span className="font-medium tracking-wide">{currentLang.native}</span>
        <ChevronDown className="w-3 h-3 text-white/70" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white border border-slate-200 shadow-2xl py-1.5 z-50 animate-fadeIn text-slate-800" role="listbox" aria-label="Select regional language">
          <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Regional Languages
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = activeCode === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  isSelected ? 'font-bold text-[#0F2854] bg-blue-50/80' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                  <span className={isSelected ? 'font-bold' : ''}>{lang.native}</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">{lang.code}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
