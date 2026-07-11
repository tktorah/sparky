"use client";

import { useEffect, useMemo, useState } from "react";
import CryptoJS from "crypto-js";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type HashGeneratorClientProps = {
  dict: Dictionary;
};

type Algo = "MD5" | "SHA1" | "SHA256" | "SHA512" | "SHA3-256" | "SHA3-512";
type Mode = "text" | "file";
type OutputCase = "lower" | "upper";

const ALGOS: Algo[] = ["MD5", "SHA1", "SHA256", "SHA512", "SHA3-256", "SHA3-512"];

// crypto-js's HmacSHA3 shortcut ignores custom outputLength and always
// produces a 512-bit digest, so SHA3-256 is only offered for plain hashing.
const HMAC_ALGOS: Algo[] = ["MD5", "SHA1", "SHA256", "SHA512", "SHA3-512"];

function computeHash(
  algo: Algo,
  message: string | CryptoJS.lib.WordArray,
  useHmac: boolean,
  hmacKey: string,
): CryptoJS.lib.WordArray {
  if (useHmac) {
    switch (algo) {
      case "MD5":
        return CryptoJS.HmacMD5(message, hmacKey);
      case "SHA1":
        return CryptoJS.HmacSHA1(message, hmacKey);
      case "SHA256":
        return CryptoJS.HmacSHA256(message, hmacKey);
      case "SHA512":
        return CryptoJS.HmacSHA512(message, hmacKey);
      case "SHA3-256":
      case "SHA3-512":
        return CryptoJS.HmacSHA3(message, hmacKey);
    }
  }
  switch (algo) {
    case "MD5":
      return CryptoJS.MD5(message);
    case "SHA1":
      return CryptoJS.SHA1(message);
    case "SHA256":
      return CryptoJS.SHA256(message);
    case "SHA512":
      return CryptoJS.SHA512(message);
    case "SHA3-256":
      return CryptoJS.SHA3(message, { outputLength: 256 });
    case "SHA3-512":
      return CryptoJS.SHA3(message, { outputLength: 512 });
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function HashGeneratorClient({ dict }: HashGeneratorClientProps) {
  const t = dict.hashGenerator;

  const [mode, setMode] = useState<Mode>("text");
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileError, setFileError] = useState(false);

  const [useHmac, setUseHmac] = useState(false);
  const [hmacKey, setHmacKey] = useState("");
  const [outputCase, setOutputCase] = useState<OutputCase>("lower");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    file
      .arrayBuffer()
      .then((buf) => {
        if (!cancelled) setFileBuffer(buf);
      })
      .catch(() => {
        if (!cancelled) setFileError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const message: string | CryptoJS.lib.WordArray | null = useMemo(() => {
    if (mode === "text") return textInput ? textInput : null;
    return fileBuffer ? CryptoJS.lib.WordArray.create(fileBuffer) : null;
  }, [mode, textInput, fileBuffer]);

  const visibleAlgos = useHmac ? HMAC_ALGOS : ALGOS;

  const results = useMemo(() => {
    if (message === null) return null;
    const entries: Record<string, string> = {};
    for (const algo of visibleAlgos) {
      let hex = computeHash(algo, message, useHmac, hmacKey).toString(CryptoJS.enc.Hex);
      if (outputCase === "upper") hex = hex.toUpperCase();
      entries[algo] = hex;
    }
    return entries;
  }, [message, visibleAlgos, useHmac, hmacKey, outputCase]);

  const handleClear = () => {
    setTextInput("");
    setFile(null);
    setFileBuffer(null);
    setFileError(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileBuffer(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(false);
    const nextFile = e.target.files?.[0] ?? null;
    setFile(nextFile);
    if (!nextFile) setFileBuffer(null);
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
  };

  const toggleClass = (active: boolean) =>
    active
      ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300";

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl shadow-sm border border-purple-200/50 dark:border-purple-700/30 flex-shrink-0">
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

      {/* Input card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-purple-500/15 focus-within:border-purple-500/30 transition-all duration-300">
        <div className="bg-slate-50/50 dark:bg-slate-900/50 px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-xl">
            {(["text", "file"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${toggleClass(mode === m)}`}
              >
                {m === "text" ? t.tabText : t.tabFile}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={!textInput && !file}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/50 active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {t.clear}
          </button>
        </div>

        <div className="p-6 space-y-5">
          {mode === "text" ? (
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t.pastePlaceholder}
              spellCheck={false}
              rows={5}
              className="w-full p-4 font-mono text-sm leading-relaxed bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-purple-300 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-slate-800 dark:text-slate-200 resize-none"
            />
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                {t.fileLabel}
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer">
                  {t.chooseFile}
                  <input type="file" onChange={handleFileChange} className="hidden" />
                </label>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {file ? `${file.name} (${formatFileSize(file.size)})` : t.noFileChosen}
                </span>
                {file && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    {t.removeFile}
                  </button>
                )}
              </div>
              {fileError && (
                <p className="text-sm font-mono text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 rounded-xl px-4 py-2 inline-block">
                  {t.emptyState}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={useHmac}
                onChange={(e) => setUseHmac(e.target.checked)}
                className="accent-purple-600"
              />
              {t.useHmac}
            </label>

            {useHmac && (
              <input
                value={hmacKey}
                onChange={(e) => setHmacKey(e.target.value)}
                placeholder={t.hmacKeyPlaceholder}
                spellCheck={false}
                className="flex-1 min-w-[200px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-500/20"
              />
            )}

            <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 p-1 rounded-xl">
              {(["lower", "upper"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setOutputCase(c)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${toggleClass(outputCase === c)}`}
                >
                  {c === "lower" ? t.caseLower : t.caseUpper}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {!results ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-5 bg-purple-50 dark:bg-purple-900/20 rounded-3xl mb-4 border border-purple-100 dark:border-purple-800/30">
            <Icon name="hash" className="h-10 w-10 text-purple-400 dark:text-purple-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">{t.emptyState}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleAlgos.map((algo) => {
            const value = results[algo];
            return (
              <div
                key={algo}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{algo}</span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {value.length} {t.chars}
                    </span>
                  </div>
                  <p className="font-mono text-sm text-slate-800 dark:text-slate-100 break-all">{value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(algo, value)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-500 active:scale-95 cursor-pointer"
                >
                  {copiedKey === algo ? t.copied : t.copy}
                </button>
              </div>
            );
          })}
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
