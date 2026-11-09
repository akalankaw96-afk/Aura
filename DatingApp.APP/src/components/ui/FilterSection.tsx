"use client";

import React, { useEffect, useId, useState } from "react";
import { ArrowDown2 } from "iconsax-react";
import { cn } from "@/lib/cn";

/**
 * Figma: Filter Section (Open = False / True) — 48px header row with title,
 * optional count badge and a chevron; the content folds open/closed.
 * A divider sits above every section (as in the Filters sidebar).
 */
export function FilterSection({
  title,
  count = 0,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // once fully open, let dropdowns (e.g. the District select) float outside the section
  const [settled, setSettled] = useState(defaultOpen);
  const id = useId();
  useEffect(() => {
    if (!open) setSettled(false);
  }, [open]);
  return (
    <div className="border-t border-line">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="group flex h-12 w-full items-center gap-2 text-left"
      >
        <span className="flex-1 text-label-lg text-ink transition-colors group-hover:text-brand-text">{title}</span>
        {count > 0 && (
          <span key={count} className="flex h-5 min-w-5 animate-pop-in items-center justify-center rounded-full bg-brand px-1.5 text-label-sm text-ink-on-brand">
            {count}
          </span>
        )}
        <ArrowDown2
          size={16}
          color="currentColor"
          className={cn("text-ink-secondary transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && open) setSettled(true);
        }}
      >
        <div className={cn("min-h-0", settled && open ? "overflow-visible" : "overflow-hidden")}>
          <div className="pb-4 pt-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
}
