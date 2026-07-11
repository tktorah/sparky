"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/src/components/sidebar";
import { Header } from "@/src/components/header";
import { Footer } from "@/src/components/footer";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { locales, defaultLocale } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/app/[lang]/dictionaries";

type ConvLayoutClientProps = {
  children: ReactNode;
  lang: Locale;
  dict: Dictionary;
};

export function ConvLayoutClient({
  children,
  lang,
  dict,
}: ConvLayoutClientProps) {
  const [query, setQuery] = useState("");
  // Defaults to dark (matching the server-rendered markup and the inline
  // script in app/layout.tsx, which also defaults to dark unless the user
  // has explicitly opted into light mode). The persisted preference is
  // reconciled after mount below so a saved "false" is respected too.
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const id = setTimeout(() => {
      const stored = localStorage.getItem("darkTheme");
      if (stored !== null) setDark(stored === "true");
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Dark mode is applied to <html> (not a wrapper div) so a toggle takes
  // effect immediately on the current page, not just after the next full
  // navigation re-runs the inline script in app/layout.tsx.
  function handleToggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("darkTheme", String(next));
  }

  // 언어 전환: 현재 경로의 언어 prefix를 새 언어로 교체
  function handleLangChange(newLang: Locale) {
    // 쿠키에 선택 언어 저장
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000`;

    // 현재 pathname에서 언어 prefix 교체
    const segments = pathname.split("/");
    // segments[0] = "", segments[1] = current lang
    segments[1] = newLang;
    const newPath = segments.join("/");
    router.push(newPath);
  }

  return (
    <div className="min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_45%_12%,rgba(59,130,246,0.14),transparent_28rem),linear-gradient(135deg,#f8fbff_0%,#eef5ff_42%,#f8fafc_100%)] text-slate-800 dark:bg-[radial-gradient(circle_at_45%_12%,rgba(37,99,235,0.22),transparent_30rem),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)] dark:text-slate-100">
      {/* 모바일 오버레이 */}
      <div
        className={[
          "fixed inset-0 z-30 bg-slate-950/50 opacity-0 backdrop-blur-sm transition lg:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none",
        ].join(" ")}
        onClick={() => setMenuOpen(false)}
      />

      <div className="flex min-h-dvh">
        <Sidebar
          collapsed={collapsed}
          open={menuOpen}
          tools={dict.tools}
          lang={lang}
          homeLabel={dict.nav.home}
          onClose={() => setMenuOpen(false)}
        />
        <div className="flex max-h-dvh min-w-0 flex-1 flex-col overflow-y-auto">
          <Header
            collapsed={collapsed}
            dark={dark}
            menuOpen={menuOpen}
            query={query}
            lang={lang}
            locales={locales}
            searchPlaceholder={dict.header.searchPlaceholder}
            collapseLabel={dict.header.collapseLabel}
            menuLabel={dict.header.menuLabel}
            darkModeLabel={dict.header.darkModeLabel}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
            onOpenMenu={() => setMenuOpen(true)}
            onQueryChange={setQuery}
            onToggleDark={handleToggleDark}
            onLangChange={handleLangChange}
          />
          <main className="mx-auto w-full max-w-[1600px] px-4 py-5 md:px-8 md:py-9">
            {children}
          </main>
          <Footer dict={dict.footer} />
        </div>
      </div>
    </div>
  );
}
