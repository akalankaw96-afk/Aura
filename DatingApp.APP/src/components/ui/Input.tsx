"use client";

import React, { useId } from "react";
import { ArrowDown2 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Field, controlShell } from "./Field";

/** Figma: Input (Type = Text, State = Default / Hover / Focus / Error / Disabled) */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, helper, error, icon, trailing, containerClassName, className, disabled, id, ...rest }, ref) => {
    const auto = useId();
    const inputId = id ?? auto;
    return (
      <Field label={label} hint={hint} htmlFor={inputId} helper={helper} error={error} className={containerClassName}>
        <div className={controlShell({ error: !!error, disabled })}>
          {icon && <span className="flex shrink-0 text-ink-tertiary">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              "h-full w-full min-w-0 bg-transparent text-body-md text-ink outline-none disabled:cursor-not-allowed",
              className
            )}
            {...rest}
          />
          {trailing}
        </div>
      </Field>
    );
  }
);
Input.displayName = "Input";

/** Figma: Input (Type = Select). Native select, styled like the input. */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  icon?: React.ReactNode;
  placeholder?: string;
  options: (string | { value: string; label: string })[];
  containerClassName?: string;
}

export function Select({
  label,
  hint,
  helper,
  error,
  icon,
  placeholder,
  options,
  containerClassName,
  className,
  disabled,
  id,
  value,
  ...rest
}: SelectProps) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <Field label={label} hint={hint} htmlFor={selectId} helper={helper} error={error} className={containerClassName}>
      <div className={cn(controlShell({ error: !!error, disabled }), "relative pr-3")}>
        {icon && <span className="flex shrink-0 text-ink-tertiary">{icon}</span>}
        <select
          id={selectId}
          disabled={disabled}
          value={value}
          aria-invalid={!!error}
          className={cn(
            "h-full w-full min-w-0 cursor-pointer appearance-none bg-transparent pr-6 text-body-md outline-none",
            value ? "text-ink" : "text-ink-disabled",
            className
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return (
              <option key={opt.value} value={opt.value} className="text-ink">
                {opt.label}
              </option>
            );
          })}
        </select>
        <ArrowDown2 size={16} color="currentColor" className="pointer-events-none absolute right-3.5 text-ink-tertiary" />
      </div>
    </Field>
  );
}
