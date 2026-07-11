"use client";

import { useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type UuidGeneratorClientProps = {
  dict: Dictionary;
};

function formatUuid(uuid: string, includeHyphens: boolean, uppercase: boolean): string {
  const value = includeHyphens ? uuid : uuid.replace(/-/g, "");
  return uppercase ? value.toUpperCase() : value;
}

export function UuidGeneratorClient({ dict }: UuidGeneratorClientProps) {
  const t = dict.uuidGenerator;

  const [count, setCount] = useState(5);
  const [includeHyphens, setIncludeHyphens] = useState(true);
  const [uppercase, setUppercase] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = () => {
    const list = Array.from({ length: count }, () =>
      formatUuid(crypto.randomUUID(), includeHyphens, uppercase),
    );
    setUuids(list);
  };

  const handleCopy = (index: number, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex((i) => (i === index ? null : i)), 2000);
  };

  const handleCopyAll = () => {
    if (uuids.length === 0) return;
    navigator.clipboard.writeText(uuids.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 rounded-xl shadow-sm border border-sky-200/50 dark:border-sky-700/30 flex-shrink-0">
                <Icon name="fingerprint" className="h-7 w-7" />
              </div>
              {t.title}
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-3 ml-1 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Options */}
      <div className="flex flex-wrap items-end gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)]">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            {t.count}
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
            className="w-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-500/20"
          />
        </div>

        <label className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeHyphens}
            onChange={(e) => setIncludeHyphens(e.target.checked)}
            className="accent-sky-600"
          />
          {t.includeHyphens}
        </label>

        <label className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="accent-sky-600"
          />
          {t.uppercase}
        </label>

        <div className="flex-grow" />

        <button
          type="button"
          onClick={handleGenerate}
          className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] cursor-pointer"
        >
          {t.generate}
        </button>
      </div>

      {/* Results */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2">
          <span className="font-bold text-sm text-slate-600 dark:text-slate-400">
            {t.resultsLabel} ({uuids.length})
          </span>
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={uuids.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-500 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {copiedAll ? t.copied : t.copyAll}
          </button>
        </div>

        {uuids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-5 bg-sky-50 dark:bg-sky-900/20 rounded-3xl mb-4 border border-sky-100 dark:border-sky-800/30">
              <Icon name="fingerprint" className="h-10 w-10 text-sky-400 dark:text-sky-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
              {t.emptyState}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {uuids.map((uuid, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 px-4 py-2.5"
              >
                <span className="font-mono text-sm text-slate-800 dark:text-slate-100 break-all">{uuid}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(i, uuid)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-500 active:scale-95 cursor-pointer"
                >
                  {copiedIndex === i ? t.copied : t.copy}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.help.description1}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.help.description2}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">{t.help.description3}</p>
        </div>
      </div>
    </div>
  );
}
