"use client";

import React, { useId } from "react";
import { cn } from "@/lib/cn";
import { controlShell } from "./Field";

/**
 * Figma: Number Field (State = Default / Focus / Error) — 🧩 Components → 02 · Forms & search.
 * Typed whole number with a unit suffix (e.g. "25 yrs"). Opens the numeric
 * keyboard on mobile. The value is a string so users can clear and retype;
 * validate in the parent and pass `error`.
 */
export interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  maxLength?: number;
  onEnter?: () => void;
  className?: string;
}

export function NumberField({ label, value, onChange, suffix, helper, error, maxLength = 3, onEnter, className }: NumberFieldProps) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={id} className="text-label-md text-ink">
        {label}
      </label>
      <div className={controlShell({ error: !!error })}>
        <input
          id={id}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={maxLength}
          value={value}
          aria-invalid={!!error}
          aria-describedby={error || helper ? `${id}-help` : undefined}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
          className="h-full w-full min-w-0 bg-transparent text-body-md text-ink outline-none"
        />
        {suffix && <span className="shrink-0 text-body-sm text-ink-tertiary">{suffix}</span>}
      </div>
      {(error || helper) && (
        <p id={`${id}-help`} role={error ? "alert" : undefined} className={cn("text-caption", error ? "text-error-fg" : "text-ink-tertiary")}>
          {error ?? helper}
        </p>
      )}
    </div>
  );
}
