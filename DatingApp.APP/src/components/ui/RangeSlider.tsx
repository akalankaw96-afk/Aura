"use client";

import React from "react";
import { cn } from "@/lib/cn";

/**
 * Figma: Range Slider (86:19394) — two thumbs on one track.
 * Built from two native range inputs (keyboard + screen-reader friendly),
 * styled to the Figma thumb (white, 3px brand border) and brand fill.
 */
export interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  labels?: [string, string];
  className?: string;
}

// thumb styles live in globals.css (.range-thumb) — pseudo-elements are clearer in CSS
const thumb = "range-thumb pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent outline-none";

export function RangeSlider({ min, max, value, onChange, step = 1, labels, className }: RangeSliderProps) {
  const [lo, hi] = value;
  const pct = (v: number) => ((Math.min(Math.max(v, min), max) - min) / (max - min)) * 100;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-muted" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-gradient" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          aria-label="Minimum"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
          className={cn(thumb, lo > max - (max - min) / 10 && "z-10")}
        />
        <input type="range" aria-label="Maximum" min={min} max={max} step={step} value={hi} onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])} className={thumb} />
      </div>
      {labels && (
        <div className="flex justify-between text-caption text-ink-tertiary">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
}
