"use client";

import React from "react";
import { cn } from "@/lib/cn";

/**
 * Figma: Button (Style = Primary / Secondary / Outline, Size = S / M / L)
 * and Button Gradient. All buttons are pills (radius full).
 * Primary uses Gradient/Brand, as agreed in the design review.
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "white";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 gap-2 text-button-sm",
  md: "h-11 px-6 gap-2 text-button-md",
  lg: "h-14 px-8 gap-3 text-button-lg",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-white hover:shadow-glow active:brightness-95 disabled:bg-none disabled:bg-surface-muted disabled:text-ink-disabled disabled:shadow-none",
  secondary:
    "bg-brand-subtle text-brand hover:ring-1 hover:ring-inset hover:ring-brand disabled:bg-surface-muted disabled:text-ink-disabled disabled:ring-0",
  outline:
    "bg-surface-card text-ink ring-1 ring-inset ring-line-strong hover:bg-surface-subtle disabled:text-ink-disabled disabled:ring-line",
  ghost: "bg-transparent text-brand hover:bg-brand-subtle disabled:text-ink-disabled",
  white: "bg-surface-card text-brand hover:bg-brand-subtle disabled:text-ink-disabled",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "lg",
      leftIcon,
      rightIcon,
      loading,
      fullWidth,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:shadow-ring-brand disabled:cursor-not-allowed",
        sizes[size],
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = "Button";

/** Text link styled like Figma Link/SM. */
export function TextLink({
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "text-link-sm text-brand-link underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-ink-disabled disabled:no-underline",
        className
      )}
      {...rest}
    />
  );
}
