"use client";

import React from "react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { cn } from "@/lib/cn";

/**
 * Figma: Pagination (86:19444) — 40px square-ish buttons (radius 12):
 * ‹ 1 2 3 … 273 ›. The current page uses Gradient/Brand.
 */
export function Pagination({
  page,
  pageCount,
  onChange,
  className,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const pages: (number | "…")[] = [];
  const add = (p: number | "…") => pages[pages.length - 1] !== p && pages.push(p);
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1 || (page <= 2 && p <= 3)) add(p);
    else add("…");
  }
  const base =
    "flex h-10 min-w-10 items-center justify-center rounded-[12px] px-2 text-label-md transition-all duration-200";
  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1.5", className)}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={cn(base, "border border-line bg-surface-card text-ink hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40")}
      >
        <ArrowLeft2 size={16} color="currentColor" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className={cn(base, "border border-line bg-surface-card text-ink-tertiary")}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={cn(
              base,
              p === page
                ? "bg-brand-gradient text-ink-on-brand shadow-xs"
                : "border border-line bg-surface-card text-ink hover:-translate-y-0.5 hover:border-brand hover:text-brand"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className={cn(base, "border border-line bg-surface-card text-ink hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40")}
      >
        <ArrowRight2 size={16} color="currentColor" />
      </button>
    </nav>
  );
}
