"use client";

import { useState, useEffect, useRef } from "react";
import { jsonrepair } from "jsonrepair";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type JsonFormatterClientProps = {
  dict: Dictionary;
};

// --- Custom Subcomponents ---

// 1. Interactive Tree View Component
type TreeNodeProps = {
  label?: string;
  value: any;
  isLast?: boolean;
};

function TreeNode({ label, value, isLast = true }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);

  const toggle = () => setExpanded(!expanded);

  const renderKey = () => {
    if (label === undefined) return null;
    return (
      <span className="mr-1 font-semibold text-blue-600 dark:text-blue-400">
        {label}:
      </span>
    );
  };

  const renderComma = () =>
    !isLast ? <span className="text-slate-500">,</span> : null;

  if (value === null) {
    return (
      <div className="pl-4 font-mono text-sm leading-relaxed">
        {renderKey()}
        <span className="font-semibold text-slate-400 dark:text-slate-500">
          null
        </span>
        {renderComma()}
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className="pl-4 font-mono text-sm leading-relaxed">
          {renderKey()}
          <span className="text-slate-600 dark:text-slate-400">[]</span>
          {renderComma()}
        </div>
      );
    }

    return (
      <div className="pl-4 font-mono text-sm leading-relaxed">
        <div className="flex items-center">
          <button
            onClick={toggle}
            className="mr-1 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition focus:outline-none text-[10px]"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▼" : "▶"}
          </button>
          {renderKey()}
          <span className="text-slate-600 dark:text-slate-400">[</span>
          {!expanded && (
            <span className="mx-1 rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-xs text-slate-400 dark:text-slate-500">
              {value.length} item{value.length > 1 ? "s" : ""}
            </span>
          )}
          {!expanded && (
            <span className="text-slate-600 dark:text-slate-400">]</span>
          )}
          {!expanded && renderComma()}
        </div>
        {expanded && (
          <div className="ml-2 border-l border-slate-200 dark:border-slate-700 pl-2">
            {value.map((item, index) => (
              <TreeNode
                key={index}
                value={item}
                isLast={index === value.length - 1}
              />
            ))}
          </div>
        )}
        {expanded && (
          <div className="pl-3 text-slate-600 dark:text-slate-400">
            ]{renderComma()}
          </div>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return (
        <div className="pl-4 font-mono text-sm leading-relaxed">
          {renderKey()}
          <span className="text-slate-600 dark:text-slate-400">{"{}"}</span>
          {renderComma()}
        </div>
      );
    }

    return (
      <div className="pl-4 font-mono text-sm leading-relaxed">
        <div className="flex items-center">
          <button
            onClick={toggle}
            className="mr-1 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition focus:outline-none text-[10px]"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▼" : "▶"}
          </button>
          {renderKey()}
          <span className="text-slate-600 dark:text-slate-400">{"{"}</span>
          {!expanded && (
            <span className="mx-1 rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-xs text-slate-400 dark:text-slate-500">
              {keys.length} key{keys.length > 1 ? "s" : ""}
            </span>
          )}
          {!expanded && (
            <span className="text-slate-600 dark:text-slate-400">{"}"}</span>
          )}
          {!expanded && renderComma()}
        </div>
        {expanded && (
          <div className="ml-2 border-l border-slate-200 dark:border-slate-700 pl-2">
            {keys.map((key, index) => (
              <TreeNode
                key={key}
                label={key}
                value={value[key]}
                isLast={index === keys.length - 1}
              />
            ))}
          </div>
        )}
        {expanded && (
          <div className="pl-3 text-slate-600 dark:text-slate-400">
            {"}"}
            {renderComma()}
          </div>
        )}
      </div>
    );
  }

  if (typeof value === "string") {
    return (
      <div className="pl-4 font-mono text-sm leading-relaxed">
        {renderKey()}
        <span className="text-emerald-600 dark:text-emerald-400">{value}</span>
        {renderComma()}
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="pl-4 font-mono text-sm leading-relaxed">
        {renderKey()}
        <span className="text-amber-600 dark:text-amber-500">{value}</span>
        {renderComma()}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div className="pl-4 font-mono text-sm leading-relaxed">
        {renderKey()}
        <span className="font-medium text-violet-600 dark:text-violet-400">
          {value ? "true" : "false"}
        </span>
        {renderComma()}
      </div>
    );
  }

  return (
    <div className="pl-4 font-mono text-sm leading-relaxed">
      {renderKey()}
      <span className="text-slate-600 dark:text-slate-400">
        {String(value)}
      </span>
      {renderComma()}
    </div>
  );
}

