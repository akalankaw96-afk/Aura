import React from "react";
import { cn } from "@/lib/cn";

/**
 * Figma: Country Flag (18 × 20). Rendered as images exported from Figma —
 * emoji flags do not show on Windows, so we never use emoji in code.
 */
export type CountryCode = "lk" | "au" | "gb" | "ca" | "qa" | "ae" | "it" | "nz" | "us";

const NAMES: Record<CountryCode, string> = {
  lk: "Sri Lanka",
  au: "Australia",
  gb: "United Kingdom",
  ca: "Canada",
  qa: "Qatar",
  ae: "UAE",
  it: "Italy",
  nz: "New Zealand",
  us: "USA",
};

export function Flag({ country, className }: { country: CountryCode; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/images/flags/${country}.png`} alt={NAMES[country]} width={18} height={20} className={cn("h-5 w-[18px] shrink-0 object-contain", className)} />
  );
}
