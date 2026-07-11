"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { ToolItem } from "@/src/resources/data";
import { Icon } from "@/src/resources/icons";

type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
  tools: ToolItem[];
  search: Dictionary["search"];
  placeholder: string;
};

const POPULAR_COUNT = 4;

export function SearchDialog({ open, onClose, tools, search, placeholder }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tools.slice(0, POPULAR_COUNT);
    return tools.filter((tool) =>
      `${tool.title} ${tool.description}`.toLowerCase().includes(normalized),
    );
  }, [query, tools]);

  const isPopularView = query.trim().length === 0;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const id = setTimeout(() => {
      setQuery("");
      setHighlighted(0);
      inputRef.current?.focus();
    }, 0);
    return () => {
      clearTimeout(id);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setHighlighted(0);
  };

  // Arrow-key/Enter selection only applies to the filtered list view. The
  // popular-tools grid has no highlight affordance, so there is nothing for
  // Enter to select and no natural "next" item for a 2-column grid.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (isPopularView) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const target = results[highlighted];
      if (target) window.location.href = target.href;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 sm:pt-32">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800">
          <svg
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-slate-400"
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
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            spellCheck={false}
            className="flex-1 border-none bg-transparent text-lg text-slate-900 outline-none placeholder-slate-400 focus:ring-0 dark:text-white"
          />
          <kbd className="hidden items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-sm sm:flex dark:border-slate-700 dark:bg-slate-800">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label={search.close}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
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
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isPopularView && (
            <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <svg
                aria-hidden="true"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <rect x="14" y="14" width="6" height="6" rx="1" />
              </svg>
              {search.popularTools}
            </div>
          )}

          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm font-medium text-slate-400">{search.noResults}</p>
          ) : isPopularView ? (
            <div className="grid grid-cols-1 gap-1 px-1 sm:grid-cols-2">
              {results.map((tool) => (
                <a
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-center rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span
                    className={[
                      "mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                      tool.accent,
                    ].join(" ")}
                  >
                    <Icon name={tool.icon as Parameters<typeof Icon>[0]["name"]} className="h-4 w-4" />
                  </span>
                  <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                    {tool.title}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((tool, i) => (
                <a
                  key={tool.href}
                  href={tool.href}
                  onMouseEnter={() => setHighlighted(i)}
                  className={[
                    "flex w-full items-center rounded-xl p-3 transition-all",
                    i === highlighted
                      ? "bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      tool.accent,
                    ].join(" ")}
                  >
                    <Icon name={tool.icon as Parameters<typeof Icon>[0]["name"]} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <p className="font-semibold text-slate-900 dark:text-white">{tool.title}</p>
                    <p className="truncate text-xs text-slate-400">{tool.description}</p>
                  </span>
                  {i === highlighted && (
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-4 py-3 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="hidden sm:block">Sparky Search</div>
        </div>
      </div>
    </div>
  );
}
