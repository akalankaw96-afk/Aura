"use client";

import React from "react";
import { cn } from "@/lib/cn";

/**
 * Figma: Chip — Spacing = Wide (16px left/right padding, 36px tall).
 * Selected uses Gradient/Brand; `count` renders "Label · n".
 * `tone="danger"` is used for the Blocked filter when selected.
 */
export function FilterChip({
  selected,
  count,
  children,
  onClick,
  className,
}: {
  selected?: boolean;
  count?: number;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-4 text-label-md transition-all duration-200 active:scale-[0.97]",
        selected
          ? "border-transparent bg-brand-gradient text-white shadow-xs"
          : "border-line-strong bg-surface-card text-ink hover:border-brand hover:bg-brand-subtle hover:text-brand",
        className
      )}
    >
      <span>{children}</span>
      {typeof count === "number" && count > 0 && (
        <span key={count} className="animate-pop-in">
          · {count}
        </span>
      )}
    </button>
  );
}
