"use client";

import React from "react";
import { Category, RowVertical } from "iconsax-react";
import { cn } from "@/lib/cn";

export type ResultsView = "grid" | "list";

/**
 * Figma: Results header → View toggle — white 40px box (radius 12, padding 3)
 * with Grid / List icon buttons; the active one sits on a brand-subtle pad
 * that slides between them.
 */
export function ViewToggle({ value, onChange }: { value: ResultsView; onChange: (v: ResultsView) => void }) {
  return (
    <div role="radiogroup" aria-label="Results view" className="relative flex h-10 items-center gap-0.5 rounded-[12px] border border-line bg-surface-card p-[3px]">
      <span
        aria-hidden
        className={cn(
          "absolute left-[3px] top-[3px] h-8 w-8 rounded-[8px] bg-brand-subtle transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
          value === "list" && "translate-x-[34px]"
        )}
      />
      {(["grid", "list"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={v === "grid" ? "Grid view" : "List view"}
          onClick={() => onChange(v)}
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors",
            value === v ? "text-brand" : "text-ink-secondary hover:text-ink"
          )}
        >
          {v === "grid" ? <Category size={18} color="currentColor" /> : <RowVertical size={18} color="currentColor" />}
        </button>
      ))}
    </div>
  );
}
