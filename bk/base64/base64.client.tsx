"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

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
  return /^[A-Za-z0-9+/]*={0,2}$/.test(normalized);
}

function encodeText(value: string, urlSafe: boolean) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  let base64 = btoa(String.fromCharCode(...bytes));
  if (urlSafe) {
    for (const [pattern, replacement] of URL_SAFE_REPLACEMENTS) {
      base64 = base64.replace(pattern, replacement);
    }
  }
  return base64;
}

function decodeBase64(value: string, urlSafe: boolean) {
  const normalized = normalizeBase64(value, urlSafe);
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

type Base64ConverterProps = {
  dict: Dictionary;
};

export function Base64Converter({ dict }: Base64ConverterProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true);
  const [removePadding, setRemovePadding] = useState(false);
  const base64 = dict.base64;

  const stats = useMemo(() => {
    const normalizedInput = ignoreWhitespace ? input.replace(/\s+/g, "") : input;
    return {
      inputChars: input.length,
      inputBytes: new TextEncoder().encode(input).length,
      outputChars: output.length,
      outputBytes: new TextEncoder().encode(output).length,
      sanitizedInput: normalizedInput,
    };
  }, [input, output, ignoreWhitespace]);

  const handleProcess = () => {
    setError(null);
    try {
      if (mode === "encode") {
        let result = encodeText(input, urlSafe);
        if (removePadding) {
          result = result.replace(/=+$/, "");
        }
        setOutput(result);
      } else {
        const processedInput = ignoreWhitespace ? input.replace(/\s+/g, "") : input;
        if (!isBase64String(processedInput)) {
          throw new Error(base64.invalidInput);
        }
        setOutput(decodeBase64(processedInput, urlSafe));
      }
    } catch (e) {
      setOutput("");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      // no-op
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
  };

  const setModeAndReset = (newMode: "encode" | "decode") => {
    setMode(newMode);
    setError(null);
    setOutput("");
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <header className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300 shadow-sm border border-cyan-200/70 dark:border-cyan-500/30">
                <Icon name="hash" className="h-6 w-6" />
              </span>
              {base64.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              {base64.subtitle}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-[0_15px_40px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/70">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setModeAndReset("encode")}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    mode === "encode"
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
                  ].join(" ")}
                >
                  {base64.encode}
                </button>
                <button
                  type="button"
                  onClick={() => setModeAndReset("decode")}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    mode === "decode"
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
                  ].join(" ")}
                >
                  {base64.decode}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleProcess}
                  className="rounded-3xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                >
                  {mode === "encode" ? base64.encode : base64.decode}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {base64.clear}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {base64.copy}
                </button>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr] mt-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {base64.inputLabel}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                    {mode === "encode" ? base64.encode : base64.decode}
                  </span>
                </div>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={base64.pastePlaceholder}
                  spellCheck={false}
                  className="min-h-[260px] w-full rounded-[2rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
                />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {base64.outputLabel}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                    {base64.outputStats}
                  </span>
                </div>
                <textarea
                  value={output}
                  readOnly
                  spellCheck={false}
                  className="min-h-[260px] w-full rounded-[2rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>{base64.inputStats}</span>
                <span>{stats.inputChars} {base64.chars}, {stats.inputBytes} {base64.bytes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{base64.outputStats}</span>
                <span>{stats.outputChars} {base64.chars}, {stats.outputBytes} {base64.bytes}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={urlSafe}
                  onChange={(event) => setUrlSafe(event.target.checked)}
                />
                {base64.urlSafe}
              </label>
              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={ignoreWhitespace}
                  onChange={(event) => setIgnoreWhitespace(event.target.checked)}
                />
                {base64.ignoreWhitespace}
              </label>
              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={removePadding}
                  onChange={(event) => setRemovePadding(event.target.checked)}
                />
                {base64.removePadding}
              </label>
            </div>

            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/70">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {base64.help.description1}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/70">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {base64.help.description2}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {base64.help.description3}
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/75">
          <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-500 text-white">
              <Icon name="hash" className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300">
                {base64.title}
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                {base64.subtitle}
              </h2>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <p>{base64.help.description1}</p>
            <ul className="space-y-3 pl-5 text-slate-700 dark:text-slate-200">
              <li>• {base64.help.description2}</li>
              <li>• {"Handles padding automatically and tolerates soft whitespace."}</li>
              <li>• {"Preserves UTF-8 correctly so emoji and Japanese text remain intact."}</li>
              <li>• {"100% client-side processing for privacy and speed."}</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