function InteractiveTreeView({ data }: { data: any }) {
  return (
    <div className="h-full overflow-y-auto p-4 text-slate-800 dark:text-slate-200 select-none">
      <TreeNode value={data} isLast={true} />
    </div>
  );
}

// 2. Syntax-highlighted Code Component (Lightweight Colorizer)
function ColorizedJson({ jsonStr }: { jsonStr: string }) {
  const tokens: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex =
    /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|(-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)|(true|false)|(null)|([{}[\]:,]|\s+)/g;

  let match;
  let keyCounter = 0;
  while ((match = regex.exec(jsonStr)) !== null) {
    const [txt, strVal, colon, numVal, boolVal, nullVal] = match;

    if (match.index > lastIndex) {
      tokens.push(jsonStr.substring(lastIndex, match.index));
    }

    if (strVal !== undefined) {
      if (colon !== undefined) {
        tokens.push(
          <span
            key={keyCounter++}
            className="font-semibold text-blue-600 dark:text-blue-400"
          >
            {strVal}
          </span>,
        );
        tokens.push(colon);
      } else {
        tokens.push(
          <span
            key={keyCounter++}
            className="text-emerald-600 dark:text-emerald-400"
          >
            {strVal}
          </span>,
        );
      }
    } else if (numVal !== undefined) {
      tokens.push(
        <span key={keyCounter++} className="text-amber-600 dark:text-amber-500">
          {txt}
        </span>,
      );
    } else if (boolVal !== undefined) {
      tokens.push(
        <span
          key={keyCounter++}
          className="font-medium text-violet-600 dark:text-violet-400"
        >
          {txt}
        </span>,
      );
    } else if (nullVal !== undefined) {
      tokens.push(
        <span
          key={keyCounter++}
          className="font-semibold text-slate-400 dark:text-slate-500"
        >
          {txt}
        </span>,
      );
    } else {
      tokens.push(txt);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < jsonStr.length) {
    tokens.push(jsonStr.substring(lastIndex));
  }

  return (
    <pre className="h-full overflow-y-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200">
      {tokens}
    </pre>
  );
}

// --- Recursive generators for TS and Zod ---

function compileTypeScript(val: any, indent = ""): string {
  if (val === null) return "any";
  if (Array.isArray(val)) {
    if (val.length === 0) return "any[]";
    const types = Array.from(
      new Set(val.map((item) => compileTypeScript(item, indent))),
    );
    if (types.length === 1) return `${types[0]}[]`;
    return `(${types.join(" | ")})[]`;
  }
  if (typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length === 0) return "Record<string, any>";
    const lines = keys.map((k) => {
      const typeStr = compileTypeScript(val[k], indent + "  ");
      const cleanKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)
        ? k
        : JSON.stringify(k);
      return `${indent}  ${cleanKey}: ${typeStr};`;
    });
    return `{\n${lines.join("\n")}\n${indent}}`;
  }
  return typeof val;
}

function compileZod(val: any, indent = ""): string {
  if (val === null) return "z.any()";
  if (Array.isArray(val)) {
    if (val.length === 0) return "z.array(z.any())";
    const types = Array.from(
      new Set(val.map((item) => compileZod(item, indent))),
    );
    const elementSchema =
      types.length === 1 ? types[0] : `z.union([${types.join(", ")}])`;
    return `z.array(${elementSchema})`;
  }
  if (typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length === 0) return "z.record(z.any())";
    const lines = keys.map((k) => {
      const subSchema = compileZod(val[k], indent + "  ");
      const cleanKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)
        ? k
        : JSON.stringify(k);
      return `${indent}  ${cleanKey}: ${subSchema},`;
    });
    return `z.object({\n${lines.join("\n")}\n${indent}})`;
  }
  if (typeof val === "string") return "z.string()";
  if (typeof val === "number") return "z.number()";
  if (typeof val === "boolean") return "z.boolean()";
  return "z.any()";
}

function sortJsonKeys(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortJsonKeys);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result: any = {};
  for (const key of sortedKeys) {
    result[key] = sortJsonKeys(obj[key]);
  }
  return result;
}

// --- Main Client Component ---

