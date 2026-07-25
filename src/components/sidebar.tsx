"use client";

import type { ToolItem } from "../resources/data";
import { Icon } from "../resources/icons";
import { usePathname } from "next/navigation";
import type { Locale } from "@/app/[lang]/dictionaries";

type SidebarProps = {
  collapsed: boolean;
  open: boolean;
  tools: ToolItem[];
  lang: Locale;
  homeLabel: string;
  onClose: () => void;
};

export function Sidebar({
  collapsed,
  open,
  tools,
  lang,
  homeLabel,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const homeHref = `/${lang}`;

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col overflow-hidden border-r border-slate-100/10 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-[width,translate] duration-300 lg:sticky lg:translate-x-0 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100",
        collapsed ? "w-[64px]" : "w-60",
        open ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
      aria-label="Main navigation"
    >
      <div
        className={[
          "flex shrink-0 items-center gap-3 px-2 py-5 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100",
          collapsed ? "justify-center" : "justify-between",
        ].join(" ")}
      >
        <a
          className="flex min-w-0 items-center gap-3 outline-none"
          href={homeHref}
          onClick={onClose}
        >
          <div className="group flex items-center gap-2 cursor-pointer px-2">
            {/* 1. 아이콘: 다크 모드일 때 흰색(dark:text-white) 적용 */}
            <span className="text-blue-500 dark:text-white transition-transform duration-700 group-hover:scale-130 flex items-center justify-center">
              <Icon name="sparky" className="h-9 w-9 fill-current stroke-none" />
            </span>

            {/* 2. 텍스트 영역 */}
            <span className={collapsed ? "hidden" : "block"}>
              {/* 메인 텍스트: 그라데이션이 적용되어 있어 라이트/다크 모드 모두 화려하게 유지됩니다. 
        만약 다크 모드에서 단색 흰색을 원하시면 dark:from-white dark:to-white 등을 활용할 수 있습니다. */}
              <span className="block bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-2xl font-extrabold tracking-normal text-transparent dark:text-white">
                DevTora
              </span>

              {/* 서브 텍스트: 다크 모드일 때 흰색(dark:text-white) 적용 */}
              <span className="mt-1 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white">
                Developer Tools
              </span>
            </span>
          </div>
        </a>
      </div>

      <nav className={`grid gap-1 overflow-y-auto overflow-x-hidden py-1 px-1 pb-5 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100 ${collapsed ? "justify-center" : ""}`}>
        <a
          className={`flex w-full min-w-0 min-h-10 items-center gap-1 rounded-2xl transition hover:scale-104 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100 px-4 py-6 text-dark-500 ${pathname === homeHref
            ? "border border-blue-500/20 bg-gradient-to-r from-blue-600/20 to-indigo-600/10 font-semibold shadow-sm shadow-blue-900/20"
            : ""
            }`}
          href={homeHref}
          onClick={onClose}
        >
          <Icon name="home" />
          <span className={collapsed ? "hidden" : "truncate"}>{homeLabel}</span>
        </a>
        {tools.map((tool) => (
          <a
            className={`flex w-full min-w-0 min-h-10 items-center gap-1 rounded-2xl transition hover:scale-104 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100 px-4 py-6 text-dark-400 ${pathname === tool.href
              ? "border border-blue-500/20 bg-gradient-to-r from-blue-600/20 to-indigo-600/10 font-semibold shadow-sm shadow-blue-900/20"
              : ""
              }`}
            href={tool.href}
            key={tool.href}
            onClick={onClose}
          >
            <div className="shrink-0">
              <Icon name={tool.icon as Parameters<typeof Icon>[0]["name"]} />
            </div>
            <span className={collapsed ? "hidden" : "block truncate w-full"}>
              {tool.title}
            </span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
