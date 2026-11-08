import React from "react";
import { Clock, CloseCircle, Crown1, Heart, InfoCircle, User, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";

/**
 * Figma: Badge (Tone = Success / Premium / Info / Brand / Neutral / Error / Warning)
 * Error and Warning were added for field-level review statuses.
 */
export type BadgeTone = "success" | "premium" | "info" | "brand" | "neutral" | "error" | "warning";

const tones: Record<BadgeTone, { cls: string; Icon: typeof Verify }> = {
  success: { cls: "bg-success-bg text-success-fg", Icon: Verify },
  premium: { cls: "bg-premium-bg text-premium-fg", Icon: Crown1 },
  info: { cls: "bg-info-bg text-info-fg", Icon: InfoCircle },
  brand: { cls: "bg-brand-subtle text-brand", Icon: Heart },
  neutral: { cls: "bg-surface-muted text-ink-secondary", Icon: User },
  error: { cls: "bg-error-bg text-error-fg", Icon: CloseCircle },
  warning: { cls: "bg-warning-bg text-warning-fg", Icon: Clock },
};

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ tone = "brand", icon = true, className, children }: BadgeProps) {
  const t = tones[tone];
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-body-xs font-semibold", t.cls, className)}>
      {icon && <t.Icon size={14} color="currentColor" />}
      {children}
    </span>
  );
}
