"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";
import { TAILWIND_COLORS } from "@/src/resources/tailwind-colors";

type ColorConverterClientProps = {
  dict: Dictionary;
};

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

// ─── Color math ──────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parseHex(input: string): Rgb | null {
  const trimmed = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [r, g, b] = trimmed.split("").map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return {
      r: parseInt(trimmed.slice(0, 2), 16),
      g: parseInt(trimmed.slice(2, 4), 16),
      b: parseInt(trimmed.slice(4, 6), 16),
    };
  }
  return null;
}

function toHexByte(n: number): string {
  return clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) return { h: 0, s: 0, l: Math.round(l * 100) };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  h *= 60;
  if (h < 0) h += 360;

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let [rp, gp, bp] = [0, 0, 0];

  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (c: number) => {
    const cn = c / 255;
    return cn <= 0.03928 ? cn / 12.92 : ((cn + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(rgb: Rgb, referenceLuminance: number): number {
  const l = relativeLuminance(rgb);
  const lighter = Math.max(l, referenceLuminance);
  const darker = Math.min(l, referenceLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function nearestTailwindColor(rgb: Rgb): { name: string; hex: string } {
  let best = TAILWIND_COLORS[0];
  let bestDist = Infinity;
  for (const c of TAILWIND_COLORS) {
    const cr = parseInt(c.hex.slice(1, 3), 16);
    const cg = parseInt(c.hex.slice(3, 5), 16);
    const cb = parseInt(c.hex.slice(5, 7), 16);
    const dist = (rgb.r - cr) ** 2 + (rgb.g - cg) ** 2 + (rgb.b - cb) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return best;
}

export function ColorConverterClient({ dict }: ColorConverterClientProps) {
  const t = dict.colorConverter;

  const [color, setColor] = useState<Rgb>({ r: 59, g: 130, b: 246 });
  const [hexText, setHexText] = useState("#3b82f6");
  const [hexError, setHexError] = useState(false);
  const [alpha, setAlpha] = useState(100);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const hsl = useMemo(() => rgbToHsl(color), [color]);
  const hex = useMemo(() => rgbToHex(color), [color]);

  const applyColor = (next: Rgb) => {
    setColor(next);
    setHexText(rgbToHex(next));
    setHexError(false);
  };

  const handleHexTextChange = (value: string) => {
    setHexText(value);
    const parsed = parseHex(value);
    if (parsed) {
      setColor(parsed);
      setHexError(false);
    } else {
      setHexError(true);
    }
  };

  const handleRgbChange = (channel: keyof Rgb, value: number) => {
    applyColor({ ...color, [channel]: clamp(value, 0, 255) });
  };

  const handleHslChange = (channel: keyof Hsl, value: number) => {
    const max = channel === "h" ? 360 : 100;
    const nextHsl = { ...hsl, [channel]: clamp(value, 0, max) };
    applyColor(hslToRgb(nextHsl));
  };

  const rgbaString = `rgba(${color.r}, ${color.g}, ${color.b}, ${(alpha / 100).toFixed(2)})`;
  const rgbString = `rgb(${color.r}, ${color.g}, ${color.b})`;
  const hslString = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  const hslaString = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${(alpha / 100).toFixed(2)})`;

  const nearest = useMemo(() => nearestTailwindColor(color), [color]);

  const contrastWhite = contrastRatio(color, 1);
  const contrastBlack = contrastRatio(color, 0);

  const harmony = useMemo(() => {
    const complementary = hslToRgb({ ...hsl, h: normalizeHue(hsl.h + 180) });
    const analogous = [
      hslToRgb({ ...hsl, h: normalizeHue(hsl.h - 30) }),
      hslToRgb({ ...hsl, h: normalizeHue(hsl.h + 30) }),
    ];
    const triadic = [
      hslToRgb({ ...hsl, h: normalizeHue(hsl.h + 120) }),
      hslToRgb({ ...hsl, h: normalizeHue(hsl.h + 240) }),
    ];
    const monochromatic = [-30, -15, 15, 30].map((delta) =>
      hslToRgb({ ...hsl, l: clamp(hsl.l + delta, 4, 96) }),
    );
    return { complementary, analogous, triadic, monochromatic };
  }, [hsl]);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-xl shadow-sm border border-pink-200/50 dark:border-pink-700/30 flex-shrink-0">
                <Icon name="palette" className="h-7 w-7" />
              </div>
              {t.title}
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-3 ml-1 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={hex}
                onChange={(e) => {
                  const parsed = parseHex(e.target.value);
                  if (parsed) applyColor(parsed);
                }}
                className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent p-0"
              />
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
                  {t.hex}
                </label>
                <input
                  value={hexText}
                  onChange={(e) => handleHexTextChange(e.target.value)}
                  spellCheck={false}
                  className={`w-full rounded-xl border px-3.5 py-2 font-mono text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 outline-none focus:ring-2 transition-colors ${
                    hexError
                      ? "border-red-300 dark:border-red-700 focus:ring-red-100 dark:focus:ring-red-500/20"
                      : "border-slate-200 dark:border-slate-700 focus:border-pink-400 focus:ring-pink-100 dark:focus:ring-pink-500/20"
                  }`}
                />
                {hexError && <p className="mt-1 text-xs text-red-500 font-medium">{t.invalidHex}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ChannelField label={t.red} value={color.r} max={255} onChange={(v) => handleRgbChange("r", v)} />
              <ChannelField label={t.green} value={color.g} max={255} onChange={(v) => handleRgbChange("g", v)} />
              <ChannelField label={t.blue} value={color.b} max={255} onChange={(v) => handleRgbChange("b", v)} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ChannelField label={t.hue} value={hsl.h} max={360} onChange={(v) => handleHslChange("h", v)} />
              <ChannelField
                label={t.saturation}
                value={hsl.s}
                max={100}
                suffix="%"
                onChange={(v) => handleHslChange("s", v)}
              />
              <ChannelField
                label={t.lightness}
                value={hsl.l}
                max={100}
                suffix="%"
                onChange={(v) => handleHslChange("l", v)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between mb-2">
                <span>{t.opacity}</span>
                <span className="text-pink-600 dark:text-pink-400 font-bold bg-pink-50 dark:bg-pink-900/40 px-2 py-0.5 rounded-md">
                  {alpha}%
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-full accent-pink-600 dark:accent-pink-400 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Formats */}
          <div className="space-y-3">
            <FormatRow
              label={t.hex}
              value={hex}
              copied={copiedKey === "hex"}
              copyLabel={t.copy}
              copiedLabel={t.copied}
              onCopy={() => handleCopy("hex", hex)}
            />
            <FormatRow
              label={t.rgb}
              value={rgbString}
              copied={copiedKey === "rgb"}
              copyLabel={t.copy}
              copiedLabel={t.copied}
              onCopy={() => handleCopy("rgb", rgbString)}
            />
            <FormatRow
              label={t.rgba}
              value={rgbaString}
              copied={copiedKey === "rgba"}
              copyLabel={t.copy}
              copiedLabel={t.copied}
              onCopy={() => handleCopy("rgba", rgbaString)}
            />
            <FormatRow
              label={t.hsl}
              value={hslString}
              copied={copiedKey === "hsl"}
              copyLabel={t.copy}
              copiedLabel={t.copied}
              onCopy={() => handleCopy("hsl", hslString)}
            />
            <FormatRow
              label={t.hsla}
              value={hslaString}
              copied={copiedKey === "hsla"}
              copyLabel={t.copy}
              copiedLabel={t.copied}
              onCopy={() => handleCopy("hsla", hslaString)}
            />
            <FormatRow
              label={t.nearestTailwind}
              value={`${nearest.name} (${nearest.hex})`}
              copied={copiedKey === "tw"}
              copyLabel={t.copy}
              copiedLabel={t.copied}
              onCopy={() => handleCopy("tw", nearest.name)}
              swatch={nearest.hex}
            />
          </div>
        </div>

        {/* Right: preview + contrast + harmony */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
            <div
              className="h-40 w-full flex items-end p-4"
              style={{
                backgroundColor: rgbaString,
                backgroundImage:
                  "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            >
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/80 text-slate-700 backdrop-blur">
                {t.preview}
              </span>
            </div>
          </div>

          {/* WCAG Contrast */}
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4">{t.contrastTitle}</h3>
            <div className="grid grid-cols-2 gap-4">
              <ContrastCard label={t.contrastVsWhite} ratio={contrastWhite} t={t} bg="#ffffff" fg={hex} />
              <ContrastCard label={t.contrastVsBlack} ratio={contrastBlack} t={t} bg="#000000" fg={hex} />
            </div>
          </div>

          {/* Harmony */}
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{t.harmonyTitle}</h3>

            <HarmonyRow label={t.harmonyComplementary} colors={[harmony.complementary]} onPick={applyColor} />
            <HarmonyRow label={t.harmonyAnalogous} colors={harmony.analogous} onPick={applyColor} />
            <HarmonyRow label={t.harmonyTriadic} colors={harmony.triadic} onPick={applyColor} />
            <HarmonyRow label={t.harmonyMonochromatic} colors={harmony.monochromatic} onPick={applyColor} />
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

// ─── Subcomponents ───────────────────────────────────────────────────────────

function ChannelField({
  label,
  value,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={0}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-500/20"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function FormatRow({
  label,
  value,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
  swatch,
}: {
  label: string;
  value: string;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  onCopy: () => void;
  swatch?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/50 px-4 py-3">
      <div className="min-w-0 flex items-center gap-3">
        {swatch && (
          <span
            className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0"
            style={{ backgroundColor: swatch }}
          />
        )}
        <div className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {label}
          </span>
          <span className="font-mono text-sm text-slate-800 dark:text-slate-100 break-all">{value}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-300 dark:hover:border-pink-500 active:scale-95 cursor-pointer"
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

function ContrastCard({
  label,
  ratio,
  t,
  bg,
  fg,
}: {
  label: string;
  ratio: number;
  t: Dictionary["colorConverter"];
  bg: string;
  fg: string;
}) {
  const checks = [
    { label: t.wcagAANormal, pass: ratio >= 4.5 },
    { label: t.wcagAAANormal, pass: ratio >= 7 },
    { label: t.wcagAALarge, pass: ratio >= 3 },
  ];
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
      <div
        className="h-16 flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: bg, color: fg }}
      >
        Aa
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {label}: {ratio.toFixed(2)}
        </p>
        {checks.map((c) => (
          <div key={c.label} className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">{c.label}</span>
            <span
              className={`font-bold ${c.pass ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
            >
              {c.pass ? t.pass : t.fail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HarmonyRow({
  label,
  colors,
  onPick,
}: {
  label: string;
  colors: Rgb[];
  onPick: (rgb: Rgb) => void;
}) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
        {label}
      </span>
      <div className="flex gap-2">
        {colors.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(c)}
            title={rgbToHex(c)}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform cursor-pointer"
            style={{ backgroundColor: rgbToHex(c) }}
          />
        ))}
      </div>
    </div>
  );
}
