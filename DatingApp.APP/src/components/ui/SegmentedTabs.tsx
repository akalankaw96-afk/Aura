"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Figma: Segmented Tab (08 · Member) — pill tabs with a count.
 * Active = brand gradient + white count chip; Default = secondary text + brand-subtle count.
 * The gradient pill slides between tabs (motion) and counts pop when they change.
 */
export interface SegmentedTabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: SegmentedTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
}) {
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
    <div role="tablist" aria-label={label} className={cn("relative flex w-fit gap-1 rounded-full bg-surface-subtle p-1", className)}>
      {pill && (
        <span
          aria-hidden
          className="absolute bottom-1 top-1 rounded-full bg-brand-gradient shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-label-md transition-colors duration-300",
              on ? "text-ink-on-brand" : "text-ink-secondary hover:text-ink",
              !pill && on && "bg-brand-gradient",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                key={t.count}
                className={cn(
                  "animate-pop-in rounded-full px-1.5 text-label-sm transition-colors duration-300",
                  on ? "bg-[rgba(255,255,255,0.25)] text-ink-on-brand" : "bg-brand-subtle text-brand-text",
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
