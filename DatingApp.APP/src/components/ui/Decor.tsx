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

/** Figma: Illustration / Love Scene — waves, heart balloons and the couple. */
export function LoveScene({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none w-full", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/love-scene.png" alt="" className="block h-[150px] w-full object-cover object-center sm:h-[200px] lg:h-[260px]" />
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
