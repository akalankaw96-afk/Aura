"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Figma: Filter Chip (State = Default / Hover) — the active-filter tag:
 * brand-subtle pill, "Label: Value" and an ✕ that removes the filter.
 * (Toggle chips with 16px sides are <FilterChip> — Figma Chip / Spacing = Wide.)
 */
export function RemovableFilterChip({
  label,
  value,
  icon,
  onRemove,
  className,
  style,
}: {
  label?: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  onRemove: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={style}
      className={cn(
        "group inline-flex h-[34px] items-center gap-1.5 rounded-full border border-brand-ring bg-brand-subtle py-1.5 pl-3 pr-1.5 text-body-sm text-ink-secondary transition-all duration-200 hover:border-brand",
        className
      )}
    >
      {label && <span>{label}:</span>}
      {icon}
      <span className="font-semibold text-brand-text">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label ? label + " " : ""}filter`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-brand-text transition-all hover:rotate-90 hover:bg-white"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </span>
  );
}
