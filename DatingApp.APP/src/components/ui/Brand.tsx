"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Global, Moon, Sun1 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/context/LanguageContext";
import { useHomeHref } from "@/lib/session";

/** Figma: Logo (Variant = Default) — 122 × 72. Links to Home, or the Dashboard once signed in. */
export function Logo({ height = 72, className }: { height?: number; className?: string }) {
  const home = useHomeHref();
  return (
    <Link href={home} aria-label={home === "/" ? "Vikasitha home" : "Go to your dashboard"} className={cn("inline-flex shrink-0", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.png" alt="Vikasitha" style={{ height, width: (height * 122) / 72 }} />
    </Link>
  );
}

/** Figma: Illustration / Avatar (Style = Illustrated) */
export function CoupleAvatar({ size = 64, type = "couple", className }: { size?: number; type?: "couple" | "bride" | "groom"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/brand/${type}.png`} alt="" width={size} height={size} className={cn("rounded-full", className)} style={{ width: size, height: size }} />
  );
}

/** Surface = Default (on light pages) or Glass (on the hero photo) — matches Figma variants. */
export type Surface = "default" | "glass";

const surfaceShell: Record<Surface, string> = {
  // Figma: white 14 % fill, no border, dark text + icon
  default: "bg-surface-glass text-ink hover:bg-brand-subtle",
  // Figma: white 14 % fill, no border, white text, brand globe
  glass: "bg-surface-glass text-ink-on-brand backdrop-blur-[8px] hover:bg-line-glass-subtle",
};

/* ── Figma: Language Switch ─────────────────────────────────────────── */
const LANGS = [
  { code: "EN", label: "English", lang: "en" as const },
  { code: "සිං", label: "සිංහල", lang: "si" as const },
];

export function LanguageSwitch({ surface = "default" }: { surface?: Surface }) {
  const [open, setOpen] = useState(false);
  const { lang, setLanguage } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const activeLabel = lang === "si" ? "සිං" : "EN";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className={cn("flex h-10 items-center gap-1.5 rounded-[24px] px-2.5 text-label-md transition-colors", surfaceShell[surface])}
      >
        <Global size={18} color="currentColor" className={surface === "glass" ? "text-brand" : undefined} />
        {activeLabel}
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 top-12 z-40 w-36 animate-fade-up overflow-hidden rounded-md border border-line bg-surface-card py-1 text-ink shadow-lg">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={lang === l.lang}
                lang={l.lang}
                onClick={() => {
                  setLanguage(l.lang);
                  setOpen(false);
                }}
                className={cn("w-full px-3 py-2 text-left text-body-sm hover:bg-brand-subtle", lang === l.lang && "font-bold text-brand-text")}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Figma: Theme Toggle (Surface = Default / Glass, Mode = Light / Dark) ──
   One 40px round button (no border): 32px inner circle with the current
   mode icon (sun / moon). Default = gradient circle, white icon; Glass =
   white 14 % shell, white circle, brand icon. Click switches the mode. */
export function ThemeToggle({ surface = "default" }: { surface?: Surface }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("vk-theme", next ? "dark" : "light");
    } catch {
      /* storage blocked */
    }
  };

  const Icon = dark ? Moon : Sun1;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-1 transition-transform hover:scale-105 active:scale-95",
        surface === "glass" ? "bg-surface-glass backdrop-blur-[8px]" : "bg-transparent"
      )}
    >
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", surface === "glass" ? "bg-white text-brand" : "bg-brand-gradient text-ink-on-brand")}>
        <Icon size={18} color="currentColor" />
      </span>
    </button>
  );
}
