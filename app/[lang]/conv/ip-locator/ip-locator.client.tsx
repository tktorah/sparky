"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type IpLocatorClientProps = {
  dict: Dictionary;
};

type IpInfo = {
  ip: string;
  success?: boolean;
  message?: string;
  type: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  flag?: { emoji: string };
  connection?: { asn: number; org: string; isp: string };
  timezone?: { id: string; utc: string };
};

export function IpLocatorClient({ dict }: IpLocatorClientProps) {
  const t = dict.ipLocator;

  const [data, setData] = useState<IpInfo | null>(null);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("https://ipwho.is/")
      .then((res) => res.json())
      .then((json: IpInfo) => {
        if (cancelled) return;
        if (json.success === false) {
          setError(true);
          return;
        }
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const loading = !data && !error;

  const handleRefresh = () => {
    setData(null);
    setError(false);
    setRefreshKey((k) => k + 1);
  };

  const handleCopyIp = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.ip);
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

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="relative flex h-3 w-3 mb-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-500" />
          </span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t.loading}</p>
        </div>
      )}

      {error && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">⚠️</span>
          <p className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-1">{t.errorTitle}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mb-5">{t.errorMessage}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer"
          >
            {t.retry}
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Hero: IP address */}
          <div className="rounded-3xl border border-teal-200/60 dark:border-teal-800/40 bg-teal-50/50 dark:bg-teal-950/20 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1.5">
                  {t.yourIp}
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-3xl font-extrabold text-slate-800 dark:text-slate-100 break-all">
                    {data.ip}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    {data.type}
                  </span>
                </div>
                {data.country && (
                  <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {data.flag?.emoji} {data.country}
                    {data.city ? ` · ${data.city}` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyIp}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-500 active:scale-95 cursor-pointer"
                >
                  {copied ? t.copied : t.copyIp}
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-500 active:scale-95 cursor-pointer"
                >
                  {t.refresh}
                </button>
              </div>
            </div>
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm p-5">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/10 border-rose-500/20 border" />
                {t.location}
              </h3>
              <div className="space-y-3">
                <InfoRow label={t.country} value={data.country} />
                <InfoRow label={t.region} value={data.region} />
                <InfoRow label={t.city} value={data.city} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm p-5">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600/10 border-violet-600/20 border" />
                {t.coordinates}
              </h3>
              <div className="space-y-3">
                <InfoRow label={t.coordinates} value={`${data.latitude}, ${data.longitude}`} mono />
              </div>
              <a
                href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-1.5 w-full px-3.5 py-2 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-500 active:scale-95 cursor-pointer"
              >
                {t.viewOnMap}
              </a>
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm p-5">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600/10 border-sky-600/20 border" />
                {t.isp}
              </h3>
              <div className="space-y-3">
                <InfoRow label={t.isp} value={data.connection?.isp ?? data.connection?.org ?? "—"} />
                <InfoRow label={t.asn} value={data.connection?.asn ? `AS${data.connection.asn}` : "—"} mono />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm p-5">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600/10 border-emerald-600/20 border" />
                {t.timezone}
              </h3>
              <div className="space-y-3">
                <InfoRow label={t.timezone} value={data.timezone?.id ?? "—"} />
                {data.timezone?.utc && <InfoRow label="UTC" value={data.timezone.utc} mono />}
              </div>
            </div>
          </div>
        </>
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

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span
        className={`text-sm font-semibold break-all text-slate-700 dark:text-slate-200 ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
