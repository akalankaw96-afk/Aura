"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Figma: Segmented Tab (08 · Member) — pill tabs with a count.
 * Active = brand gradient + white count chip; Default = secondary text + brand-subtle count.
 * The gradient pill slides between tabs (motion) and counts pop when they change.
 * tone="onBrand": for dark wine panels (white sliding pill, rose text). idBase links each tab to its
 * panel (`${idBase}-tab-x` ↔ `${idBase}-panel-x`); ← → Home End move between tabs.
 */
export interface SegmentedTabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
  tone = "default",
  idBase,
}: Readonly<{
  tabs: SegmentedTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
  tone?: "default" | "onBrand";
  idBase?: string;
}>) {
  const onBrand = tone === "onBrand";
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, tabs]);

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={(e) => {
        const i = tabs.findIndex((t) => t.id === value);
        const to: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in to)) return;
        e.preventDefault();
        const next = tabs[(to[e.key] + tabs.length) % tabs.length];
        onChange(next.id);
        refs.current[next.id]?.focus();
      }}
      className={cn(
        "relative flex w-fit gap-1 rounded-full p-1",
        onBrand ? "bg-[rgba(255,255,255,0.1)] ring-1 ring-inset ring-[rgba(255,255,255,0.14)]" : "bg-surface-subtle",
        className,
      )}
    >
      {pill && (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-1 top-1 rounded-full shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            onBrand ? "bg-white" : "bg-brand-gradient",
          )}
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            type="button"
            id={idBase ? `${idBase}-tab-${t.id}` : undefined}
            aria-controls={idBase ? `${idBase}-panel-${t.id}` : undefined}
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-label-md transition-colors duration-300 focus-visible:outline-none focus-visible:shadow-ring-brand",
              tabTone(onBrand, on),
              !pill && on && (onBrand ? "bg-white" : "bg-brand-gradient"),
            )}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span
                key={t.count}
                className={cn(
                  "animate-pop-in rounded-full px-1.5 text-label-sm transition-colors duration-300",
                  countTone(onBrand, on),
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function tabTone(onBrand: boolean, on: boolean) {
  if (onBrand) return on ? "text-rose-700" : "text-[rgba(255,255,255,0.85)] hover:text-white";
  return on ? "text-ink-on-brand" : "text-ink-secondary hover:text-ink";
}

function countTone(onBrand: boolean, on: boolean) {
  if (onBrand) return on ? "bg-rose-50 text-rose-700" : "bg-[rgba(255,255,255,0.18)] text-white";
  return on ? "bg-[rgba(255,255,255,0.25)] text-ink-on-brand" : "bg-brand-subtle text-brand-text";
}
