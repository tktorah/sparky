"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type EpochConverterClientProps = {
  dict: Dictionary;
};

type Unit = "auto" | "s" | "ms";
type Timezone = "local" | "utc";

type ParsedTimestamp =
  | { kind: "empty" }
  | { kind: "error" }
  | { kind: "ok"; date: Date; effectiveUnit: "s" | "ms" };

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

const RELATIVE_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

function parseTimestampInput(raw: string, unit: Unit): ParsedTimestamp {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "empty" };
  if (!/^-?\d+$/.test(trimmed)) return { kind: "error" };

  const digits = trimmed.replace("-", "").length;
  const effectiveUnit: "s" | "ms" = unit === "auto" ? (digits > 10 ? "ms" : "s") : unit;
  const num = Number(trimmed);
  const ms = effectiveUnit === "s" ? num * 1000 : num;
  const date = new Date(ms);

  if (Number.isNaN(date.getTime())) return { kind: "error" };
  return { kind: "ok", date, effectiveUnit };
}

function formatRelative(target: Date, reference: Date): string {
  let duration = (target.getTime() - reference.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return rtf.format(Math.round(duration), "year");
}

function dateFieldsFromDate(date: Date, tz: Timezone) {
  return tz === "utc"
    ? {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds(),
      }
    : {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
      };
}

export function EpochConverterClient({ dict }: EpochConverterClientProps) {
  const t = dict.epochConverter;

  // Live clock
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const timeoutId = setTimeout(tick, 0);
    const intervalId = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  // Timestamp -> Date
  const [timestampInput, setTimestampInput] = useState("");
  const [unit, setUnit] = useState<Unit>("auto");
  const parsedTs = useMemo(() => parseTimestampInput(timestampInput, unit), [timestampInput, unit]);

  // Date -> Timestamp
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [second, setSecond] = useState("");
  const [timezone, setTimezone] = useState<Timezone>("local");
  const initializedRef = useRef(false);

  useEffect(() => {
    if (now && !initializedRef.current) {
      initializedRef.current = true;
      const fields = dateFieldsFromDate(now, "local");
      setYear(String(fields.year));
      setMonth(String(fields.month));
      setDay(String(fields.day));
      setHour(String(fields.hour));
      setMinute(String(fields.minute));
      setSecond(String(fields.second));
    }
  }, [now]);

  const composedDate = useMemo(() => {
    if (!year || !month || !day || !hour || !minute || !second) return null;
    const y = Number(year);
    const mo = Number(month);
    const d = Number(day);
    const h = Number(hour);
    const mi = Number(minute);
    const s = Number(second);
    if ([y, mo, d, h, mi, s].some((v) => Number.isNaN(v))) return null;

    const date =
      timezone === "utc" ? new Date(Date.UTC(y, mo - 1, d, h, mi, s)) : new Date(y, mo - 1, d, h, mi, s);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [year, month, day, hour, minute, second, timezone]);

  const handleUseNowForTimestamp = () => {
    setTimestampInput(String(Math.floor(Date.now() / 1000)));
    setUnit("auto");
  };

  const handleUseNowForDate = () => {
    const fields = dateFieldsFromDate(new Date(), timezone);
    setYear(String(fields.year));
    setMonth(String(fields.month));
    setDay(String(fields.day));
    setHour(String(fields.hour));
    setMinute(String(fields.minute));
    setSecond(String(fields.second));
  };

  const handleClearTimestamp = () => {
    setTimestampInput("");
  };

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
  };

  const unitToggleClass = (active: boolean) =>
    active
      ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm"
      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300";

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 rounded-xl shadow-sm border border-sky-200/50 dark:border-sky-700/30 flex-shrink-0">
                <Icon name="clock" className="h-7 w-7" />
              </div>
              {t.title}
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-3 ml-1 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Live Clock */}
      <div className="rounded-3xl border border-sky-200/60 dark:border-sky-800/40 bg-sky-50/50 dark:bg-sky-950/20 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 font-bold text-sm text-sky-700 dark:text-sky-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
          </span>
          {t.liveClock}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              {t.currentSeconds}
            </span>
            <span className="font-mono text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              {now ? Math.floor(now.getTime() / 1000) : "—"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              {t.currentMilliseconds}
            </span>
            <span className="font-mono text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              {now ? now.getTime() : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Timestamp -> Date */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="font-bold text-base text-slate-800 dark:text-slate-100">{t.toDateTitle}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.toDateSubtitle}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <input
              value={timestampInput}
              onChange={(e) => setTimestampInput(e.target.value)}
              placeholder={t.timestampPlaceholder}
              spellCheck={false}
              className="flex-1 min-w-[220px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 font-mono text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-500/20"
            />
            <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
              {(["auto", "s", "ms"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${unitToggleClass(unit === u)}`}
                >
                  {u === "auto" ? t.unitAuto : u === "s" ? t.unitSeconds : t.unitMilliseconds}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleUseNowForTimestamp}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer"
            >
              {t.now}
            </button>
            <button
              type="button"
              onClick={handleClearTimestamp}
              disabled={!timestampInput}
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

          {parsedTs.kind === "error" && (
            <p className="text-sm font-mono text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 rounded-xl px-4 py-2 inline-block">
              {t.invalidTimestamp}
            </p>
          )}

          {parsedTs.kind === "empty" && (
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{t.toDateEmptyState}</p>
          )}

          {parsedTs.kind === "ok" && now && (
            <div className="grid gap-3 sm:grid-cols-2">
              <ResultRow
                label={t.localTime}
                value={parsedTs.date.toLocaleString(undefined, DATE_FORMAT_OPTIONS)}
                copyLabel={t.copy}
                copiedLabel={t.copied}
                copied={copiedKey === "localTime"}
                onCopy={() => handleCopy("localTime", parsedTs.date.toLocaleString(undefined, DATE_FORMAT_OPTIONS))}
              />
              <ResultRow
                label={t.utcTime}
                value={parsedTs.date.toLocaleString(undefined, { ...DATE_FORMAT_OPTIONS, timeZone: "UTC" })}
                copyLabel={t.copy}
                copiedLabel={t.copied}
                copied={copiedKey === "utcTime"}
                onCopy={() =>
                  handleCopy(
                    "utcTime",
                    parsedTs.date.toLocaleString(undefined, { ...DATE_FORMAT_OPTIONS, timeZone: "UTC" }),
                  )
                }
              />
              <ResultRow
                label={t.isoFormat}
                value={parsedTs.date.toISOString()}
                mono
                copyLabel={t.copy}
                copiedLabel={t.copied}
                copied={copiedKey === "iso"}
                onCopy={() => handleCopy("iso", parsedTs.date.toISOString())}
              />
              <ResultRow
                label={t.relativeTime}
                value={formatRelative(parsedTs.date, now)}
                copyLabel={t.copy}
                copiedLabel={t.copied}
                copied={copiedKey === "relative"}
                onCopy={() => handleCopy("relative", formatRelative(parsedTs.date, now))}
              />
            </div>
          )}
        </div>
      </section>

      {/* Date -> Timestamp */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="font-bold text-base text-slate-800 dark:text-slate-100">{t.toTimestampTitle}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.toTimestampSubtitle}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <DateField label={t.year} value={year} onChange={setYear} />
            <DateField label={t.month} value={month} onChange={setMonth} min={1} max={12} />
            <DateField label={t.day} value={day} onChange={setDay} min={1} max={31} />
            <DateField label={t.hour} value={hour} onChange={setHour} min={0} max={23} />
            <DateField label={t.minute} value={minute} onChange={setMinute} min={0} max={59} />
            <DateField label={t.second} value={second} onChange={setSecond} min={0} max={59} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
              <span className="px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t.timezone}
              </span>
              {(["local", "utc"] as const).map((tz) => (
                <button
                  key={tz}
                  type="button"
                  onClick={() => setTimezone(tz)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${unitToggleClass(timezone === tz)}`}
                >
                  {tz === "local" ? t.timezoneLocal : t.timezoneUtc}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleUseNowForDate}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer"
            >
              {t.now}
            </button>
          </div>

          {composedDate && (
            <div className="grid gap-3 sm:grid-cols-2">
              <ResultRow
                label={t.resultSeconds}
                value={String(Math.floor(composedDate.getTime() / 1000))}
                mono
                copyLabel={t.copy}
                copiedLabel={t.copied}
                copied={copiedKey === "resultSeconds"}
                onCopy={() => handleCopy("resultSeconds", String(Math.floor(composedDate.getTime() / 1000)))}
              />
              <ResultRow
                label={t.resultMilliseconds}
                value={String(composedDate.getTime())}
                mono
                copyLabel={t.copy}
                copiedLabel={t.copied}
                copied={copiedKey === "resultMilliseconds"}
                onCopy={() => handleCopy("resultMilliseconds", String(composedDate.getTime()))}
              />
            </div>
          )}
        </div>
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

function ResultRow({
  label,
  value,
  mono,
  copyLabel,
  copiedLabel,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyLabel: string;
  copiedLabel: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 px-4 py-3">
      <div className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
          {label}
        </span>
        <span
          className={`block text-sm font-semibold text-slate-800 dark:text-slate-100 break-all ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-500 active:scale-95 cursor-pointer"
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-500/20"
      />
    </div>
  );
}
