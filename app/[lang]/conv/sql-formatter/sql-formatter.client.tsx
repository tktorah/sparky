"use client";

import { useMemo, useState } from "react";
import { format, type IdentifierCase, type KeywordCase, type SqlLanguage } from "sql-formatter";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type SqlFormatterClientProps = {
  dict: Dictionary;
};

const DIALECTS: { value: SqlLanguage; labelKey: keyof Dictionary["sqlFormatter"] }[] = [
  { value: "sql", labelKey: "dialectStandard" },
  { value: "mariadb", labelKey: "dialectMariadb" },
  { value: "mysql", labelKey: "dialectMysql" },
  { value: "postgresql", labelKey: "dialectPostgresql" },
  { value: "sqlite", labelKey: "dialectSqlite" },
  { value: "bigquery", labelKey: "dialectBigquery" },
  { value: "db2", labelKey: "dialectDb2" },
  { value: "hive", labelKey: "dialectHive" },
  { value: "plsql", labelKey: "dialectPlsql" },
  { value: "redshift", labelKey: "dialectRedshift" },
  { value: "snowflake", labelKey: "dialectSnowflake" },
  { value: "tsql", labelKey: "dialectTsql" },
];

const INDENT_SIZES = [2, 4, 8] as const;
const CASE_OPTIONS: { value: KeywordCase; labelKey: "caseUpper" | "caseLower" | "casePreserve" }[] = [
  { value: "upper", labelKey: "caseUpper" },
  { value: "lower", labelKey: "caseLower" },
  { value: "preserve", labelKey: "casePreserve" },
];

export function SqlFormatterClient({ dict }: SqlFormatterClientProps) {
  const t = dict.sqlFormatter;

  const [input, setInput] = useState("");
  const [dialect, setDialect] = useState<SqlLanguage>("sql");
  const [indentSize, setIndentSize] = useState<(typeof INDENT_SIZES)[number]>(2);
  const [useTabs, setUseTabs] = useState(false);
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
  const [identifierCase, setIdentifierCase] = useState<IdentifierCase>("preserve");

  const [inputCopied, setInputCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: false };
    try {
      const output = format(input, {
        language: dialect,
        tabWidth: indentSize,
        useTabs,
        keywordCase,
        identifierCase,
      });
      return { output, error: false };
    } catch {
      return { output: "", error: true };
    }
  }, [input, dialect, indentSize, useTabs, keywordCase, identifierCase]);

  const handleClear = () => setInput("");

  const handleCopyInput = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setInputCopied(true);
    setTimeout(() => setInputCopied(false), 2000);
  };

  const handleCopyOutput = () => {
    if (!result.output) return;
    navigator.clipboard.writeText(result.output);
    setOutputCopied(true);
    setTimeout(() => setOutputCopied(false), 2000);
  };

  const toggleClass = (active: boolean) =>
    active
      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300";

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm border border-indigo-200/50 dark:border-indigo-700/30 flex-shrink-0">
                <Icon name="database" className="h-7 w-7" />
              </div>
              {t.title}
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-3 ml-1 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Options bar */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)]">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            {t.dialect}
          </label>
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as SqlLanguage)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 cursor-pointer"
          >
            {DIALECTS.map((d) => (
              <option key={d.value} value={d.value}>
                {t[d.labelKey] as string}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            {t.indentSize}
          </label>
          <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
            {INDENT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setIndentSize(size)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${toggleClass(indentSize === size)}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            {t.keywordCase}
          </label>
          <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
            {CASE_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setKeywordCase(c.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${toggleClass(keywordCase === c.value)}`}
              >
                {t[c.labelKey]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
            {t.identifierCase}
          </label>
          <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
            {CASE_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setIdentifierCase(c.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${toggleClass(identifierCase === c.value)}`}
              >
                {t[c.labelKey]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 px-3.5 py-2 mt-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={useTabs}
            onChange={(e) => setUseTabs(e.target.checked)}
            className="accent-indigo-600"
          />
          {t.useTabs}
        </label>

        <div className="flex-grow" />

        <button
          type="button"
          onClick={handleClear}
          disabled={!input.trim()}
          className="mt-4 flex items-center justify-center p-2.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          title={t.clear}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      {/* Input / Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[600px] items-stretch">
        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/15 focus-within:border-indigo-500/30 transition-all duration-300 h-[450px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center transition-colors">
            <div className="flex items-center gap-2 flex-wrap">
              <Icon name="database" className="text-indigo-500 h-4 w-4" />
              <span>{t.inputLabel}</span>
              {result.error && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 animate-pulse">
                  {t.invalidInput}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopyInput}
              disabled={!input}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {inputCopied ? t.copied : t.copy}
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.pastePlaceholder}
            spellCheck={false}
            className="flex-1 p-4 font-mono text-sm leading-relaxed bg-transparent text-slate-800 dark:text-slate-100 resize-none outline-none overflow-y-auto"
          />
        </div>

        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm h-[450px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center transition-colors">
            <div className="flex items-center gap-2 flex-wrap">
              <Icon name="code" className="text-indigo-500 h-4 w-4" />
              <span>{t.outputLabel}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyOutput}
              disabled={!result.output}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {outputCopied ? t.copied : t.copy}
            </button>
          </div>

          <div className="flex-1 min-h-0 relative">
            {!input.trim() ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium text-center px-6">
                {t.outputEmpty}
              </div>
            ) : (
              <pre className="h-full overflow-y-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {result.output}
              </pre>
            )}
          </div>
        </div>
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
