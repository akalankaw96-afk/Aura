"use client";

import React, { useId } from "react";
import { InfoCircle, MagicStar } from "iconsax-react";
import { cn } from "@/lib/cn";

/** Figma: Textarea (State = Default / Focus / Filled / Error) with counter. */
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  label?: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  helper?: React.ReactNode;
  error?: React.ReactNode;
}

export function Textarea({ label, hint, value, onChange, maxLength = 500, helper, error, rows = 4, className, ...rest }: TextareaProps) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-2">
      {(label || hint) && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-label-md text-ink">
            {label}
          </label>
          {hint && <span className="text-body-xs text-ink-tertiary">{hint}</span>}
        </div>
      )}
      <div
        className={cn(
          "rounded-md border bg-surface-card px-3.5 pb-2 pt-3 transition-all",
          "focus-within:border-brand-focus focus-within:shadow-ring-brand",
          error ? "border-error-line focus-within:border-error-line focus-within:shadow-ring-error" : "border-line-strong [&:not(:focus-within)]:hover:border-ink-tertiary"
        )}
      >
        <textarea
          id={id}
          rows={rows}
          value={value}
          maxLength={maxLength}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          className={cn("w-full resize-none bg-transparent text-body-md text-ink outline-none", className)}
          {...rest}
        />
        <p className="text-right text-body-xs text-ink-tertiary">
          {value.length} / {maxLength}
        </p>
      </div>
      {(error || helper) && (
        <p className={cn("flex items-start gap-1.5 text-body-xs", error ? "text-error-fg" : "text-ink-secondary")}>
          {error ? <InfoCircle size={16} color="currentColor" className="shrink-0" /> : <MagicStar size={16} color="currentColor" className="text-brand shrink-0" />}
          <span>{error ?? helper}</span>
        </p>
      )}
    </div>
  );
}
