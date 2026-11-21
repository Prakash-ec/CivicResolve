/**
 * CivicResolve - Complete Regional Notation Localization Engine
 * Provides locale-aware formatters using W3C Intl API for:
 * - English (en-IN)
 * - Tamil (ta-IN)
 * - Hindi (hi-IN)
 * - Telugu (te-IN)
 * - Kannada (kn-IN)
 *
 * Covers: Dates, Times, Number Grouping (Lakhs/Crores), Currency (INR ₹),
 * Distance Measurements (meters/km), and Relative Timestamps.
 */

export type SupportedLanguage = 'en' | 'ta' | 'hi' | 'te' | 'kn';

export const LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  kn: 'kn-IN',
};

export const SPEECH_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  kn: 'kn-IN',
};

const RELATIVE_TIME_UNITS: Record<
  SupportedLanguage,
  {
    justNow: string;
    minutesAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
    daysAgo: (n: number) => string;
  }
> = {
  en: {
    justNow: 'Just now',
    minutesAgo: (n) => `${n} min${n > 1 ? 's' : ''} ago`,
    hoursAgo: (n) => `${n} hr${n > 1 ? 's' : ''} ago`,
    daysAgo: (n) => `${n} day${n > 1 ? 's' : ''} ago`,
  },
  ta: {
    justNow: 'சற்றுமுன்',
    minutesAgo: (n) => `${n} நிமிடங்களுக்கு முன்`,
    hoursAgo: (n) => `${n} மணி நேரத்திற்கு முன்`,
    daysAgo: (n) => `${n} நாட்களுக்கு முன்`,
  },
  hi: {
    justNow: 'अभी-अभी',
    minutesAgo: (n) => `${n} मिनट पहले`,
    hoursAgo: (n) => `${n} घंटे पहले`,
    daysAgo: (n) => `${n} दिन पहले`,
  },
  te: {
    justNow: 'ఇప్పుడే',
    minutesAgo: (n) => `${n} నిమిషాల క్రితం`,
    hoursAgo: (n) => `${n} గంటల క్రితం`,
    daysAgo: (n) => `${n} రోజుల క్రితం`,
  },
  kn: {
    justNow: 'ಈಗಷ್ಟೇ',
    minutesAgo: (n) => `${n} ನಿಮಿಷಗಳ ಹಿಂದೆ`,
    hoursAgo: (n) => `${n} ಗಂಟೆಗಳ ಹಿಂದೆ`,
    daysAgo: (n) => `${n} ದಿನಗಳ ಹಿಂದೆ`,
  },
};

const DISTANCE_UNITS: Record<SupportedLanguage, { meters: string; km: string }> = {
  en: { meters: 'm', km: 'km' },
  ta: { meters: 'மீட்டர்', km: 'கி.மீ' },
  hi: { meters: 'मीटर', km: 'कि.मी.' },
  te: { meters: 'మీటర్లు', km: 'కి.మీ.' },
  kn: { meters: 'ಮೀಟರ್', km: 'ಕಿ.ಮೀ.' },
};

/**
 * Formats a Date according to the active regional language
 */
export function formatDateLocale(
  dateInput: string | number | Date,
  lang: SupportedLanguage = 'en',
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const locale = LOCALE_MAP[lang] || 'en-IN';
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats clock time according to active regional language
 */
export function formatTimeLocale(
  dateInput: string | number | Date,
  lang: SupportedLanguage = 'en'
): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const locale = LOCALE_MAP[lang] || 'en-IN';
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '';
  }
}

/**
 * Formats integer/decimal numbers with regional Indian numbering system
 */
export function formatNumberLocale(
  num: number,
  lang: SupportedLanguage = 'en',
  fractionDigits = 0
): string {
  try {
    const locale = LOCALE_MAP[lang] || 'en-IN';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(num);
  } catch {
    return String(num);
  }
}

/**
 * Formats INR Currency according to active regional locale
 */
export function formatCurrencyLocale(
  amount: number,
  lang: SupportedLanguage = 'en'
): string {
  try {
    const locale = LOCALE_MAP[lang] || 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount}`;
  }
}

/**
 * Formats distance with localized units (e.g. 150m or 2.4 km)
 */
export function formatDistanceLocale(
  meters: number,
  lang: SupportedLanguage = 'en'
): string {
  const units = DISTANCE_UNITS[lang] || DISTANCE_UNITS.en;
  if (meters >= 1000) {
    const km = (meters / 1000).toFixed(1);
    return `${km} ${units.km}`;
  }
  return `${Math.round(meters)} ${units.meters}`;
}

/**
 * Formats relative timestamp in native script
 */
export function formatRelativeTimeLocale(
  dateInput: string | number | Date,
  lang: SupportedLanguage = 'en'
): string {
  try {
    const now = Date.now();
    const then = new Date(dateInput).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    const unitMap = RELATIVE_TIME_UNITS[lang] || RELATIVE_TIME_UNITS.en;

    if (diffSec < 60) return unitMap.justNow;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return unitMap.minutesAgo(diffMin);
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return unitMap.hoursAgo(diffHr);
    const diffDay = Math.floor(diffHr / 24);
    return unitMap.daysAgo(diffDay);
  } catch {
    return 'Recent';
  }
}