export function JsonFormatterClient({ dict }: JsonFormatterClientProps) {
  const t = dict.jsonFormatter;

  // Editor states
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [outputTab, setOutputTab] = useState<
    "text" | "tree" | "typescript" | "zod"
  >("text");
  const [indentSize, setIndentSize] = useState<number>(2);

  // Copy states
  const [inputCopied, setInputCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  // Status/info messages
  const [infoMsg, setInfoMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Line numbering elements
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<number[]>([1]);

  // Update line counts on input change
  useEffect(() => {
    const lineCount = input.split("\n").length;
    setLines(Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1));
  }, [input]);

  // Live validator with 200ms debounce
  useEffect(() => {
    if (!input.trim()) {
      setIsValid(null);
      setError(null);
      return;
    }
    const timer = setTimeout(() => {
      try {
        JSON.parse(input);
        setIsValid(true);
        setError(null);
      } catch (e: any) {
        setIsValid(false);
        setError(e.message || "Invalid JSON");
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [input]);

  // Sync line scroll
  const handleScroll = () => {
    if (textareaRef.current && lineCountRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Actions
  const handleFormat = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setInput(formatted);
      setInfoMsg({ type: "success", text: t.validJson });
    } catch (e: any) {
      setInfoMsg({ type: "error", text: e.message || t.invalidJson });
    }
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setInput(minified);
      setInfoMsg({ type: "success", text: t.validJson });
    } catch (e: any) {
      setInfoMsg({ type: "error", text: e.message || t.invalidJson });
    }
  };

  const handleRepair = () => {
    if (!input.trim()) return;
    try {
      const repaired = jsonrepair(input);
      const parsed = JSON.parse(repaired);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setInput(formatted);
      setInfoMsg({ type: "success", text: t.repairedMsg });
    } catch (e: any) {
      setInfoMsg({ type: "error", text: `${t.repairFailMsg}: ${e.message}` });
    }
  };

  const handleSortKeys = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      const sorted = sortJsonKeys(parsed);
      const formatted = JSON.stringify(sorted, null, indentSize);
      setInput(formatted);
      setInfoMsg({ type: "success", text: t.validJson });
    } catch (e: any) {
      setInfoMsg({ type: "error", text: e.message || t.invalidJson });
    }
  };

  const handleClear = () => {
    setInput("");
    setIsValid(null);
    setError(null);
    setInfoMsg(null);
  };

  // Process Output Data
  const getOutputContent = (): {
    data: any;
    text: string;
    isError: boolean;
  } => {
    if (!input.trim()) {
      return { data: null, text: "", isError: false };
    }
    try {
      const parsed = JSON.parse(input);
      if (outputTab === "text") {
        return {
          data: parsed,
          text: JSON.stringify(parsed, null, indentSize),
          isError: false,
        };
      } else if (outputTab === "typescript") {
        return {
          data: parsed,
          text: `export interface RootObject ${compileTypeScript(parsed)}`,
          isError: false,
        };
      } else if (outputTab === "zod") {
        return {
          data: parsed,
          text: `import { z } from "zod";\n\nexport const rootSchema = ${compileZod(parsed)};`,
          isError: false,
        };
      }
      return { data: parsed, text: "", isError: false };
    } catch (e: any) {
      return { data: null, text: "", isError: true };
    }
  };

  const {
    data: parsedData,
    text: outputText,
    isError: outputError,
  } = getOutputContent();

  const handleCopyInput = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setInputCopied(true);
    setTimeout(() => setInputCopied(false), 2000);
  };

  const handleCopyOutput = () => {
    if (outputTab === "tree") {
      if (parsedData) {
        navigator.clipboard.writeText(
          JSON.stringify(parsedData, null, indentSize),
        );
        setOutputCopied(true);
        setTimeout(() => setOutputCopied(false), 2000);
      }
      return;
    }
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setOutputCopied(true);
    setTimeout(() => setOutputCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm border border-blue-200/50 dark:border-blue-700/30 flex-shrink-0">
                <Icon name="braces" className="h-7 w-7" />
              </div>
              {t.title}
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-3 ml-1 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Toolbar Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <button
            onClick={handleFormat}
            disabled={!input.trim()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-1 sm:py-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            {t.btnFormat}
          </button>
          <button
            onClick={handleMinify}
            disabled={!input.trim()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-1 sm:py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 active:scale-95 hover:border-slate-300 dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            {t.btnMinify}
          </button>
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700/80 mx-1"></div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
          <button
            onClick={handleRepair}
            disabled={!input.trim()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 active:scale-95 hover:border-slate-300 dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={t.btnRepair}
          >
            <span className="text-emerald-500">✨</span>
            <span>{t.btnRepair}</span>
          </button>
          <button
            onClick={handleSortKeys}
            disabled={!input.trim()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 active:scale-95 hover:border-slate-300 dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={t.btnSort}
          >
            <span>Sort AZ</span>
          </button>

          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700/80 mx-1"></div>
        </div>
        <div className="flex items-center gap-2 w-[60%] sm:w-auto overflow-hidden">
          <div className="flex-1 sm:flex-initial flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
            <button
              onClick={() => setIndentSize(2)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                indentSize === 2
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              2 Spaces
            </button>
            <button
              onClick={() => setIndentSize(4)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                indentSize === 4
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              4 Spaces
            </button>
          </div>

          <div className="flex-grow hidden sm:block"></div>
          <button
            onClick={handleClear}
            disabled={!input.trim()}
            className="flex items-center justify-center p-2.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            title={t.btnClear}
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

      {/* Editor Split Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[600px] items-stretch">
        {/* Left Side: Input Panel */}
        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:border-blue-500/30 transition-all duration-300 h-[450px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center transition-colors">
            <div className="flex items-center gap-2">
              <Icon name="file" className="text-blue-500 h-4 w-4" />
              <span>{t.input}</span>
              {isValid === true && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {t.validJson}
                </span>
              )}
              {isValid === false && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 animate-pulse">
                  {t.invalidJson}
                </span>
              )}
            </div>
            <button
              onClick={handleCopyInput}
              disabled={!input}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {inputCopied ? t.copied : t.copy}
            </button>
          </div>

          <div className="flex flex-1 min-h-0 relative">
            {/* Scrollable Line Numbers */}
            <div
              ref={lineCountRef}
              className="w-12 select-none overflow-y-hidden text-right pr-2 pt-4 pb-4 font-mono text-sm leading-relaxed text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 border-r border-slate-100 dark:border-slate-800/80"
            >
              {lines.map((ln) => (
                <div key={ln}>{ln}</div>
              ))}
            </div>

            {/* Textarea Input */}
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

        {/* Right Side: Output Panel */}
        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm h-[450px] md:h-full">
          {/* Header & Tabs */}
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-xl">
              <button
                onClick={() => setOutputTab("text")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  outputTab === "text"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {t.tabText}
              </button>
              <button
                onClick={() => setOutputTab("tree")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  outputTab === "tree"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {t.tabTree}
              </button>
              <button
                onClick={() => setOutputTab("typescript")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  outputTab === "typescript"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {t.tabTypeScript}
              </button>
              <button
                onClick={() => setOutputTab("zod")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  outputTab === "zod"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {t.tabZod}
              </button>
            </div>

            <button
              onClick={handleCopyOutput}
              disabled={
                (!outputText && outputTab !== "tree") ||
                (outputTab === "tree" && !parsedData)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {outputCopied ? t.copied : t.copy}
            </button>
          </div>

          {/* Tab Render Content */}
          <div className="flex-1 min-h-0 relative">
            {outputError ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-4">⚠️</span>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-2">
                  {t.invalidJson}
                </h3>
                {error && (
                  <p className="text-sm font-mono text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 rounded-xl px-4 py-2 max-w-md break-words">
                    {error}
                  </p>
                )}
              </div>
            ) : !input.trim() ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium">
                Empty output
              </div>
            ) : outputTab === "tree" ? (
              parsedData ? (
                <InteractiveTreeView data={parsedData} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                  No data to display in tree
                </div>
              )
            ) : outputTab === "text" ? (
              <ColorizedJson jsonStr={outputText} />
            ) : (
              <pre className="h-full overflow-y-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 bg-transparent">
                {outputText}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Error / Alert banner notifications */}
      {infoMsg && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
            infoMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/30 text-red-800 dark:text-red-400"
          }`}
        >
          <span className="text-lg">
            {infoMsg.type === "success" ? "✅" : "❌"}
          </span>
          <p className="text-sm font-semibold">{infoMsg.text}</p>
          <button
            onClick={() => setInfoMsg(null)}
            className="ml-auto text-xs font-bold hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
