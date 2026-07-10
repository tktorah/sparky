"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type UserAgentClientProps = {
  dict: Dictionary;
};

type DeviceType = "desktop" | "mobile" | "tablet" | "tv" | "bot" | "unknown";

type ParsedUA = {
  browser: { name: string; version: string | null } | null;
  os: { name: string; version: string | null } | null;
  engine: { name: string; version: string | null } | null;
  deviceType: DeviceType;
};

// ─── Detection helpers ───────────────────────────────────────────────────────

const BOT_REGEX =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|semrushbot|ahrefsbot|mj12bot|petalbot/i;

const BROWSER_PATTERNS: { regex: RegExp; name: string; engine: string }[] = [
  { regex: /Edg\/([\d.]+)/, name: "Microsoft Edge", engine: "Blink" },
  { regex: /EdgA\/([\d.]+)/, name: "Microsoft Edge", engine: "Blink" },
  { regex: /EdgiOS\/([\d.]+)/, name: "Microsoft Edge", engine: "WebKit" },
  { regex: /OPR\/([\d.]+)/, name: "Opera", engine: "Blink" },
  { regex: /Opera Mini\/([\d.]+)/, name: "Opera Mini", engine: "Presto" },
  { regex: /SamsungBrowser\/([\d.]+)/, name: "Samsung Internet", engine: "Blink" },
  { regex: /YaBrowser\/([\d.]+)/, name: "Yandex Browser", engine: "Blink" },
  { regex: /Vivaldi\/([\d.]+)/, name: "Vivaldi", engine: "Blink" },
  { regex: /FxiOS\/([\d.]+)/, name: "Firefox", engine: "WebKit" },
  { regex: /Firefox\/([\d.]+)/, name: "Firefox", engine: "Gecko" },
  { regex: /CriOS\/([\d.]+)/, name: "Chrome", engine: "WebKit" },
  { regex: /Chromium\/([\d.]+)/, name: "Chromium", engine: "Blink" },
  { regex: /Chrome\/([\d.]+)/, name: "Chrome", engine: "Blink" },
  { regex: /MSIE ([\d.]+)/, name: "Internet Explorer", engine: "Trident" },
  { regex: /Trident.*rv:([\d.]+)/, name: "Internet Explorer", engine: "Trident" },
  { regex: /Version\/([\d.]+).*Safari/, name: "Safari", engine: "WebKit" },
];

