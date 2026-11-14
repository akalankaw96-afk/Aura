"use client";

import React from "react";
import { cn } from "@/lib/cn";

/**
 * Shared label + helper/error wrapper used by Input, Phone Field,
 * Password Field and Textarea (Figma: label 14 SemiBold, helper 12).
 */
export interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string; // right side of the label, e.g. "Optional"
  helper?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, helper, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {(label || hint) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={htmlFor} className="text-label-md text-ink">
              {label}
            </label>
          )}
          {hint && <span className="text-body-xs text-ink-tertiary">{hint}</span>}
        </div>
      )}
      {children}
      {error ? (
        <p role="alert" className="animate-fade-up text-body-xs text-error-fg">
          {error}
        </p>
      ) : helper ? (
        <p className="text-body-xs text-ink-tertiary">{helper}</p>
      ) : null}
    </div>
  );
}

/** Box styles for the 48px control shell (Figma: Input field, radius md). */
export function controlShell(state: { error?: boolean; disabled?: boolean; success?: boolean }) {
  return cn(
    "flex h-[50px] w-full items-center gap-2 rounded-md border bg-surface-card px-4 transition-all duration-150",
    "focus-within:border-brand-focus focus-within:shadow-ring-brand",
    state.error
      ? "border-error-line focus-within:border-error-line focus-within:shadow-ring-error"
      : "border-line-strong [&:not(:focus-within)]:hover:border-ink-tertiary",
    state.disabled && "pointer-events-none border-line bg-surface-muted text-ink-disabled"
  );
}
