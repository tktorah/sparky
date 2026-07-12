"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type HtmlEntityClientProps = {
  dict: Dictionary;
};

type Mode = "encode" | "decode";
type EntityFormat = "named" | "decimal" | "hex";

const RESERVED_NAMES: Record<string, string> = {
  "&": "amp",
  "<": "lt",
  ">": "gt",
  '"': "quot",
  "'": "apos",
};

// A curated set of well-known named character references; anything else
// falls back to a numeric reference even in "named" mode.
const NAMED_ENTITIES: Record<string, string> = {
  " ": "nbsp",
  "¡": "iexcl",
  "¢": "cent",
  "£": "pound",
  "¥": "yen",
  "©": "copy",
  "®": "reg",
  "°": "deg",
  "±": "plusmn",
  "·": "middot",
  "¼": "frac14",
  "½": "frac12",
  "¾": "frac34",
  "¿": "iquest",
  "×": "times",
  "ß": "szlig",
  "à": "agrave",
  "â": "acirc",
  "ä": "auml",
  "ç": "ccedil",
  "è": "egrave",
  "é": "eacute",
  "ê": "ecirc",
  "ë": "euml",
  "ñ": "ntilde",
  "ô": "ocirc",
  "ö": "ouml",
  "÷": "divide",
  "û": "ucirc",
  "ü": "uuml",
  "–": "ndash",
  "—": "mdash",
  "‘": "lsquo",
  "’": "rsquo",
  "“": "ldquo",
  "”": "rdquo",
  "•": "bull",
  "…": "hellip",
  "€": "euro",
  "™": "trade",
};

const COMMON_ENTITIES = [" ", "<", ">", "&", '"', "©", "™", "€", "—", "…"];

function encodeChar(ch: string, format: EntityFormat): string {
  const code = ch.codePointAt(0) ?? ch.charCodeAt(0);
  if (format !== "named") {
    return format === "hex" ? `&#x${code.toString(16)};` : `&#${code};`;
  }
  const name = RESERVED_NAMES[ch] ?? NAMED_ENTITIES[ch];
  return name ? `&${name};` : `&#${code};`;
}

function encodeText(input: string, format: EntityFormat, encodeNonAscii: boolean): string {
  let result = "";
  for (const ch of Array.from(input)) {
    const code = ch.codePointAt(0) ?? ch.charCodeAt(0);
    if (RESERVED_NAMES[ch] || (encodeNonAscii && code > 127)) {
      result += encodeChar(ch, format);
    } else {
      result += ch;
    }
  }
  return result;
}

function decodeText(input: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
}

export function HtmlEntityClient({ dict }: HtmlEntityClientProps) {
  const t = dict.htmlEntity;

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [format, setFormat] = useState<EntityFormat>("named");
  const [encodeNonAscii, setEncodeNonAscii] = useState(false);
  const [inputCopied, setInputCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  const output = useMemo(() => {
    if (!input) return "";
    return mode === "encode" ? encodeText(input, format, encodeNonAscii) : decodeText(input);
  }, [input, mode, format, encodeNonAscii]);

  const handleClear = () => setInput("");

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
      ? "bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm"
      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300";

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-xl shadow-sm border border-green-200/50 dark:border-green-700/30 flex-shrink-0">
                <Icon name="code" className="h-7 w-7" />
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

        {mode === "encode" && (
          <>
            <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700/80 mx-1" />
            <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
              {(["named", "decimal", "hex"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${toggleClass(format === f)}`}
                >
                  {f === "named" ? t.formatNamed : f === "decimal" ? t.formatDecimal : t.formatHex}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={encodeNonAscii}
                onChange={(e) => setEncodeNonAscii(e.target.checked)}
                className="accent-green-600"
              />
              {t.encodeNonAscii}
            </label>
          </>
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

      {/* Common entities quick reference */}
      <div>
        <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
          {t.commonEntities}
        </span>
        <div className="flex flex-wrap gap-2">
          {COMMON_ENTITIES.map((ch) => {
            const entity = encodeChar(ch, "named");
            const insertValue = mode === "encode" ? ch : entity;
            return (
              <button
                key={ch}
                type="button"
                onClick={() => setInput((prev) => prev + insertValue)}
                className="px-3 py-1.5 text-xs font-mono font-bold rounded-xl border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-500 active:scale-95 transition-all cursor-pointer"
                title={entity}
              >
                {mode === "encode" ? ch : entity}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input / Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[420px] items-stretch">
        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-green-500/15 focus-within:border-green-500/30 transition-all duration-300 h-[300px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Icon name="file" className="text-green-500 h-4 w-4" />
              <span>{t.inputLabel}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyInput}
              disabled={!input}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-500 active:scale-95 disabled:opacity-50 cursor-pointer"
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

        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm h-[300px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Icon name="code" className="text-green-500 h-4 w-4" />
              <span>{t.outputLabel}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyOutput}
              disabled={!output}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {outputCopied ? t.copied : t.copy}
            </button>
          </div>
          <div className="flex-1 min-h-0 relative">
            {input.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium text-center px-6">
                {t.outputEmpty}
              </div>
            ) : (
              <pre className="h-full overflow-y-auto whitespace-pre-wrap break-words p-4 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {output}
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
