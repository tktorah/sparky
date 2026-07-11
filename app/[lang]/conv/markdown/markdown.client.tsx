"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type MarkdownClientProps = {
  dict: Dictionary;
};

const STORAGE_KEY = "sparky-markdown-draft";
const WORDS_PER_MINUTE = 200;

function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function estimateReadMinutes(words: number) {
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

const previewClassName = [
  "markdown-preview text-[15px] leading-7 text-slate-800 dark:text-slate-200",
  "[&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:mt-2 [&_h1]:mb-4 [&_h1]:tracking-tight",
  "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3",
  "[&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2",
  "[&_p]:my-4",
  "[&_a]:text-violet-600 [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-violet-400",
  "[&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100",
  "[&_em]:italic",
  "[&_del]:line-through [&_del]:text-slate-500",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1",
  "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1",
  "[&_li]:leading-7",
  "[&_li_input]:mr-2 [&_li_input]:accent-violet-600",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-violet-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 dark:[&_blockquote]:border-violet-700 dark:[&_blockquote]:text-slate-400",
  "[&_hr]:my-8 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-700",
  "[&_code]:font-mono [&_code]:text-[13px]",
  "[&_p_code]:rounded-md [&_p_code]:bg-violet-100 [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:text-violet-800 dark:[&_p_code]:bg-violet-950/50 dark:[&_p_code]:text-violet-300",
  "[&_li_code]:rounded-md [&_li_code]:bg-violet-100 [&_li_code]:px-1.5 [&_li_code]:py-0.5 dark:[&_li_code]:bg-violet-950/50",
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-slate-100",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
  "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold dark:[&_th]:border-slate-700 dark:[&_th]:bg-slate-900/60",
  "[&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-slate-700",
].join(" ");

export function MarkdownClient({ dict }: MarkdownClientProps) {
  const t = dict.markdown;

  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<number[]>([1]);

  useEffect(() => {
    setInput(t.defaultContent);
    setHydrated(true);
  }, [t.defaultContent]);

  useEffect(() => {
    if (!hydrated) return;
  }, [input, hydrated]);

  useEffect(() => {
    const lineCount = input.split("\n").length;
    setLines(Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1));
  }, [input]);

  const stats = useMemo(() => {
    const words = countWords(input);
    return {
      words,
      chars: input.length,
      readMinutes: estimateReadMinutes(words),
    };
  }, [input]);

  const handleScroll = () => {
    if (textareaRef.current && lineCountRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleClear = () => {
    setInput("");
  };

  const handleLoadSample = () => {
    setInput(t.defaultContent);
  };

  const handleCopy = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-xl shadow-sm border border-violet-200/50 dark:border-violet-700/30 flex-shrink-0">
                <Icon name="type" className="h-7 w-7" />
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
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80">
            {stats.words} {t.words}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80">
            {stats.chars} {t.chars}
          </span>
          {stats.words > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80">
              {stats.readMinutes} {t.readTime}
            </span>
          )}
        </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[600px] items-stretch">
        <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-violet-500/15 focus-within:border-violet-500/30 transition-all duration-300 h-[450px] md:h-full">
          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center transition-colors">
            <div className="flex items-center gap-2">
              <Icon name="file" className="text-violet-500 h-4 w-4" />
              <span>{t.editorLabel}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!input}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {copied ? t.copied : t.copy}
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
              <Icon name="type" className="text-violet-500 h-4 w-4" />
              <span>{t.previewLabel}</span>
              {input.trim() && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  GFM
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">
              <span>{stats.words} {t.words}</span>
              <span>·</span>
              <span>{stats.chars} {t.chars}</span>
              {stats.words > 0 && (
                <>
                  <span>·</span>
                  <span>{stats.readMinutes} {t.readTime}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {!input.trim() ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium text-center px-6">
                {t.previewEmpty}
              </div>
            ) : (
              <div className={`p-6 ${previewClassName}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {input}
                </ReactMarkdown>
              </div>
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
