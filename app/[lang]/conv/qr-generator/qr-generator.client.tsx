"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Icon } from "@/src/resources/icons";

type QrGeneratorClientProps = {
  dict: Dictionary;
};

type QrTab = "text" | "wifi" | "contact" | "email" | "sms" | "event";

export function QrGeneratorClient({ dict }: QrGeneratorClientProps) {
  const t = dict.qrGenerator;

  // Configuration States
  const [activeTab, setActiveTab] = useState<QrTab>("text");
  const [size, setSize] = useState<number>(384);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [fgColor, setFgColor] = useState<string>("#000000");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [margin, setMargin] = useState<number>(4);

  // Input states per tab
  const [textInput, setTextInput] = useState("https://proutil.org");
  
  // WiFi
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  // Contact
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactOrg, setContactOrg] = useState("");
  const [contactUrl, setContactUrl] = useState("");

  // Email
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // SMS
  const [smsTo, setSmsTo] = useState("");
  const [smsBody, setSmsBody] = useState("");

  // Event
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDesc, setEventDesc] = useState("");

  // Output States
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // Copy state
  const [copied, setCopied] = useState(false);

  // Presets
  const fgColors = ["#000000", "#1e3a8a", "#0f766e", "#15803d", "#b91c1c", "#4338ca"];
  const bgColors = ["#ffffff", "#f8fafc", "#f1f5f9", "#e0f2fe", "#f0fdf4", "#fff7ed"];

  // Helper to format Date for iCal
  const formatIcalDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  // Construct text to encode based on active tab
  const getEncodedText = useCallback((): string => {
    switch (activeTab) {
      case "text":
        return textInput;
      case "wifi":
        if (!wifiSsid) return "";
        return `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};H:${wifiHidden ? "true" : ""};;`;
      case "contact":
        if (!contactName) return "";
        return [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${contactName}`,
          contactOrg ? `ORG:${contactOrg}` : "",
          contactPhone ? `TEL:${contactPhone}` : "",
          contactEmail ? `EMAIL:${contactEmail}` : "",
          contactUrl ? `URL:${contactUrl}` : "",
          "END:VCARD"
        ].filter(Boolean).join("\n");
      case "email":
        if (!emailTo) return "";
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "sms":
        if (!smsTo) return "";
        return `SMSTO:${smsTo}:${smsBody}`;
      case "event":
        if (!eventTitle) return "";
        const start = formatIcalDate(eventStart);
        const end = formatIcalDate(eventEnd);
        return [
          "BEGIN:VEVENT",
          `SUMMARY:${eventTitle}`,
          start ? `DTSTART:${start}` : "",
          end ? `DTEND:${end}` : "",
          eventLocation ? `LOCATION:${eventLocation}` : "",
          eventDesc ? `DESCRIPTION:${eventDesc}` : "",
          "END:VEVENT"
        ].filter(Boolean).join("\n");
      default:
        return "";
    }
  }, [
    activeTab,
    textInput,
    wifiSsid,
    wifiEncryption,
    wifiPassword,
    wifiHidden,
    contactName,
    contactOrg,
    contactPhone,
    contactEmail,
    contactUrl,
    emailTo,
    emailSubject,
    emailBody,
    smsTo,
    smsBody,
    eventTitle,
    eventStart,
    eventEnd,
    eventLocation,
    eventDesc
  ]);

  const textToEncode = getEncodedText();

  // Generate QR Code on config or input change
  useEffect(() => {
    if (!textToEncode) {
      setQrDataUrl("");
      setError(null);
      return;
    }

    QRCode.toDataURL(
      textToEncode,
      {
        width: size,
        margin: margin,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      },
      (err, url) => {
        if (err) {
          setError(err.message || "Failed to generate QR Code");
          setQrDataUrl("");
        } else {
          setQrDataUrl(url);
          setError(null);
        }
      }
    );
  }, [textToEncode, size, errorLevel, fgColor, bgColor, margin]);

  // Actions
  const handleClear = () => {
    setTextInput("");
    setWifiSsid("");
    setWifiPassword("");
    setWifiEncryption("WPA");
    setWifiHidden(false);
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setContactOrg("");
    setContactUrl("");
    setEmailTo("");
    setEmailSubject("");
    setEmailBody("");
    setSmsTo("");
    setSmsBody("");
    setEventTitle("");
    setEventStart("");
    setEventEnd("");
    setEventLocation("");
    setEventDesc("");
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qrcode_${size}x${size}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 rounded-xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/30 flex-shrink-0">
                <Icon name="qr" className="h-7 w-7" />
              </div>
              {t.title}
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-3 ml-1 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form and customization options */}
        <div className="lg:col-span-7 space-y-6">
          {/* Form Card */}
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm flex flex-col">
            {/* Form Tabs header */}
            <div className="bg-slate-50/50 dark:bg-slate-900/50 px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-xl">
                {(["text", "wifi", "contact", "email", "sms", "event"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTab === tab
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab === "text"
                      ? t.tabText
                      : tab === "wifi"
                      ? t.tabWifi
                      : tab === "contact"
                      ? t.tabContact
                      : tab === "email"
                      ? t.tabEmail
                      : tab === "sms"
                      ? t.tabSms
                      : t.tabEvent}
                  </button>
                ))}
              </div>

              <button
                onClick={handleClear}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/50 active:scale-95 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                </svg>
                <span>{t.clear}</span>
              </button>
            </div>

            {/* Inputs based on Active Tab */}
            <div className="p-6">
              {activeTab === "text" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                    {t.inputLabel}
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t.placeholder}
                    spellCheck={false}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 dark:text-slate-200 text-sm h-32 resize-none leading-relaxed"
                  />
                </div>
              )}

              {activeTab === "wifi" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.wifiSsid}
                    </label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="MyHomeWiFi"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.wifiPassword}
                    </label>
                    <input
                      type="password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={wifiEncryption === "nopass"}
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.wifiEncryption}
                    </label>
                    <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/85">
                      {(["WPA", "WEP", "nopass"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setWifiEncryption(mode)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            wifiEncryption === mode
                              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                        >
                          {mode === "nopass" ? "None" : mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center h-full pt-4 md:pt-6 pl-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-350 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={wifiHidden}
                        onChange={(e) => setWifiHidden(e.target.checked)}
                        className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>{t.wifiHidden}</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "contact" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.contactName}
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.contactPhone}
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.contactEmail}
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.contactOrg}
                    </label>
                    <input
                      type="text"
                      value={contactOrg}
                      onChange={(e) => setContactOrg(e.target.value)}
                      placeholder="Sparky Inc."
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.contactUrl}
                    </label>
                    <input
                      type="url"
                      value={contactUrl}
                      onChange={(e) => setContactUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                    />
                  </div>
                </div>
              )}

              {activeTab === "email" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                        {t.emailTo}
                      </label>
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="hello@example.com"
                        className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                        {t.emailSubject}
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Inquiry"
                        className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.emailBody}
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Type your email body here..."
                      className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm h-24 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {activeTab === "sms" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.smsTo}
                    </label>
                    <input
                      type="tel"
                      value={smsTo}
                      onChange={(e) => setSmsTo(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full max-w-md px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.smsBody}
                    </label>
                    <textarea
                      value={smsBody}
                      onChange={(e) => setSmsBody(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm h-24 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {activeTab === "event" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.eventTitle}
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Sparky Hackathon"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.eventStart}
                    </label>
                    <input
                      type="datetime-local"
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-250 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.eventEnd}
                    </label>
                    <input
                      type="datetime-local"
                      value={eventEnd}
                      onChange={(e) => setEventEnd(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-250 text-sm"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.eventLocation}
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Tech Hub Hall A"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block ml-1">
                      {t.eventDesc}
                    </label>
                    <textarea
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      placeholder="Event details..."
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200 text-sm h-20 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options & Styling Customization Card */}
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Icon name="palette" className="h-4.5 w-4.5 text-blue-500" />
              <span>Options & Customization</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Size Slider */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>{t.size}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                    {size}px
                  </span>
                </label>
                <input
                  type="range"
                  min="128"
                  max="1024"
                  step="32"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-blue-600 dark:accent-blue-400 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Quiet Zone Margin */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>{t.margin}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                    {margin} modules
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full accent-blue-600 dark:accent-blue-400 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Error Correction Level */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.errorLevel}
                </label>
                <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/85">
                  {(["L", "M", "Q", "H"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setErrorLevel(lvl)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        errorLevel === lvl
                          ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {lvl === "L"
                        ? t.errorLevelL
                        : lvl === "M"
                        ? t.errorLevelM
                        : lvl === "Q"
                        ? t.errorLevelQ
                        : t.errorLevelH}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foreground Color Picker & Presets */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>{t.fgColor}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-slate-400">{fgColor}</span>
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-6 h-6 rounded-md border-0 p-0 cursor-pointer overflow-hidden bg-transparent"
                    />
                  </div>
                </label>
                <div className="flex flex-wrap gap-2">
                  {fgColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFgColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-lg border-2 transition-all cursor-pointer ${
                        fgColor === color ? "border-blue-500 scale-110 shadow-sm" : "border-transparent"
                      }`}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Background Color Picker & Presets */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>{t.bgColor}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-slate-400">{bgColor}</span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-6 h-6 rounded-md border-0 p-0 cursor-pointer overflow-hidden bg-transparent"
                    />
                  </div>
                </label>
                <div className="flex flex-wrap gap-2">
                  {bgColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBgColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-lg border-2 transition-all cursor-pointer ${
                        bgColor === color ? "border-blue-500 scale-110 shadow-sm" : "border-slate-200 dark:border-slate-700"
                      }`}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview and Export */}
        <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm items-center p-6 space-y-6">
          <h3 className="w-full text-left font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-700">
            Preview
          </h3>

          {/* QR Display Frame */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] w-full p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/80 relative">
            {error ? (
              <div className="flex flex-col items-center text-center p-4 text-red-500 space-y-2">
                <span className="text-3xl">⚠️</span>
                <p className="text-sm font-semibold">{error}</p>
              </div>
            ) : qrDataUrl ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/50">
                  {/* We force background white inside output wrapper for visual clarity if bg is set dark */}
                  <img
                    src={qrDataUrl}
                    alt="Generated QR Code"
                    className="max-w-xs md:max-w-sm rounded-lg object-contain transition-transform duration-300 hover:scale-[1.02]"
                    style={{ width: "240px", height: "240px" }}
                  />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Data Payload
                  </span>
                  <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 max-w-[280px] break-all truncate">
                    {textToEncode}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 space-y-3">
                <div className="p-4 bg-slate-150 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">
                  <Icon name="qr" className="h-10 w-10" />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold">
                  {t.emptyState}
                </p>
              </div>
            )}
          </div>

          {/* Export Action Controls */}
          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>{t.download}</span>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={!qrDataUrl}
              className="w-full py-2.5 px-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all shadow-sm border border-slate-200/80 dark:border-slate-600 active:scale-[0.98] hover:border-slate-350 dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2050/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{copied ? t.copied : t.copy}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
