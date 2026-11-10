"use client";

import React from "react";
import { cn } from "@/lib/cn";

/**
 * Figma: Toggle (On = False / True) — 44 × 24 switch.
 * Off: grey track · On: Gradient/Brand track. The knob slides with a spring.
 */
export function Toggle({
  checked,
  onChange,
  label,
  className,
  disabled,
  role = "switch",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  /** accessible name */
  label: string;
  className?: string;
  disabled?: boolean;
  role?: "switch" | "menuitemcheckbox";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300",
        "focus-visible:outline-none focus-visible:shadow-ring-brand disabled:opacity-50",
        checked ? "bg-brand-gradient" : "bg-surface-muted ring-1 ring-inset ring-line-strong",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
