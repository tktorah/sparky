import type { Metadata } from "next";
import { locales, defaultLocale, type Locale } from "@/app/[lang]/dictionaries";

export const SITE_URL = "https://devtora.org";
const SITE_NAME = "DevTora";

const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  ko: "ko_KR",
  ja: "ja_JP",
};

type BuildPageMetadataArgs = {
  lang: Locale;
  /** Path after the locale segment, starting with "/", e.g. "/conv/json-formatter". */
  path: string;
  title: string;
  description: string;
};

export function buildPageMetadata({ lang, path, title, description }: BuildPageMetadataArgs): Metadata {
  const url = `${SITE_URL}/${lang}${path}`;

  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${SITE_URL}/${locale}${path}`;
  }
  languages["x-default"] = `${SITE_URL}/${defaultLocale}${path}`;

  // The page <title> includes the "| DevTora" suffix; the OG image already
  // shows the DevTora wordmark on its own, so strip the suffix there.
  const imageTitle = title.replace(/ \| DevTora$/, "");
  const ogImageUrl = `${SITE_URL}/og?title=${encodeURIComponent(imageTitle)}&subtitle=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
