"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AddSquare,
  CloseCircle,
  ExportSquare,
  Flash,
  Home2,
  Import,
  More,
  Notification,
  ShieldTick,
  TickCircle,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

/* ------------------------------------------------------------------ */
/* Install the web app (PWA)                                          */
/*  1. A slim banner slides down at the very top of the page.          */
/*  2. "Install" → Android/Chrome: the native install prompt.          */
/*     iPhone/Safari (no prompt API) or no prompt yet → a bottom sheet  */
/*     with what you get + step-by-step instructions per platform.     */
/*  Hidden when already installed and for 14 days after                */
/*  "not now".                                                          */
/* ------------------------------------------------------------------ */

const DISMISS_KEY = "vk-install-dismissed";
const DISMISS_DAYS = 14;
const HIDDEN_ON = [/^\/admin/, /^\/components/];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallWindow = Window & { __vkInstallPrompt?: BeforeInstallPromptEvent };
type InstallNavigator = Navigator & { install?: () => Promise<unknown> };

type Platform = "ios" | "android";

const COPY = {
  en: {
    title: "Get the Vikasitha app",
    sub: "Free",
    details: "View details",
    install: "Install",
    sheetTitle: "Install Vikasitha on your phone",
    sheetSub: "It’s free, takes 10 seconds and uses almost no storage — no app store needed.",
    benefits: [
      { title: "Opens instantly", text: "One tap from your home screen, full screen like an app" },
      { title: "Never miss a reply", text: "Get notified about new requests and messages" },
      { title: "Private & secure", text: "Same verified, private account — nothing new to sign up for" },
    ],
    stepsTitle: "How to install",
    iphone: "iPhone",
    android: "Android",
    ios: [
      { icon: "share", text: "Tap the Share button at the bottom of Safari" },
      { icon: "add", text: "Scroll down and tap “Add to Home Screen”" },
      { icon: "done", text: "Turn on “Open as Web App” if shown, then tap “Add”" },
    ],
    androidSteps: [
      { icon: "more", text: "Tap the ⋮ menu at the top right of Chrome" },
      { icon: "install", text: "Tap “Install app” (or “Add to Home screen”)" },
      { icon: "done", text: "Tap “Install” — open Vikasitha from your home screen" },
    ],
    installNow: "Install now",
    gotIt: "Got it",
    notNow: "Not now",
    installed: "Vikasitha is installed 🎉",
    iosNote: "On iPhone this works in Safari. If you’re in another browser, open this page in Safari first.",
  },
  si: {
    title: "විකසිත යෙදුම ලබාගන්න",
    sub: "නොමිලේ",
    details: "විස්තර බලන්න",
    install: "ස්ථාපනය",
    sheetTitle: "විකසිත ඔබේ දුරකථනයට ස්ථාපනය කරන්න",
    sheetSub: "නොමිලේ, තත්පර 10ක් ගතවේ, ඉඩ ඉතා අල්පයි — යෙදුම් වෙළඳසැලක් අවශ්‍ය නැත.",
    benefits: [
      { title: "ක්ෂණිකව විවෘත වේ", text: "මුල් තිරයෙන් එක් තට්ටුවකින්, යෙදුමක් ලෙස සම්පූර්ණ තිරයෙන්" },
      { title: "පිළිතුරක් මග නොහරින්න", text: "නව ඉල්ලීම් සහ පණිවිඩ ගැන දැනුම්දීම්" },
      { title: "පෞද්ගලික සහ ආරක්ෂිත", text: "එම සත්‍යාපිත ගිණුමම — නව ලියාපදිංචියක් නැත" },
    ],
    stepsTitle: "ස්ථාපනය කරන ආකාරය",
    iphone: "iPhone",
    android: "Android",
    ios: [
      { icon: "share", text: "Safari පහළ ඇති Share බොත්තම ඔබන්න" },
      { icon: "add", text: "පහළට ගොස් “Add to Home Screen” ඔබන්න" },
      { icon: "done", text: "“Open as Web App” පෙන්වන්නේ නම් එය සක්‍රිය කර “Add” ඔබන්න" },
    ],
    androidSteps: [
      { icon: "more", text: "Chrome හි ඉහළ දකුණේ ⋮ මෙනුව ඔබන්න" },
      { icon: "install", text: "“Install app” (හෝ “Add to Home screen”) ඔබන්න" },
      { icon: "done", text: "“Install” ඔබන්න — මුල් තිරයෙන් විකසිත විවෘත කරන්න" },
    ],
    installNow: "දැන් ස්ථාපනය කරන්න",
    gotIt: "හරි",
    notNow: "පසුව",
    installed: "විකසිත ස්ථාපනය විය 🎉",
    iosNote: "iPhone හි මෙය Safari තුළ ක්‍රියා කරයි. වෙනත් බ්‍රව්සරයක නම්, පළමුව මෙම පිටුව Safari හි විවෘත කරන්න.",
  },
};