function detectBrowser(ua: string): { browser: ParsedUA["browser"]; engine: string | null } {
  for (const p of BROWSER_PATTERNS) {
    const m = ua.match(p.regex);
    if (m) return { browser: { name: p.name, version: m[1] }, engine: p.engine };
  }
  if (/Safari\//.test(ua)) return { browser: { name: "Safari", version: null }, engine: "WebKit" };
  return { browser: null, engine: null };
}

const OS_PATTERNS: { regex: RegExp; name: string; version: (m: RegExpMatchArray) => string | null }[] = [
  { regex: /Windows NT 10\.0/, name: "Windows", version: () => "10 / 11" },
  { regex: /Windows NT 6\.3/, name: "Windows", version: () => "8.1" },
  { regex: /Windows NT 6\.2/, name: "Windows", version: () => "8" },
  { regex: /Windows NT 6\.1/, name: "Windows", version: () => "7" },
  { regex: /Windows NT 6\.0/, name: "Windows", version: () => "Vista" },
  { regex: /Windows NT 5\.1/, name: "Windows", version: () => "XP" },
  { regex: /CrOS \S+ ([\d.]+)/, name: "ChromeOS", version: (m) => m[1] },
  { regex: /iPhone OS ([\d_]+)/, name: "iOS", version: (m) => m[1].replace(/_/g, ".") },
  { regex: /CPU OS ([\d_]+)/, name: "iPadOS", version: (m) => m[1].replace(/_/g, ".") },
  { regex: /Mac OS X ([\d_]+)/, name: "macOS", version: (m) => m[1].replace(/_/g, ".") },
  { regex: /Android ([\d.]+)/, name: "Android", version: (m) => m[1] },
  { regex: /Linux/, name: "Linux", version: () => null },
];

function detectOS(ua: string): ParsedUA["os"] {
  for (const p of OS_PATTERNS) {
    const m = ua.match(p.regex);
    if (m) return { name: p.name, version: p.version(m) };
  }
  return null;
}

function detectEngine(ua: string, browserEngine: string | null): ParsedUA["engine"] {
  if (browserEngine === "Blink" || browserEngine === "WebKit") {
    const m = ua.match(/AppleWebKit\/([\d.]+)/);
    return { name: browserEngine, version: m ? m[1] : null };
  }
  if (browserEngine === "Gecko") {
    const m = ua.match(/Gecko\/([\d.]+)/);
    return { name: "Gecko", version: m ? m[1] : null };
  }
  if (browserEngine === "Trident") {
    const m = ua.match(/Trident\/([\d.]+)/);
    return { name: "Trident", version: m ? m[1] : null };
  }
  if (browserEngine) return { name: browserEngine, version: null };

  if (/AppleWebKit\/([\d.]+)/.test(ua)) {
    const m = ua.match(/AppleWebKit\/([\d.]+)/);
    return { name: "WebKit", version: m ? m[1] : null };
  }
  if (/Gecko\/([\d.]+)/.test(ua)) {
    const m = ua.match(/Gecko\/([\d.]+)/);
    return { name: "Gecko", version: m ? m[1] : null };
  }
  if (/Trident\/([\d.]+)/.test(ua)) {
    const m = ua.match(/Trident\/([\d.]+)/);
    return { name: "Trident", version: m ? m[1] : null };
  }
  return null;
}

function detectDeviceType(ua: string, isBot: boolean): DeviceType {
  if (isBot) return "bot";
  if (/SmartTV|GoogleTV|AppleTV|HbbTV|NetCast|Tizen.*TV|Web0S/i.test(ua)) return "tv";
  if (/iPad/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) || /Tablet/.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

function parseUserAgent(ua: string): ParsedUA {
  const trimmed = ua.trim();
  if (!trimmed) return { browser: null, os: null, engine: null, deviceType: "unknown" };

  const isBot = BOT_REGEX.test(trimmed);
  const { browser, engine: browserEngine } = detectBrowser(trimmed);
  const os = detectOS(trimmed);
  const engine = detectEngine(trimmed, browserEngine);
  const deviceType = detectDeviceType(trimmed, isBot);

  return { browser, os, engine, deviceType };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UserAgentClient({ dict }: UserAgentClientProps) {
  const t = dict.userAgent;

  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setInput(navigator.userAgent), 0);
    return () => clearTimeout(id);
  }, []);

  const parsed = useMemo(() => parseUserAgent(input), [input]);
  const hasInput = input.trim().length > 0;

  const deviceLabel: Record<DeviceType, string> = {
    desktop: t.deviceDesktop,
    mobile: t.deviceMobile,
    tablet: t.deviceTablet,
    tv: t.deviceTv,
    bot: t.deviceBot,
    unknown: t.deviceUnknown,
  };

  const handleUseMyBrowser = () => setInput(navigator.userAgent);
  const handleClear = () => setInput("");
  const handleCopy = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl shadow-sm border border-fuchsia-200/50 dark:border-fuchsia-700/30 flex-shrink-0">
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

      {/* Input Area */}
      <div className="flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-fuchsia-500/15 focus-within:border-fuchsia-500/30 transition-all duration-300">
        <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 font-bold text-sm text-slate-600 dark:text-slate-400 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Icon name="fingerprint" className="text-fuchsia-500 h-4 w-4" />
            <span>{t.inputLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseMyBrowser}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:border-fuchsia-300 dark:hover:border-fuchsia-500 active:scale-95 cursor-pointer"
            >
              {t.useMyBrowser}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!input}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:border-fuchsia-300 dark:hover:border-fuchsia-500 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {copied ? t.copied : t.copy}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!input}
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

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.pastePlaceholder}
          spellCheck={false}
          rows={4}
          className="w-full p-4 font-mono text-sm leading-relaxed bg-transparent text-slate-800 dark:text-slate-100 resize-none outline-none"
        />
      </div>

      {/* Results */}
      {!hasInput ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-5 bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-3xl mb-4 border border-fuchsia-100 dark:border-fuchsia-800/30">
            <Icon name="fingerprint" className="h-10 w-10 text-fuchsia-400 dark:text-fuchsia-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">{t.emptyState}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ResultCard
            dotClass="bg-rose-500/10 border-rose-500/20"
            label={t.os}
            name={parsed.os?.name ?? t.unknown}
            version={parsed.os?.version ?? null}
            versionLabel={t.version}
          />
          <ResultCard
            dotClass="bg-violet-600/10 border-violet-600/20"
            label={t.browser}
            name={parsed.browser?.name ?? t.unknown}
            version={parsed.browser?.version ?? null}
            versionLabel={t.version}
          />
          <ResultCard
            dotClass="bg-sky-600/10 border-sky-600/20"
            label={t.device}
            name={deviceLabel[parsed.deviceType]}
            version={null}
            versionLabel={t.version}
          />
          <ResultCard
            dotClass="bg-emerald-600/10 border-emerald-600/20"
            label={t.engine}
            name={parsed.engine?.name ?? t.unknown}
            version={parsed.engine?.version ?? null}
            versionLabel={t.version}
          />
        </div>
      )}

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

function ResultCard({
  dotClass,
  label,
  name,
  version,
  versionLabel,
}: {
  dotClass: string;
  label: string;
  name: string;
  version: string | null;
  versionLabel: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm p-5">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dotClass} border`} />
        {label}
      </h3>
      <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 break-words">{name}</p>
      {version && (
        <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1.5">
          {versionLabel}: {version}
        </p>
      )}
    </div>
  );
}
