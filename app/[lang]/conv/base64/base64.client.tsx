"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type Base64ClientProps = {
  dict: Dictionary;
};

const URL_SAFE_REPLACEMENTS: [RegExp, string][] = [
  [/\+/g, "-"],
  [/\//g, "_"],
];

function normalizeBase64(value: string, urlSafe: boolean) {
  let normalized = value.replace(/\s+/g, "");
  if (urlSafe) {
    normalized = normalized.replace(/-/g, "+").replace(/_/g, "/");
  }
  const padding = normalized.length % 4;
  if (padding === 1) {
    return normalized;
  }
  if (padding > 0) {
    normalized = normalized.padEnd(normalized.length + (4 - padding), "=");
  }
  return normalized;
}

function isBase64String(value: string) {
  const normalized = value.replace(/\s+/g, "");
  return /^[A-Za-z0-9+/\-_]*={0,2}$/.test(normalized);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function encodeText(value: string, urlSafe: boolean, removePadding: boolean) {
  const bytes = new TextEncoder().encode(value);
  let base64 = bytesToBase64(bytes);
  if (urlSafe) {
    for (const [pattern, replacement] of URL_SAFE_REPLACEMENTS) {
      base64 = base64.replace(pattern, replacement);
    }
  }
  if (removePadding) {
    base64 = base64.replace(/=+$/, "");
  }
  return base64;
}

function decodeBase64(value: string, urlSafe: boolean, ignoreWhitespace: boolean) {
  const processed = ignoreWhitespace ? value.replace(/\s+/g, "") : value;
  if (!isBase64String(processed)) {
    throw new Error("invalid");
  }
  const normalized = normalizeBase64(processed, urlSafe);
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function formatStats(chars: number, bytes: number, t: Dictionary["base64"]) {
  return `${chars} ${t.chars}, ${bytes} ${t.bytes}`;
}

export function Base64Client({ dict }: Base64ClientProps) {
  const t = dict.base64;

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true);
  const [removePadding, setRemovePadding] = useState(false);

  const [inputCopied, setInputCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<number[]>([1]);

  const inputStats = useMemo(() => {
    const bytes = new TextEncoder().encode(input).length;
    return { chars: input.length, bytes };
  }, [input]);

  const outputStats = useMemo(() => {
    const bytes = new TextEncoder().encode(output).length;
    return { chars: output.length, bytes };
  }, [output]);

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
          setOutput(encodeText(input, urlSafe, removePadding));
          setError(null);
        } else {
          setOutput(decodeBase64(input, urlSafe, ignoreWhitespace));
          setError(null);
        }
      } catch {
        setOutput("");
        setError(t.invalidInput);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [input, mode, urlSafe, ignoreWhitespace, removePadding, t.invalidInput]);

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

  const toggleClass = (active: boolean) =>
    active
      ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm"
      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300";

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 rounded-xl shadow-sm border border-cyan-200/50 dark:border-cyan-700/30 flex-shrink-0">
                <Icon name="hash" className="h-7 w-7" />
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
          <label className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="accent-cyan-600"
            />
            {t.urlSafe}
          </label>
          {mode === "encode" ? (
            <label className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={removePadding}
                onChange={(e) => setRemovePadding(e.target.checked)}
                className="accent-cyan-600"
              />
              {t.removePadding}
            </label>
          ) : (
            <label className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                className="accent-cyan-600"
              />
              {t.ignoreWhitespace}
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
        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-cyan-500/15 focus-within:border-cyan-500/30 transition-all duration-300 h-[450px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center transition-colors">
            <div className="flex items-center gap-2 flex-wrap">
              <Icon name="file" className="text-cyan-500 h-4 w-4" />
              <span>{t.inputLabel}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                {formatStats(inputStats.chars, inputStats.bytes, t)}
              </span>
              {mode === "encode" && input.trim() && !error && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  {t.encode}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-500 active:scale-95 disabled:opacity-50 cursor-pointer"
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
              <Icon name="code" className="text-cyan-500 h-4 w-4" />
              <span>{t.outputLabel}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                {formatStats(outputStats.chars, outputStats.bytes, t)}
              </span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-500 active:scale-95 disabled:opacity-50 cursor-pointer"
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
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium">
                —
              </div>
            ) : (
              <pre className="h-full overflow-y-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {output}
              </pre>
            )}
          </div>
        </div>
      </div>

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