const STEP_ICON: Record<string, React.ReactNode> = {
  share: <ExportSquare size={20} color="currentColor" />,
  add: <AddSquare size={20} color="currentColor" />,
  more: <More size={20} color="currentColor" className="rotate-90" />,
  install: <Import size={20} color="currentColor" />,
  done: <TickCircle size={20} color="currentColor" variant="Bold" />,
};
const BENEFIT_ICON = [
  <Flash key="f" size={20} color="currentColor" variant="Bold" />,
  <Notification key="n" size={20} color="currentColor" variant="Bold" />,
  <ShieldTick key="s" size={20} color="currentColor" variant="Bold" />,
];

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallAppBanner() {
  const pathname = usePathname() || "/";
  const { lang } = useLanguage();
  const c = COPY[lang === "si" ? "si" : "en"];

  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [platform, setPlatform] = useState<Platform>("android");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [supportsInstall, setSupportsInstall] = useState(false);
  const [mobileDevice, setMobileDevice] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);
  const canInstall = supportsInstall || deferred !== null;

  useEffect(() => {
    if (window.isSecureContext && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    setPlatform(ios ? "ios" : "android");
    setMobileDevice(ios || /android/i.test(ua));
    setSupportsInstall(window.isSecureContext && typeof (navigator as InstallNavigator).install === "function");

    let dismissedRecently = false;
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      dismissedRecently = Date.now() - at < DISMISS_DAYS * 864e5;
    } catch {}
    if (!isStandalone() && !dismissedRecently) {
      // let the page loader finish first
      const t = window.setTimeout(() => setVisible(true), 1200);
      setDeferred((window as InstallWindow).__vkInstallPrompt ?? null);
      const onPrompt = (e: Event) => {
        e.preventDefault();
        setDeferred(e as BeforeInstallPromptEvent);
      };
      const onInstalled = () => {
        setDeferred(null);
        setDone(true);
        setSheet(false);
        close(false);
      };
      window.addEventListener("beforeinstallprompt", onPrompt);
      window.addEventListener("appinstalled", onInstalled);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onPrompt);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // lock scroll while the sheet is open
  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheet]);

  function close(remember = true) {
    if (remember) {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {}
    }
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 300);
  }

  async function install() {
    if (installing) return;
    if (!canInstall) {
      setSheet(true);
      return;
    }

    setInstalling(true);
    try {
      const prompt = deferred;
      delete (window as InstallWindow).__vkInstallPrompt;
      setDeferred(null);
      if (supportsInstall) {
        await (navigator as InstallNavigator).install?.();
      } else if (prompt) {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome !== "accepted") return;
      }
      setDone(true);
      setSheet(false);
      close(false);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setSheet(true);
    } finally {
      setInstalling(false);
    }
  }

  if (HIDDEN_ON.some((r) => r.test(pathname))) return null;

  return (
    <>
      {/* Banner — phone and tablet, plus desktop when native install is available */}
      {visible && (
        <div
          role="region"
          aria-label={c.title}
          className={cn(
            "relative z-[55] overflow-hidden border-b border-line bg-[linear-gradient(90deg,var(--color-surface-card),var(--rose-100))]",
            !mobileDevice && !canInstall && "lg:hidden",
            leaving ? "install-bar-out" : "install-bar-in"
          )}
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <button
              type="button"
              onClick={() => close()}
              aria-label={c.notNow}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-surface-subtle"
            >
              <CloseCircle size={18} color="currentColor" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/vk-icon-192.png" alt="" className="install-icon h-11 w-11 shrink-0 rounded-[12px] border border-line shadow-sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-label-md text-ink">{c.title}</p>
              <p className="flex min-w-0 items-center gap-1.5 text-caption text-ink-secondary">
                <span className="truncate">{c.sub}</span>
                <span aria-hidden>·</span>
                {/* opens the details modal (what you get + how to install) */}
                <button
                  type="button"
                  onClick={() => setSheet(true)}
                  aria-haspopup="dialog"
                  className="group inline-flex shrink-0 items-center gap-0.5 font-semibold text-brand-text underline-offset-2 hover:underline"
                >
                  {c.details}
                  <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">›</span>
                </button>
              </p>
            </div>
            <Button size="sm" variant="primary" className="shrink-0 rounded-full" leftIcon={<Import size={16} color="currentColor" />} onClick={install} loading={installing}>
              {canInstall ? c.install : c.stepsTitle}
            </Button>
          </div>
        </div>
      )}

      {/* Install sheet — what you get + steps */}
      {sheet && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center" role="dialog" aria-modal="true" aria-label={c.sheetTitle}>
          <div className="absolute inset-0 animate-fade-in bg-black/45" onClick={() => setSheet(false)} aria-hidden />
          <div className="install-sheet relative max-h-[92dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] bg-surface-card px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 shadow-xl lg:rounded-[28px]">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-surface-muted lg:hidden" />

            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/vk-icon-192.png" alt="" className="install-icon h-14 w-14 shrink-0 rounded-[16px] border border-line shadow-md" />
              <div className="min-w-0 flex-1">
                <h2 className="text-h5 text-ink">{c.sheetTitle}</h2>
                <p className="mt-1 text-body-sm text-ink-secondary">{c.sheetSub}</p>
              </div>
              <button type="button" onClick={() => setSheet(false)} aria-label="Close" className="-mr-1 rounded-full p-1 text-ink-tertiary hover:bg-surface-subtle">
                <CloseCircle size={24} color="currentColor" />
              </button>
            </div>

            {/* What you get */}
            <ul className="mt-5 flex flex-col gap-2.5">
              {c.benefits.map((b, i) => (
                <li
                  key={b.title}
                  className="flex items-center gap-3 rounded-[14px] bg-surface-subtle p-3"
                  style={{ animation: `fade-up 420ms cubic-bezier(0.22,1,0.36,1) ${120 + i * 70}ms backwards` }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-ink-on-brand">{BENEFIT_ICON[i]}</span>
                  <span className="min-w-0">
                    <span className="block text-label-md text-ink">{b.title}</span>
                    <span className="block text-caption text-ink-secondary">{b.text}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Steps */}
            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-label-lg text-ink">{c.stepsTitle}</h3>
              <div role="tablist" className="relative flex rounded-full border border-line bg-surface-subtle p-0.5">
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-full bg-brand-gradient shadow-xs transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
                    platform === "android" && "translate-x-full"
                  )}
                />
                {(["ios", "android"] as const).map((p) => (
                  <button
                    key={p}
                    role="tab"
                    aria-selected={platform === p}
                    onClick={() => setPlatform(p)}
                    className={cn("relative w-[78px] rounded-full py-1.5 text-label-sm transition-colors", platform === p ? "text-ink-on-brand" : "text-ink-secondary")}
                  >
                    {p === "ios" ? c.iphone : c.android}
                  </button>
                ))}
              </div>
            </div>

            <ol key={platform} className="mt-3 flex flex-col">
              {(platform === "ios" ? c.ios : c.androidSteps).map((s, i, arr) => (
                <li
                  key={s.text}
                  className="relative flex gap-3 pb-4 last:pb-0"
                  style={{ animation: `fade-up 420ms cubic-bezier(0.22,1,0.36,1) ${i * 90}ms backwards` }}
                >
                  {/* connector line */}
                  {i < arr.length - 1 && <span aria-hidden className="absolute left-[19px] top-10 h-[calc(100%-36px)] w-0.5 rounded-full bg-brand-ring" />}
                  <span
                    className={cn(
                      "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                      s.icon === "done" ? "border-success-fg bg-success-bg text-success-fg" : "border-brand-ring bg-brand-subtle text-brand"
                    )}
                  >
                    {STEP_ICON[s.icon]}
                    <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">{i + 1}</span>
                  </span>
                  <p className="pt-2 text-body-md text-ink">{s.text}</p>
                </li>
              ))}
            </ol>

            {platform === "ios" && (
              <p className="mt-4 flex items-start gap-2 rounded-[12px] bg-info-bg px-3 py-2 text-caption text-info-fg">
                <Home2 size={16} color="currentColor" className="mt-px shrink-0" /> {c.iosNote}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setSheet(false)}>
                {canInstall ? c.notNow : c.gotIt}
              </Button>
              {canInstall && (
                <Button variant="primary" className="flex-1 rounded-full" leftIcon={<Import size={18} color="currentColor" />} onClick={install} loading={installing}>
                  {c.installNow}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {done && (
        <span className="sr-only" role="status">
          {c.installed}
        </span>
      )}
    </>
  );
}
