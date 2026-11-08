"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Figma: OTP Input (State = Empty / Filling / Error / Success)
 * Six boxes; typing moves forward, Backspace moves back, paste fills all.
 */
export type OtpState = "default" | "error" | "success";

export interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  state?: OtpState;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({ value, onChange, length = 6, state = "default", disabled, autoFocus }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const activeIndex = Math.min(value.length, length - 1);

  const setAt = (i: number, d: string) => {
    const arr = digits.slice();
    arr[i] = d;
    onChange(arr.join("").slice(0, length));
  };

  return (
    <div className={cn("flex justify-center gap-2 sm:gap-3", state === "error" && "animate-shake")} role="group" aria-label="Verification code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          maxLength={1}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (!v) return;
            setAt(i, v.slice(-1));
            refs.current[Math.min(i + 1, length - 1)]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (digits[i]) setAt(i, "");
              else if (i > 0) {
                setAt(i - 1, "");
                refs.current[i - 1]?.focus();
              }
            }
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (p) {
              e.preventDefault();
              onChange(p);
              refs.current[Math.min(p.length, length - 1)]?.focus();
            }
          }}
          className={cn(
            "h-14 w-11 rounded-md border text-center text-h4 outline-none transition-all sm:w-[52px]",
            "focus:border-brand focus:shadow-ring-brand",
            state === "error" && "border-error-line bg-error-bg text-error-fg focus:shadow-ring-error",
            state === "success" && "border-success-fg bg-success-bg text-ink",
            state === "default" && (d ? "border-brand-focus bg-brand-subtle text-ink" : "border-line-strong bg-surface-card"),
            state === "default" && i === activeIndex && !d && "border-brand",
            disabled && "cursor-not-allowed opacity-60"
          )}
        />
      ))}
    </div>
  );
}
