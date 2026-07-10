"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type RegexTesterClientProps = {
  dict: Dictionary;
};

type FlagKey = "g" | "i" | "m" | "s" | "u";

type Segment = { text: string; matched: boolean; matchIndex?: number };

type CodeLang = "js" | "python";

const FLAG_KEYS: FlagKey[] = ["g", "i", "m", "s", "u"];

const PRESETS: { labelKey: "presetEmail" | "presetUrl" | "presetIpv4" | "presetDate" | "presetPhone" | "presetPassword" | "presetUuid"; pattern: string }[] = [
  { labelKey: "presetEmail", pattern: "[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}" },
  { labelKey: "presetUrl", pattern: "https?:\\/\\/[^\\s]+" },
  {
    labelKey: "presetIpv4",
    pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\b",
  },
  { labelKey: "presetDate", pattern: "\\d{4}-\\d{2}-\\d{2}" },
  { labelKey: "presetPhone", pattern: "(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{2,4}\\)?[-.\\s]?\\d{3,4}[-.\\s]?\\d{4}" },
  { labelKey: "presetPassword", pattern: "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$" },
  { labelKey: "presetUuid", pattern: "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" },
];

function buildSegments(text: string, matches: RegExpExecArray[]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (start > cursor) segments.push({ text: text.slice(cursor, start), matched: false });
    if (end > start) {
      segments.push({ text: text.slice(start, end), matched: true, matchIndex: i });
      cursor = end;
    }
  });
  if (cursor < text.length) segments.push({ text: text.slice(cursor), matched: false });
  return segments;
}

function buildPythonSnippet(pattern: string, flags: Record<FlagKey, boolean>): string {
  const pyFlags: string[] = [];
  if (flags.i) pyFlags.push("re.IGNORECASE");
  if (flags.m) pyFlags.push("re.MULTILINE");
  if (flags.s) pyFlags.push("re.DOTALL");
  const flagsArg = pyFlags.length ? `, ${pyFlags.join(" | ")}` : "";
  return `import re\n\npattern = re.compile(r"""${pattern}"""${flagsArg})`;
}

