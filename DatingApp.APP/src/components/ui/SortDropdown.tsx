"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowDown2, TextalignLeft, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";

/**
 * Figma: Sort Dropdown (86:19427) — 40px white pill, "Sort by: <value>" and a
 * chevron. Opens a small menu (pop-in) with the sort options.
 */
export function SortDropdown<T extends string>({
  value,
  options,
  onChange,
  label = "Sort by",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 items-center gap-1.5 whitespace-nowrap rounded-[12px] border bg-surface-card pl-3.5 pr-2.5 text-body-sm text-ink-secondary transition-all",
          open ? "border-brand-focus shadow-ring-brand" : "border-line hover:border-line-strong"
        )}
      >
        <TextalignLeft size={16} color="currentColor" className="text-icon-muted" />
        <span className="hidden sm:inline">{label}:</span>
        <span className="font-semibold text-ink">{current?.label}</span>
        <ArrowDown2 size={14} color="currentColor" className={cn("ml-1 transition-transform duration-300", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 origin-top-right animate-pop-in rounded-[12px] border border-line bg-surface-card p-1.5 shadow-xl"
        >
          {options.map((o, i) => (
            <li key={o.value} style={{ animation: `fade-up 240ms ease-out ${i * 35}ms backwards` }}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-body-sm transition-colors",
                  o.value === value ? "bg-brand-subtle font-semibold text-brand-text" : "text-ink hover:bg-surface-subtle"
                )}
              >
                {o.label}
                {o.value === value && <TickCircle size={16} color="currentColor" variant="Bold" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
