"use client";

import React, { useId } from "react";
import { cn } from "@/lib/cn";

/** Figma: Checkbox (Checked = True / False) */
export interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
  error?: boolean;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, children, error, className, disabled }: CheckboxProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-2.5 text-body-sm text-ink-secondary", disabled && "cursor-not-allowed opacity-60", className)}>
      <span className="relative mt-px flex h-5 w-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 cursor-pointer opacity-0"
        />
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-[6px] border transition-colors peer-focus-visible:shadow-ring-brand",
            checked ? "border-brand-strong bg-brand-gradient" : error ? "border-error-line bg-error-bg" : "border-line-strong bg-surface-card"
          )}
        >
          {checked && (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-white" fill="none">
              <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </span>
      <span className="leading-5">{children}</span>
    </label>
  );
}
