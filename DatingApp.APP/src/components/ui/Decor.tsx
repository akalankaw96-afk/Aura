import React from "react";
import { cn } from "@/lib/cn";

/**
 * Decorative illustrations, exported 1:1 from Figma (🧩 Components → 06 Illustrations & decor).
 * All are aria-hidden: they carry no meaning.
 */

/** Figma: Pattern / Heart Lines — tiles vertically behind a whole page (1440 × 1200 tile). */
export function HeartPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 bg-[url('/images/decor/heart-pattern.png')] bg-[length:1440px_1200px] bg-top bg-repeat-y max-md:bg-[length:720px_600px]", className)}
    />
  );
}

/**
 * Figma: Illustration / Love Scene (Size = Desktop 1440 × 260) — three soft waves,
 * heart balloons on strings, Love Stickers and jasmine dots. Drawn as SVG from the
 * Figma vectors so it stays sharp; on narrow screens it crops to the centre
 * (keeps the balloons in view, like Size = Mobile).
 */
export function LoveScene({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none w-full overflow-hidden", className)}>
      <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" className="block h-[150px] w-full sm:h-[200px] lg:h-[260px]">
        <defs>
          <linearGradient id="ls-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe1ea" />
            <stop offset="1" stopColor="#fff0f4" />
          </linearGradient>
          <linearGradient id="ls-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffc7d6" />
            <stop offset="1" stopColor="#ffe1ea" />
          </linearGradient>
          <linearGradient id="ls-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fdebc0" />
            <stop offset="1" stopColor="#fff8e6" />
          </linearGradient>
        </defs>
        <path d="M0 107.36C240 41.94 480 63.75 720 96.46C960 129.17 1200 52.85 1440 85.55V260H0Z" fill="url(#ls-back)" />
        <path d="M0 136.07C300 88.4 520 155.13 760 126.53C1000 97.93 1220 155.13 1440 117V260H0Z" fill="url(#ls-mid)" />
        <path d="M0 187.65C260 208.32 520 172.14 720 177.31C940 182.48 1180 213.49 1440 192.82V260H0Z" fill="url(#ls-front)" />
        <path d="M0.645 0C8.645 30-7.355 60 4.645 90" transform="translate(607.6 147)" stroke="var(--rose-700)" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
        <path d="M20 38C20 38 0 26 0 12C0 5 5 0 12 0C16 0 19 2 20 5C21 2 24 0 28 0C35 0 40 5 40 12C40 26 20 38 20 38Z" transform="matrix(0.985 0.174 -0.174 0.985 591.6 111)" fill="#de0547" stroke="#000" strokeWidth="1" />
        <path d="M0.645 0C8.645 30-7.355 60 4.645 90" transform="translate(781 88.2)" stroke="var(--rose-700)" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
        <path d="M20 38C20 38 0 26 0 12C0 5 5 0 12 0C16 0 19 2 20 5C21 2 24 0 28 0C35 0 40 5 40 12C40 26 20 38 20 38Z" transform="matrix(0.990 -0.139 0.139 0.990 761 70.6)" fill="#f5c451" stroke="#000" strokeWidth="1" />
        <path d="M0.645 0C8.645 30-7.355 60 4.645 90" transform="translate(909 137.2)" stroke="var(--rose-700)" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
        <path d="M20 38C20 38 0 26 0 12C0 5 5 0 12 0C16 0 19 2 20 5C21 2 24 0 28 0C35 0 40 5 40 12C40 26 20 38 20 38Z" transform="matrix(0.970 -0.242 0.242 0.970 885 115.7)" fill="#fa5f8a" stroke="#000" strokeWidth="1" />
        <image href="/images/decor/sticker-outline.png" width="58" height="58" transform="matrix(0.978 0.208 -0.208 0.978 173 91)" />
        <image href="/images/decor/sticker-sparkle.png" width="58" height="58" transform="matrix(0.985 -0.174 0.174 0.985 1210 78)" />
        <image href="/images/decor/sticker-filled.png" width="38" height="38" transform="matrix(0.990 -0.139 0.139 0.990 403 143)" />
        <image href="/images/decor/sticker-double.png" width="45" height="45" transform="matrix(0.990 0.139 -0.139 0.990 1008 143)" />
        <circle cx="42.0" cy="132.0" r="2.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="140.0" cy="170.0" r="3.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="238.0" cy="148.0" r="4.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="333.0" cy="183.0" r="2.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="431.0" cy="161.0" r="3.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="529.0" cy="139.0" r="4.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="624.0" cy="174.0" r="2.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="722.0" cy="152.0" r="3.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="820.0" cy="190.0" r="4.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="915.0" cy="165.0" r="2.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="1013.0" cy="143.0" r="3.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="1111.0" cy="181.0" r="4.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="1206.0" cy="156.0" r="2.0" fill="#fff" fillOpacity="0.9" />
        <circle cx="1304.0" cy="134.0" r="3.0" fill="#fff" fillOpacity="0.9" />
      </svg>
    </div>
  );
}

/** Figma: Love Sticker (Style = Filled / Outline / Double / Sticker / Sparkle) */
export type LoveStickerStyle = "filled" | "outline" | "double" | "sticker" | "sparkle";

export function LoveSticker({ variant, size = 64, rotate = 0, className, style }: { variant: LoveStickerStyle; size?: number; rotate?: number; className?: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden
      alt=""
      src={`/images/decor/sticker-${variant}.png`}
      width={size}
      height={size}
      className={cn("pointer-events-none select-none", className)}
      style={{ width: size, height: size, transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
    />
  );
}
