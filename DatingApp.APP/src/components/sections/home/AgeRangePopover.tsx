"use client";

import React, { useMemo, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { NumberField } from "@/components/ui/NumberField";

/**
 * Figma: Search Popover (Type = Age) as used in Search Bar (Open = Age) — 380px, padding 16, gap 16.
 * Typed Min / Max age (Number Field) + popular ranges + Reset / Apply (no slider).
 * Apply is disabled while the range is invalid.
 */
export const AGE_MIN = 18;
export const AGE_MAX = 70;
export type AgeRange = { min: number; max: number };

const PRESETS: { label: string; min: number; max: number }[] = [
  { label: "18 – 24", min: 18, max: 24 },
  { label: "25 – 32", min: 25, max: 32 },
  { label: "33 – 40", min: 33, max: 40 },
  { label: "40+", min: 40, max: AGE_MAX },
];

export const formatAgeRange = ({ min, max }: AgeRange) =>
  min === AGE_MIN && max === AGE_MAX ? "Any age" : max === AGE_MAX ? `${min}+` : `${min} – ${max}`;

export function AgeRangePopover({ value, onApply, className }: { value: AgeRange; onApply: (v: AgeRange) => void; className?: string }) {
  const [minText, setMinText] = useState(String(value.min));
  const [maxText, setMaxText] = useState(String(value.max));

  const min = Number(minText);
  const max = Number(maxText);

  const errors = useMemo(() => {
    const e: { min?: string; max?: string } = {};
    if (!minText) e.min = "Enter an age";
    else if (min < AGE_MIN) e.min = `Must be ${AGE_MIN} or more`;
    else if (min > AGE_MAX) e.min = `Must be ${AGE_MAX} or less`;
    if (!maxText) e.max = "Enter an age";
    else if (max > AGE_MAX) e.max = `Must be ${AGE_MAX} or less`;
    else if (!e.min && max < min) e.max = `Must be ${min} or more`;
    return e;
  }, [minText, maxText, min, max]);

  const valid = !errors.min && !errors.max;
  const set = (lo: number, hi: number) => {
    setMinText(String(lo));
    setMaxText(String(hi));
  };
  const apply = () => valid && onApply({ min, max });

  return (
    <div role="dialog" aria-label="Age range" className={className}>
      <div className="flex animate-pop-in flex-col gap-4 rounded-lg border border-line bg-surface-card p-4 text-left text-ink shadow-xl">
        <div className="grid grid-cols-2 items-start gap-3">
          <NumberField label="Min age" suffix="yrs" value={minText} onChange={setMinText} error={errors.min} onEnter={apply} />
          <NumberField label="Max age" suffix="yrs" value={maxText} onChange={setMaxText} error={errors.max} onEnter={apply} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-caption text-ink-tertiary">Popular ranges</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Chip key={p.label} size="sm" selected={valid && min === p.min && max === p.max} onClick={() => set(p.min, p.max)} className="h-[35px] px-4">
                {p.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => set(AGE_MIN, AGE_MAX)} className="text-link-sm text-brand-link underline">
            Reset
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!valid}
            className="flex h-[41px] items-center rounded-full bg-brand-gradient px-4 text-button-sm text-ink-on-brand transition-shadow hover:shadow-glow disabled:cursor-not-allowed disabled:bg-none disabled:bg-surface-muted disabled:text-ink-disabled disabled:shadow-none"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
