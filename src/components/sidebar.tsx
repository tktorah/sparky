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
  const homeHref = `/${lang}/conv/home`;

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
          <span className="text-blue-500 transition-transform duration-700 hover:rotate-360 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100 justify-center">
            <Icon name="sparky" className="h-6 w-6" />
          </span>
          <span className={collapsed ? "hidden" : "block"}>
            <span className="block bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-2xl font-extrabold tracking-normal text-transparent dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100">
              Sparky
            </span>
            <span className="mt-1 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100">
              Developer Tools
            </span>
          </span>
        </a>
      </div>

      <nav className={`grid gap-1 overflow-y-auto overflow-x-hidden px-1 pb-5 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100 ${ collapsed ? "justify-center" : ""}`}>
        <a
          className={`flex w-full min-w-0 min-h-10 items-center gap-1 rounded-2xl transition hover:-translate-y-0.5 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100 px-4 py-3 text-dark-500 ${
            pathname === homeHref
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
            className={`flex w-full min-w-0 min-h-10 items-center gap-1 rounded-2xl transition hover:-translate-y-0.5 dark:border-slate-700/80 dark:bg-slate-800/75 dark:text-slate-100 px-4 py-6 text-dark-400 ${
              pathname === tool.href
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
