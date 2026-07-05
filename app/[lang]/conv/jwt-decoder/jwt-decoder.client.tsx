"use client";

import { useState, useCallback } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type JwtDecoderClientProps = {
  dict: Dictionary;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function base64UrlDecode(str: string): string {
  // Pad the string to a multiple of 4
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padCount = (4 - (padded.length % 4)) % 4;
  const paddedStr = padded + "=".repeat(padCount);
  try {
    return decodeURIComponent(
      atob(paddedStr)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
  } catch {
    return atob(paddedStr);
  }
}

function parseJwt(token: string): {
  header: any;
  payload: any;
  signature: string;
  raw: [string, string, string];
} | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { header, payload, signature: parts[2], raw: [parts[0], parts[1], parts[2]] };
  } catch {
    return null;
  }
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

// ─── JSON Colorizer (reused pattern) ────────────────────────────────────────

function ColorizedJson({ jsonStr }: { jsonStr: string }) {
  const tokens: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex =
    /(\"(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*\")(\s*:)?|(-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)|(true|false)|(null)|([{}[\]:,]|\s+)/g;

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
          <span key={keyCounter++} className="font-semibold text-blue-600 dark:text-blue-400">
            {strVal}
          </span>,
        );
        tokens.push(colon);
      } else {
        tokens.push(
          <span key={keyCounter++} className="text-emerald-600 dark:text-emerald-400">
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
        <span key={keyCounter++} className="font-medium text-violet-600 dark:text-violet-400">
          {txt}
        </span>,
      );
    } else if (nullVal !== undefined) {
      tokens.push(
        <span key={keyCounter++} className="font-semibold text-slate-400 dark:text-slate-500">
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

// ─── Segment Badge ───────────────────────────────────────────────────────────

const SEGMENT_COLORS = [
  "text-rose-500 dark:text-rose-400",
  "text-violet-600 dark:text-violet-400",
  "text-sky-600 dark:text-sky-400",
] as const;

const SEGMENT_BG = [
  "bg-rose-500/10 border-rose-500/20",
  "bg-violet-600/10 border-violet-600/20",
  "bg-sky-600/10 border-sky-600/20",
] as const;

// ─── Sample JWT (signed with "secret") ──────────────────────────────────────

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

// ─── Main Component ──────────────────────────────────────────────────────────

export function JwtDecoderClient({ dict }: JwtDecoderClientProps) {
  const t = dict.jwtDecoder;

  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"header" | "payload" | "signature">("payload");
  const [copied, setCopied] = useState<"header" | "payload" | "signature" | null>(null);
  const [inputCopied, setInputCopied] = useState(false);

  const parsed = input.trim() ? parseJwt(input.trim()) : null;
  const isInvalid = input.trim().length > 0 && parsed === null;

  const handleCopy = useCallback((text: string, tab: "header" | "payload" | "signature") => {
    navigator.clipboard.writeText(text);
    setCopied(tab);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleCopyInput = useCallback(() => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setInputCopied(true);
    setTimeout(() => setInputCopied(false), 2000);
  }, [input]);

  const handleClear = () => {
    setInput("");
  };

  const handleLoadSample = () => {
    setInput(SAMPLE_JWT);
    setActiveTab("payload");
  };

  // Expiry / validity helpers
  const now = Math.floor(Date.now() / 1000);
  const exp: number | undefined = parsed?.payload?.exp;
  const iat: number | undefined = parsed?.payload?.iat;
  const nbf: number | undefined = parsed?.payload?.nbf;
  const isExpired = exp !== undefined && exp < now;

  // Which JSON to copy per tab
  const tabCopyText =
    parsed
      ? activeTab === "header"
        ? JSON.stringify(parsed.header, null, 2)
        : activeTab === "payload"
          ? JSON.stringify(parsed.payload, null, 2)
          : parsed.signature
      : "";

  // Color the raw JWT token segments
  const renderColoredToken = () => {
    if (!parsed) return null;
    const { raw } = parsed;
    return (
      <div className="flex flex-wrap gap-0 font-mono text-sm leading-relaxed break-all">
        <span className={SEGMENT_COLORS[0]}>{raw[0]}</span>
        <span className="text-slate-400 dark:text-slate-500">.</span>
        <span className={SEGMENT_COLORS[1]}>{raw[1]}</span>
        <span className="text-slate-400 dark:text-slate-500">.</span>
        <span className={SEGMENT_COLORS[2]}>{raw[2]}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 rounded-xl shadow-sm border border-yellow-200/50 dark:border-yellow-700/30 flex-shrink-0">
                <Icon name="key" className="h-7 w-7" />
              </div>
              {t.title}
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-3 ml-1 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Input Area */}
      <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-yellow-500/15 focus-within:border-yellow-500/30 transition-all duration-300">
        {/* Input header bar */}
        <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon name="key" className="text-yellow-500 h-4 w-4" />
            <span>{t.inputLabel}</span>
            {parsed && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {isExpired ? t.expired : t.valid}
              </span>
            )}
            {isInvalid && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 animate-pulse">
                {t.invalidToken}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-300 dark:hover:border-yellow-500 active:scale-95 cursor-pointer"
            >
              {t.loadSample}
            </button>
            <button
              onClick={handleCopyInput}
              disabled={!input}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-300 dark:hover:border-yellow-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {inputCopied ? t.copied : t.copy}
            </button>
            <button
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

        {/* Textarea */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.pastePlaceholder}
          spellCheck={false}
          rows={4}
          className="w-full p-4 font-mono text-sm leading-relaxed bg-transparent text-slate-800 dark:text-slate-100 resize-none outline-none"
        />

        {/* Colored segments preview */}
        {parsed && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/30">
            {renderColoredToken()}
          </div>
        )}
      </div>

      {/* Decoded Output */}
      {!parsed && !isInvalid && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-5 bg-yellow-50 dark:bg-yellow-900/20 rounded-3xl mb-4 border border-yellow-100 dark:border-yellow-800/30">
            <Icon name="key" className="h-10 w-10 text-yellow-400 dark:text-yellow-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
            {t.emptyState}
          </p>
        </div>
      )}

      {isInvalid && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">⚠️</span>
          <p className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-1">{t.invalidToken}</p>
          <p className="text-sm text-slate-400">Make sure the token has 3 dot-separated parts.</p>
        </div>
      )}

      {parsed && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Decoded panel */}
          <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm h-[500px]">
            {/* Tabs */}
            <div className="bg-slate-50/50 dark:bg-slate-900/50 px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-xl">
                {(["header", "payload", "signature"] as const).map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTab === tab
                        ? `bg-white dark:bg-slate-800 shadow-sm ${SEGMENT_COLORS[i]}`
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab === "header" ? t.tabHeader : tab === "payload" ? t.tabPayload : t.tabSignature}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleCopy(tabCopyText, activeTab)}
                disabled={!tabCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-300 dark:hover:border-yellow-500 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {copied === activeTab ? t.copied : t.copy}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 relative">
              {activeTab === "header" && (
                <ColorizedJson jsonStr={JSON.stringify(parsed.header, null, 2)} />
              )}
              {activeTab === "payload" && (
                <ColorizedJson jsonStr={JSON.stringify(parsed.payload, null, 2)} />
              )}
              {activeTab === "signature" && (
                <div className="h-full flex flex-col p-4 gap-4">
                  <div className="flex-1 flex flex-col">
                    <pre className="flex-1 overflow-y-auto font-mono text-sm leading-relaxed text-sky-600 dark:text-sky-400 break-all whitespace-pre-wrap">
                      {parsed.signature}
                    </pre>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 rounded-2xl">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠️</span>
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                      {t.signatureNote}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Token Info */}
          <div className="flex flex-col gap-4">
            {/* Header info card */}
            <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm p-5">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${SEGMENT_BG[0]} border`} />
                {t.tabHeader}
              </h3>
              <div className="space-y-3">
                {parsed.header.alg && (
                  <InfoRow label={t.algorithm} value={parsed.header.alg} accent="text-rose-600 dark:text-rose-400" />
                )}
                {parsed.header.typ && (
                  <InfoRow label={t.tokenType} value={parsed.header.typ} accent="text-rose-600 dark:text-rose-400" />
                )}
              </div>
            </div>

            {/* Payload claims card */}
            <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm p-5">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${SEGMENT_BG[1]} border`} />
                {t.tokenInfo}
              </h3>
              <div className="space-y-3">
                {parsed.payload.sub !== undefined && (
                  <InfoRow label={t.subject} value={String(parsed.payload.sub)} />
                )}
                {parsed.payload.iss !== undefined && (
                  <InfoRow label={t.issuer} value={String(parsed.payload.iss)} />
                )}
                {parsed.payload.aud !== undefined && (
                  <InfoRow
                    label={t.audience}
                    value={Array.isArray(parsed.payload.aud) ? parsed.payload.aud.join(", ") : String(parsed.payload.aud)}
                  />
                )}
                {iat !== undefined && (
                  <InfoRow label={t.issuedAt} value={formatTimestamp(iat)} mono />
                )}
                {exp !== undefined && (
                  <InfoRow
                    label={t.expiresAt}
                    value={formatTimestamp(exp)}
                    accent={isExpired ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}
                    badge={isExpired ? t.expired : t.valid}
                    badgeAccent={isExpired ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"}
                    mono
                  />
                )}
                {nbf !== undefined && (
                  <InfoRow label={t.notBefore} value={formatTimestamp(nbf)} mono />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── InfoRow helper ──────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  accent,
  badge,
  badgeAccent,
  mono,
}: {
  label: string;
  value: string;
  accent?: string;
  badge?: string;
  badgeAccent?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-sm font-semibold break-all ${accent ?? "text-slate-700 dark:text-slate-200"} ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
        {badge && (
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full border ${badgeAccent}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