export function RegexTesterClient({ dict }: RegexTesterClientProps) {
  const t = dict.regexTester;

  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });
  const [testString, setTestString] = useState("");
  const [replacement, setReplacement] = useState("");
  const [codeLang, setCodeLang] = useState<CodeLang>("js");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const flagsString = useMemo(() => FLAG_KEYS.filter((k) => flags[k]).join(""), [flags]);

  const parsed = useMemo(() => {
    if (!pattern) return { regex: null as RegExp | null, matches: [] as RegExpExecArray[], error: null as string | null };
    try {
      const regex = new RegExp(pattern, flagsString);
      const matches = flagsString.includes("g")
        ? Array.from(testString.matchAll(regex))
        : (() => {
            const m = regex.exec(testString);
            return m ? [m] : [];
          })();
      return { regex, matches, error: null };
    } catch (e) {
      return { regex: null, matches: [], error: (e as Error).message };
    }
  }, [pattern, flagsString, testString]);

  const segments = useMemo(() => buildSegments(testString, parsed.matches), [testString, parsed.matches]);

  const replacementResult = useMemo(() => {
    if (!pattern || !parsed.regex) return null;
    try {
      return testString.replace(parsed.regex, replacement);
    } catch {
      return null;
    }
  }, [pattern, parsed.regex, testString, replacement]);

  const jsSnippet = `/${pattern.replace(/\//g, "\\/")}/${flagsString}`;
  const pythonSnippet = buildPythonSnippet(pattern, flags);

  const toggleFlag = (key: FlagKey) => setFlags((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleClear = () => {
    setPattern("");
    setTestString("");
    setReplacement("");
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
  };

  const toggleClass = (active: boolean) =>
    active
      ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300";

  const flagLabel: Record<FlagKey, string> = {
    g: t.flagGlobal,
    i: t.flagIgnoreCase,
    m: t.flagMultiline,
    s: t.flagDotAll,
    u: t.flagUnicode,
  };

  const hasInput = pattern.trim().length > 0;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl shadow-sm border border-purple-200/50 dark:border-purple-700/30 flex-shrink-0">
                <Icon name="searchCode" className="h-7 w-7" />
              </div>
              {t.title}
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-3 ml-1 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Pattern & Flags */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-purple-500/15 focus-within:border-purple-500/30 transition-all duration-300">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
              {t.patternLabel}
            </label>
            <div className="flex items-center gap-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-500/20">
              <span className="pl-4 py-2.5 font-mono text-lg text-slate-300 dark:text-slate-600 select-none">/</span>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder={t.patternPlaceholder}
                spellCheck={false}
                className="flex-1 py-2.5 font-mono text-sm text-slate-800 dark:text-slate-100 outline-none bg-transparent min-w-0"
              />
              <span className="py-2.5 font-mono text-lg text-slate-300 dark:text-slate-600 select-none">/</span>
              <span className="pr-4 py-2.5 font-mono text-sm font-bold text-purple-500">{flagsString}</span>
            </div>
            {parsed.error && (
              <p className="mt-2 text-sm font-mono text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 rounded-xl px-4 py-2 inline-block">
                {t.invalidRegex}: {parsed.error}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t.flags}
            </span>
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
              {FLAG_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleFlag(k)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${toggleClass(flags[k])}`}
                >
                  {flagLabel[k]}
                </button>
              ))}
            </div>
            <div className="flex-grow" />
            <button
              type="button"
              onClick={handleClear}
              disabled={!pattern && !testString}
              className="flex items-center justify-center p-2.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
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

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
              {t.presets}
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.labelKey}
                  type="button"
                  onClick={() => setPattern(p.pattern)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-500 active:scale-95 transition-all cursor-pointer"
                >
                  {t[p.labelKey]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Test String + Highlighted Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[320px] items-stretch">
        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm h-[260px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center">
            <span>{t.testStringLabel}</span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {testString.length} {t.charCount}
            </span>
          </div>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder={t.testStringPlaceholder}
            spellCheck={false}
            className="flex-1 p-4 font-mono text-sm leading-relaxed bg-transparent text-slate-800 dark:text-slate-100 resize-none outline-none overflow-y-auto"
          />
        </div>

        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm h-[260px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center">
            <span>{t.matchesLabel}</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              {parsed.matches.length}
            </span>
          </div>
          <div className="flex-1 p-4 font-mono text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap break-words">
            {!testString ? (
              <span className="text-slate-400 dark:text-slate-500 font-sans">{t.emptyState}</span>
            ) : (
              segments.map((seg, i) =>
                seg.matched ? (
                  <mark
                    key={i}
                    className="rounded bg-purple-200/70 dark:bg-purple-500/30 text-purple-900 dark:text-purple-200"
                  >
                    {seg.text}
                  </mark>
                ) : (
                  <span key={i} className="text-slate-700 dark:text-slate-300">
                    {seg.text}
                  </span>
                ),
              )
            )}
          </div>
        </div>
      </div>

      {/* Match list */}
      {hasInput && testString && (
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 overflow-hidden shadow-sm">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400">
            {t.matchesLabel}
          </div>
          <div className="p-6">
            {parsed.matches.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{t.noMatches}</p>
            ) : (
              <div className="space-y-3">
                {parsed.matches.map((m, i) => {
                  const start = m.index ?? 0;
                  const end = start + m[0].length;
                  const namedGroups = m.groups ? Object.entries(m.groups) : [];
                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          {t.match} {i + 1}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500">
                          {start}:{end}
                        </span>
                      </div>
                      <p className="font-mono text-sm text-slate-800 dark:text-slate-100 break-all">{m[0]}</p>
                      {(m.length > 1 || namedGroups.length > 0) && (
                        <div className="mt-2 pl-3 border-l-2 border-purple-200 dark:border-purple-800/60 space-y-1">
                          {m.slice(1).map((g, gi) => (
                            <p key={gi} className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              {t.group} {gi + 1}: <span className="text-slate-700 dark:text-slate-200">{g ?? "—"}</span>
                            </p>
                          ))}
                          {namedGroups.map(([name, value]) => (
                            <p key={name} className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              {name}: <span className="text-slate-700 dark:text-slate-200">{value ?? "—"}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Replacement */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400">
          {t.replacementLabel}
        </div>
        <div className="p-6 space-y-4">
          <input
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder={t.replacementPlaceholder}
            spellCheck={false}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 font-mono text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20"
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t.resultLabel}
              </span>
              <button
                type="button"
                onClick={() => replacementResult && handleCopy("replacement", replacementResult)}
                disabled={!replacementResult}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-500 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {copiedKey === "replacement" ? t.copied : t.copy}
              </button>
            </div>
            <pre className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 p-4 font-mono text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words min-h-[3rem]">
              {replacementResult || <span className="text-slate-400 dark:text-slate-500">{t.resultEmpty}</span>}
            </pre>
          </div>
        </div>
      </section>

      {/* Code Snippet */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 dark:bg-slate-900/50 px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-xl">
            {(["js", "python"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setCodeLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${toggleClass(codeLang === lang)}`}
              >
                {lang === "js" ? "JavaScript" : "Python"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleCopy("snippet", codeLang === "js" ? jsSnippet : pythonSnippet)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-500 active:scale-95 cursor-pointer"
          >
            {copiedKey === "snippet" ? t.copied : t.copy}
          </button>
        </div>
        <pre className="p-4 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
          {codeLang === "js" ? jsSnippet : pythonSnippet}
        </pre>
      </section>

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
