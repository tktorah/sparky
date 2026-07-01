import type enDict from "../../dictionaries/en.json";

// Dictionary type derived from the English dictionary (source of truth)
export type Dictionary = typeof enDict;

export type Locale = "en" | "ja" | "ko";

export const locales: Locale[] = ["en", "ja", "ko"];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  ko: "한국어",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  ja: "🇯🇵",
  ko: "🇰🇷",
};

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () =>
    import("../../dictionaries/en.json").then((mod) => mod.default as Dictionary),
  ja: () =>
    import("../../dictionaries/ja.json").then((mod) => mod.default as Dictionary),
  ko: () =>
    import("../../dictionaries/ko.json").then((mod) => mod.default as Dictionary),
};

export function hasLocale(locale: string): locale is Locale {
  return locale in dictionaries;
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
