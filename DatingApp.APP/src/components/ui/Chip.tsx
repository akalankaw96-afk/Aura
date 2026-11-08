"use client";

import React from "react";
import { cn } from "@/lib/cn";

/**
 * Figma: Chip (State = Default / Hover / Selected) with optional left
 * illustration avatar. Selected chips use Gradient/Brand.
 */
export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  avatar?: string; // image src
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** md = 44px with avatar (Figma Chip), sm = 33px text-only (registration) */
  size?: "sm" | "md";
}

export function Chip({ selected, avatar, leftIcon, rightIcon, size = "md", className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border text-label-md transition-all",
        size === "sm" ? "h-[33px] px-2.5" : "h-11",
        size === "md" && (avatar ? "pl-1.5 pr-4" : "px-4"),
        selected
          ? "border-transparent bg-brand-gradient text-white shadow-xs"
          : "border-line-strong bg-surface-card text-ink hover:border-brand hover:bg-brand-subtle hover:text-brand",
        className
      )}
      {...rest}
    >
      {avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-8 w-8 rounded-full bg-surface-card object-cover" />
      )}
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
