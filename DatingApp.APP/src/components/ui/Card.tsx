import React from "react";
import { cn } from "@/lib/cn";

/**
 * Figma card rules: surface/card + 1px border/default, radius xl for panels,
 * Shadow/SM at rest. Registration form cards are 680px wide (= Stepper).
 */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface-card", className)} {...rest}>
      {children}
    </div>
  );
}

/** Centred title block used at the top of every auth card. */
export function CardTitle({ title, subtitle, className }: { title: React.ReactNode; subtitle?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <h1 className="text-h3 text-ink md:text-h2">{title}</h1>
      {subtitle && <p className="mx-auto mt-2 max-w-[600px] text-body-sm text-ink-secondary sm:text-body-md">{subtitle}</p>}
    </div>
  );
}

/** "— or —" divider */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-body-xs text-ink-tertiary">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
