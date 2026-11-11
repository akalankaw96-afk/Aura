"use client";

import React from "react";
import type { Icon as IconsaxIcon } from "iconsax-react";
import { cn } from "@/lib/cn";

/**
 * Two-option switch (one choice out of two) — e.g. Email / Mobile on Login and
 * Forgot password, Upload photos / Choose an avatar in Registration.
 * Subtle track; the selected option is a brand-gradient pill that slides across,
 * with on-brand text and a Bold icon. For 3+ options or counts use `SegmentedTabs`.
 */
export interface SegmentedSwitchOption<T extends string> {
  id: T;
  label: string;
  /** Shorter label used below the `sm` breakpoint when the full one would truncate */
  shortLabel?: string;
  Icon?: IconsaxIcon;
}

export interface SegmentedSwitchProps<T extends string> {
  options: [SegmentedSwitchOption<T>, SegmentedSwitchOption<T>];
  value: T;
  onChange: (id: T) => void;
  /** Accessible name for the group, e.g. "Log in with" */
  label: string;
  disabled?: boolean;
  className?: string;
}

export function SegmentedSwitch<T extends string>({ options, value, onChange, label, disabled, className }: SegmentedSwitchProps<T>) {
  const secondOn = value === options[1].id;
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "relative grid grid-cols-2 rounded-full border border-line bg-surface-subtle p-1",
        disabled && "opacity-60",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-brand-gradient shadow-sm transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.3,0.64,1)] motion-reduce:transition-none",
          secondOn && "translate-x-full",
        )}
      />
      {options.map(({ id, label: text, shortLabel, Icon }) => {
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={cn(
              "relative flex h-11 items-center justify-center gap-2 rounded-full px-3 text-label-md transition-colors focus-visible:outline-none focus-visible:shadow-ring-brand disabled:cursor-not-allowed",
              on ? "text-ink-on-brand" : "text-ink-secondary hover:text-ink",
            )}
          >
            {Icon && <Icon size={18} color="currentColor" variant={on ? "Bold" : "Linear"} />}
            {shortLabel ? (
              <>
                <span className="truncate sm:hidden">{shortLabel}</span>
                <span className="hidden truncate sm:inline">{text}</span>
              </>
            ) : (
              <span className="truncate">{text}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
