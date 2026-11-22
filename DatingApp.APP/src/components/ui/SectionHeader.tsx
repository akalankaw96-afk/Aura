import React from "react";
import { cn } from "@/lib/cn";

/**
 * Figma: Section Header — Eyebrow (Overline, brand) + Title (H2) +
 * Description (Body/LG). Centre aligned by default, max 720px wide.
 */
export interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  tone?: "default" | "on-brand";
  as?: "h1" | "h2";
  className?: string;
}

export function SectionHeader({ eyebrow, title, description, align = "center", tone = "default", as: Tag = "h2", className }: SectionHeaderProps) {
  const onBrand = tone === "on-brand";
  return (
    <div className={cn("reveal flex max-w-[720px] flex-col gap-3", align === "center" ? "mx-auto items-center text-center" : "items-start text-left", className)}>
      <p className={cn("text-overline uppercase", onBrand ? "text-ink-on-brand" : "text-brand-text")}>{eyebrow}</p>
      <Tag className={cn("text-h3 md:text-h2", onBrand ? "text-ink-on-brand" : "text-ink")}>{title}</Tag>
      {description && <p className={cn("text-body-md md:text-body-lg", onBrand ? "text-ink-on-brand" : "text-ink-secondary")}>{description}</p>}
    </div>
  );
}
