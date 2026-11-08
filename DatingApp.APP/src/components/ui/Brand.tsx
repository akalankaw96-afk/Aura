"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown2, Global, Moon, Sun1 } from "iconsax-react";
import { cn } from "@/lib/cn";

/** Figma: Logo (Variant = Default) — 122 × 72 */
export function Logo({ height = 72, className }: { height?: number; className?: string }) {
  return (
    <Link href="/" aria-label="Vikasitha home" className={cn("inline-flex shrink-0", className)}>
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
  default: "border-line-strong bg-surface-card text-ink hover:bg-surface-subtle",
  glass: "border-line-glass bg-surface-glass text-ink-on-brand backdrop-blur-[8px] hover:bg-line-glass-subtle",
};

/* ── Figma: Language Switch ─────────────────────────────────────────── */
const LANGS = [
  { code: "EN", label: "English", lang: "en" },
  { code: "සිං", label: "සිංහල", lang: "si" },
  { code: "தமி", label: "தமிழ்", lang: "ta" },
];

export function LanguageSwitch({ surface = "default" }: { surface?: Surface }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("EN");
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn("flex h-[41px] items-center gap-1.5 rounded-md border pl-3 pr-2.5 text-label-md transition-colors", surfaceShell[surface])}
      >
        <Global size={18} color="currentColor" />
        {lang}
        <ArrowDown2 size={14} color="currentColor" className="opacity-70" />
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 top-12 z-40 w-36 animate-fade-up overflow-hidden rounded-md border border-line bg-surface-card py-1 text-ink shadow-lg">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={lang === l.code}
                lang={l.lang}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                  document.documentElement.lang = l.lang;
                }}
                className={cn("w-full px-3 py-2 text-left text-body-sm hover:bg-brand-subtle", lang === l.code && "font-bold text-brand-text")}
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

/* ── Figma: Theme Toggle (light / dark) ─────────────────────────────── */
export function ThemeToggle({ surface = "default" }: { surface?: Surface }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const set = (isDark: boolean) => {
    setDark(isDark);
    if (isDark) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("vk-theme", isDark ? "dark" : "light");
    } catch {
      /* storage blocked */
    }
  };

  const option = (active: boolean) =>
    cn("flex h-8 w-8 items-center justify-center rounded-sm transition-colors", active ? "bg-surface-card text-brand shadow-xs" : "opacity-80 hover:opacity-100");

  return (
    <div role="group" aria-label="Colour theme" className={cn("flex h-[41px] items-center gap-0.5 rounded-md border px-1", surfaceShell[surface])}>
      <button type="button" aria-label="Light theme" aria-pressed={!dark} onClick={() => set(false)} className={option(!dark)}>
        <Sun1 size={18} color="currentColor" />
      </button>
      <button type="button" aria-label="Dark theme" aria-pressed={dark} onClick={() => set(true)} className={option(dark)}>
        <Moon size={18} color="currentColor" />
      </button>
    </div>
  );
}
