"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type UrlEncoderClientProps = {
  dict: Dictionary;
};

type EncodeScope = "component" | "fullUrl";

function tryParseUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed) || trimmed.startsWith("//")) {
      try {
        return new URL(trimmed.startsWith("//") ? `https:${trimmed}` : `https://${trimmed}`);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function encodeValue(
  value: string,
  scope: EncodeScope,
) {
  return scope === "fullUrl" ? encodeURI(value) : encodeURIComponent(value);
}

function decodeValue(value: string, plusAsSpace: boolean) {
  const prepared = plusAsSpace ? value.replace(/\+/g, " ") : value;
  return decodeURIComponent(prepared);
}

function rebuildUrlFromParts(
  protocol: string,
  host: string,
  pathname: string,
  params: { key: string; value: string }[],
) {
  const origin = `${protocol}//${host}`;
  const url = new URL(pathname || "/", origin);
  url.search = "";
  for (const { key, value } of params) {
    if (key) {
      url.searchParams.append(key, value);
    }
  }
  return url.toString();
}

export function UrlEncoderClient({ dict }: UrlEncoderClientProps) {
  const t = dict.urlEncoder;

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [encodeScope, setEncodeScope] = useState<EncodeScope>("component");
  const [plusAsSpace, setPlusAsSpace] = useState(false);

  const [inputCopied, setInputCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<number[]>([1]);

  const parsedUrl = useMemo(() => tryParseUrl(input), [input]);

  const queryParams = useMemo(() => {
    if (!parsedUrl) return [];
    return Array.from(parsedUrl.searchParams.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  }, [parsedUrl]);

  useEffect(() => {
    const lineCount = input.split("\n").length;
    setLines(Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1));
  }, [input]);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      try {
        if (mode === "encode") {
          setOutput(encodeValue(input, encodeScope));
          setError(null);
        } else {
          setOutput(decodeValue(input, plusAsSpace));
          setError(null);
        }
      } catch {
        setOutput("");
        setError(t.invalidInput);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [input, mode, encodeScope, plusAsSpace, t.invalidInput]);

  const handleScroll = () => {
    if (textareaRef.current && lineCountRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
  };

  const handleCopyInput = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setInputCopied(true);
    setTimeout(() => setInputCopied(false), 2000);
  };

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setOutputCopied(true);
    setTimeout(() => setOutputCopied(false), 2000);
  };

  const updateQueryParams = (nextParams: { key: string; value: string }[]) => {
    if (!parsedUrl) return;
    setInput(
      rebuildUrlFromParts(
        parsedUrl.protocol,
        parsedUrl.host,
        parsedUrl.pathname,
        nextParams,
      ),
    );
  };

  const handleParamChange = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const next = queryParams.map((param, i) =>
      i === index ? { ...param, [field]: value } : param,
    );
    updateQueryParams(next);
  };

  const handleAddParam = () => {
    updateQueryParams([...queryParams, { key: "", value: "" }]);
  };

  const handleRemoveParam = (index: number) => {
    updateQueryParams(queryParams.filter((_, i) => i !== index));
  };

  const toggleClass = (active: boolean) =>
    active
      ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm"
      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300";

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-xl shadow-sm border border-teal-200/50 dark:border-teal-700/30 flex-shrink-0">
                <Icon name="link" className="h-7 w-7" />
              </div>
              {t.title}
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-3 ml-1 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("encode")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${toggleClass(mode === "encode")}`}
          >
            {t.encode}
          </button>
          <button
            type="button"
            onClick={() => setMode("decode")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${toggleClass(mode === "decode")}`}
          >
            {t.decode}
          </button>
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700/80 mx-1" />

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {mode === "encode" ? (
            <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setEncodeScope("component")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${toggleClass(encodeScope === "component")}`}
              >
                {t.componentMode}
              </button>
              <button
                type="button"
                onClick={() => setEncodeScope("fullUrl")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${toggleClass(encodeScope === "fullUrl")}`}
              >
                {t.fullUrlMode}
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={plusAsSpace}
                onChange={(e) => setPlusAsSpace(e.target.checked)}
                className="accent-teal-600"
              />
              {t.plusAsSpace}
            </label>
          )}

          <div className="flex-grow hidden sm:block" />

          <button
            type="button"
            onClick={handleClear}
            disabled={!input.trim()}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[600px] items-stretch">
        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-teal-500/15 focus-within:border-teal-500/30 transition-all duration-300 h-[450px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center transition-colors">
            <div className="flex items-center gap-2 flex-wrap">
              <Icon name="file" className="text-teal-500 h-4 w-4" />
              <span>{t.inputLabel}</span>
              {parsedUrl && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  URL
                </span>
              )}
              {mode === "decode" && error && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 animate-pulse">
                  {t.invalidInput}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopyInput}
              disabled={!input}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {inputCopied ? t.copied : t.copy}
            </button>
          </div>

          <div className="flex flex-1 min-h-0 relative">
            <div
              ref={lineCountRef}
              className="w-12 select-none overflow-y-hidden text-right pr-2 pt-4 pb-4 font-mono text-sm leading-relaxed text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 border-r border-slate-100 dark:border-slate-800/80"
            >
              {lines.map((ln) => (
                <div key={ln}>{ln}</div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onScroll={handleScroll}
              placeholder={t.pastePlaceholder}
              spellCheck={false}
              className="flex-1 p-4 font-mono text-sm leading-relaxed bg-transparent text-slate-800 dark:text-slate-100 resize-none outline-none overflow-y-auto"
            />
          </div>
        </div>

        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm h-[450px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center transition-colors">
            <div className="flex items-center gap-2 flex-wrap">
              <Icon name="code" className="text-teal-500 h-4 w-4" />
              <span>{t.outputLabel}</span>
              {output && !error && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {mode === "encode" ? t.encode : t.decode}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopyOutput}
              disabled={!output}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {outputCopied ? t.copied : t.copy}
            </button>
          </div>

          <div className="flex-1 min-h-0 relative">
            {error ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-4">⚠️</span>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-2">
                  {t.invalidInput}
                </h3>
                <p className="text-sm font-mono text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 rounded-xl px-4 py-2 max-w-md break-words">
                  {error}
                </p>
              </div>
            ) : !input.trim() ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium text-center px-6">
                {t.outputEmpty}
              </div>
            ) : (
              <pre className="h-full overflow-y-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {output}
              </pre>
            )}
          </div>
        </div>
      </div>

      {parsedUrl && (
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 overflow-hidden shadow-sm">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-600 dark:text-slate-400">
              <Icon name="link" className="text-teal-500 h-4 w-4" />
              {t.urlBreakdown}
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
              {t.queryParams}: {queryParams.length}
            </span>
          </div>

          <div className="p-6 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                {t.protocol}
              </label>
              <input
                readOnly
                value={parsedUrl.protocol}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                {t.host}
              </label>
              <input
                readOnly
                value={parsedUrl.host}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                {t.path}
              </label>
              <input
                readOnly
                value={parsedUrl.pathname}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t.queryParams}
              </span>
              <button
                type="button"
                onClick={handleAddParam}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition cursor-pointer"
              >
                {t.addParam}
              </button>
            </div>

            {queryParams.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium py-2">
                —
              </p>
            ) : (
              <div className="space-y-2">
                {queryParams.map((param, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      value={param.key}
                      onChange={(e) =>
                        handleParamChange(index, "key", e.target.value)
                      }
                      placeholder={t.paramKey}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-500/20"
                    />
                    <span className="text-slate-400 font-bold">=</span>
                    <input
                      value={param.value}
                      onChange={(e) =>
                        handleParamChange(index, "value", e.target.value)
                      }
                      placeholder={t.paramValue}
                      className="flex-[2] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveParam(index)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                      aria-label={t.clear}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t.help.description1}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t.help.description2}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
            {t.help.description3}
          </p>
        </div>
      </div>
    </div>
  );
}
