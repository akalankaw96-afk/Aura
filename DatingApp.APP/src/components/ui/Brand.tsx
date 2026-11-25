"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { Global, Moon, Sun1 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/context/LanguageContext";
import { useHomeHref } from "@/lib/session";
import { KEYS, storage } from "@/lib/storage";

/** Yugadiwi logo artwork (766 × 288): width = height × LOGO_RATIO. */
export const LOGO_RATIO = 766 / 288;

/**
 * The logo picture on its own, no link. Shows the light artwork, or the soft-rose
 * dark-mode artwork when [data-theme="dark"] is set (CSS: .brand-logo-light / -dark).
 * tone="onDark" always uses the soft-rose artwork, for surfaces that stay dark in both themes (Footer).
 */
export type LogoTone = "auto" | "onDark";

export function BrandLogo({ height = 64, priority = true, tone = "auto", className }: { height?: number; priority?: boolean; tone?: LogoTone; className?: string }) {
  const width = Math.round(height * LOGO_RATIO);
  const size = { height, width };
  if (tone === "onDark") {
    return (
      <span className={cn("inline-flex shrink-0", className)} style={size}>
        <Image src="/brand/logo-dark.png" alt="Yugadiwi" width={width} height={height} priority={priority} style={size} />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex shrink-0", className)} style={size}>
      <Image src="/brand/logo.png" alt="Yugadiwi" width={width} height={height} priority={priority} className="brand-logo-light" style={size} />
      <Image src="/brand/logo-dark.png" alt="" aria-hidden width={width} height={height} priority={priority} className="brand-logo-dark" style={size} />
    </span>
  );
}

/** Figma: Logo (Variant = Default). Links to Home, or the Dashboard once signed in. */
export function Logo({ height = 64, tone = "auto", className }: { height?: number; tone?: LogoTone; className?: string }) {
  const home = useHomeHref();
  return (
    <Link href={home} aria-label={home === "/" ? "Yugadiwi home" : "Go to your dashboard"} className={cn("inline-flex shrink-0", className)}>
      <BrandLogo height={height} tone={tone} />
    </Link>
  );
}

/** Figma: Illustration / Avatar (Style = Illustrated) */
export function CoupleAvatar({ size = 64, type = "couple", className }: { size?: number; type?: "couple" | "bride" | "groom"; className?: string }) {
  return (
    <Image src={`/brand/${type}.png`} alt="" width={size} height={size} className={cn("rounded-full", className)} style={{ width: size, height: size }} />
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
type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

/**
 * Theme switch with a circular reveal: the new theme grows from the toggle (top right) until it covers the
 * farthest corner (bottom left), one pass. The circle is a CSS animation on ::view-transition-new(root)
 * (`.theme-reveal` in globals.css), so it is clipped from the very first frame to the last — no flash of the full
 * new theme before it starts or after it ends. Browsers without View Transitions, and "reduce motion", switch at once.
 */
function revealTheme(origin: HTMLElement, apply: () => void) {
  const doc = document as ViewTransitionDoc;
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // .theme-switching turns off every colour fade while the theme changes, so nothing fades again afterwards
  root.classList.add("theme-switching");
  const done = () => requestAnimationFrame(() => root.classList.remove("theme-switching", "theme-reveal"));
  if (!doc.startViewTransition || reduce) {
    apply();
    done();
    return;
  }
  const r = origin.getBoundingClientRect();
  // hidden toggle (no box) → start from the top-right corner
  const x = r.width ? r.left + r.width / 2 : window.innerWidth;
  const y = r.height ? r.top + r.height / 2 : 0;
  const radius = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)));
  root.style.setProperty("--reveal-x", `${x}px`);
  root.style.setProperty("--reveal-y", `${y}px`);
  root.style.setProperty("--reveal-r", `${radius}px`);
  root.classList.add("theme-reveal");
  doc
    .startViewTransition(apply)
    .finished.catch(() => undefined)
    .finally(done);
}

export function ThemeToggle({ surface = "default" }: { surface?: Surface }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !dark;
    const apply = () => {
      flushSync(() => setDark(next)); // the icon is part of the "after" snapshot
      if (next) document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      storage.set(KEYS.theme, next ? "dark" : "light");
    };
    revealTheme(e.currentTarget, apply);
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
