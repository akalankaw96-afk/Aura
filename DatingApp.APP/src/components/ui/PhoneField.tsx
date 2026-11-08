"use client";

import React, { useId } from "react";
import { ArrowDown2, Mobile, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Field, controlShell } from "./Field";

/**
 * Figma: Phone Field (State = Default / Focus / Error)
 * Country code selector + local number. Valid Sri Lankan mobiles show a green tick.
 */
export const COUNTRY_CODES = [
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
];

/** 9 digits starting with 7, e.g. 77 123 4567 */
export const isValidSriLankanMobile = (digits: string) => /^7\d{8}$/.test(digits);

/** Formats "771234567" as "77 123 4567" */
export const formatMobile = (digits: string) =>
  digits.replace(/^(\d{0,2})(\d{0,3})(\d{0,4}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));

export interface PhoneFieldProps {
  label?: string;
  value: string; // digits only
  onChange: (digits: string) => void;
  country?: string;
  onCountryChange?: (code: string) => void;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PhoneField({
  label = "Mobile number",
  value,
  onChange,
  country = "+94",
  onCountryChange,
  helper,
  error,
  disabled,
  autoFocus,
}: PhoneFieldProps) {
  const id = useId();
  const valid = country === "+94" ? isValidSriLankanMobile(value) : value.length >= 7;
  const current = COUNTRY_CODES.find((c) => c.code === country) ?? COUNTRY_CODES[0];

  return (
    <Field label={label} htmlFor={id} helper={helper} error={error}>
      <div className="flex gap-2">
        <div className={cn(controlShell({ disabled }), "relative w-[104px] shrink-0 px-3")}>
          <span className="text-body-md">{current.flag}</span>
          <span className="text-body-md font-semibold text-ink">{current.code}</span>
          <ArrowDown2 size={14} color="currentColor" className="ml-auto text-ink-tertiary" />
          <select
            aria-label="Country code"
            value={country}
            disabled={disabled}
            onChange={(e) => onCountryChange?.(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div className={controlShell({ error: !!error, disabled })}>
          <Mobile size={20} color="currentColor" className="shrink-0 text-ink-tertiary" />
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            autoFocus={autoFocus}
            disabled={disabled}
            aria-invalid={!!error}
            placeholder="7X XXX XXXX"
            value={formatMobile(value)}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, "").replace(/^0/, "").slice(0, 9))}
            className="h-full w-full min-w-0 bg-transparent text-body-lg text-ink outline-none"
          />
          {valid && !error && <TickCircle size={20} color="currentColor" className="text-success-fg shrink-0" />}
        </div>
      </div>
    </Field>
  );
}
