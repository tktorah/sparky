"use client";

import { useState, useRef, useEffect } from "react";
import type { Locale } from "@/app/[lang]/dictionaries";
import { localeNames, localeFlags } from "@/app/[lang]/dictionaries";

type HeaderProps = {
  collapsed: boolean;
  menuOpen: boolean;
  query: string;
  lang: Locale;
  locales: readonly Locale[];
  searchPlaceholder: string;
  collapseLabel: string;
  menuLabel: string;
  darkModeLabel: string;
  onToggleCollapsed: () => void;
  onOpenMenu: () => void;
  onQueryChange: (value: string) => void;
  onToggleDark: () => void;
  onLangChange: (lang: Locale) => void;
  dark: boolean;
};

export function Header({
  collapsed,
  menuOpen,
  query,
  lang,
  locales,
  searchPlaceholder,
  collapseLabel,
  menuLabel,
  darkModeLabel,
  onToggleCollapsed,
  onOpenMenu,
  onQueryChange,
  onToggleDark,
  onLangChange,
  dark,
}: HeaderProps) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 언어 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(e.target as Node)
      ) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const setDarkTheme = () => {
    localStorage.setItem("darkTheme", dark ? "false" : "true");
    onToggleDark();
  };
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/80 bg-slate-50/75 px-4 py-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/75 md:px-6">
      <button
        className="hidden h-10 w-10 items-center justify-center rounded-full border text-slate-300 transition hover:border-blue-500/40 hover:text-white lg:inline-flex dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100"
        type="button"
        aria-label={collapseLabel}
        onClick={onToggleCollapsed}
      >
        <svg
          aria-hidden="true"
          className={`h-5 w-5 transition ${collapsed ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:border-blue-300 lg:hidden dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
        type="button"
        aria-label={menuLabel}
        onClick={onOpenMenu}
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-slate-200/80 bg-white/75 px-4 py-3 text-slate-500 shadow-[0_6px_25px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl md:max-w-xl dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-400">
        <svg
          aria-hidden="true"
          className="h-5 w-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          type="search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </label>

      <div className="ml-auto flex items-center gap-2">
        {/* 언어 전환 드롭다운 */}
        <div className="relative" ref={langMenuRef}>
          <button
            id="lang-switcher"
            className="hidden h-11 items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-300 inline-flex dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100"
            type="button"
            aria-haspopup="listbox"
            aria-expanded={langMenuOpen}
            onClick={() => setLangMenuOpen((v) => !v)}
          >
            <span>{localeFlags[lang]}</span>
            <span className="hidden sm:inline">{localeNames[lang]}</span>
            <svg
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition ${langMenuOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* 드롭다운 메뉴 */}
          {langMenuOpen && (
            <div
              role="listbox"
              aria-label="Select language"
              className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[160px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95"
            >
              {locales.map((locale) => (
                <button
                  key={locale}
                  role="option"
                  aria-selected={locale === lang}
                  type="button"
                  className={[
                    "flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition hover:bg-blue-50 dark:hover:bg-blue-500/10",
                    locale === lang
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300",
                  ].join(" ")}
                  onClick={() => {
                    onLangChange(locale);
                    setLangMenuOpen(false);
                  }}
                >
                  <span className="text-base">{localeFlags[locale]}</span>
                  <span>{localeNames[locale]}</span>
                  {locale === lang && (
                    <svg
                      aria-hidden="true"
                      className="ml-auto h-4 w-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 다크 모드 토글 */}
        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/75 text-slate-700 transition hover:border-blue-300 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100"
          type="button"
          aria-label={darkModeLabel}
          onClick={setDarkTheme}
        >
          {dark ? (
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 9 9 0 1 0 20.5 14.5Z" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
