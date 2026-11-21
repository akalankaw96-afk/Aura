"use client";

import React from "react";
import { Crown1, Lock1 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { useAccess } from "@/lib/verification";

/**
 * Locks a feature and shows a calm card on top of the blurred, inert content —
 * members see what's there instead of an empty page.
 *  requires="approved" (default) → locked until the profile passes review (KYC)
 *  requires="paid"               → also needs Gold / Platinum (free members see an upgrade card)
 */
export function FeatureGate({
  requires = "approved",
  title,
  text,
  className,
  children,
}: {
  requires?: "approved" | "paid";
  title?: string;
  text?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { locked, status, isPaid } = useAccess();
  const kycLock = locked;
  const planLock = !locked && requires === "paid" && !isPaid;
  if (!kycLock && !planLock) return <>{children}</>;

  return (
    // content and card share one grid cell: the section is as tall as the taller of the two, so a roomy card
    // never spills over the rows above and below
    <div className={cn("relative grid", className)}>
      <div aria-hidden inert className="pointer-events-none col-start-1 row-start-1 select-none opacity-60 blur-[3px] saturate-50 transition-all duration-500">
        {children}
      </div>
      <div className="z-10 col-start-1 row-start-1 flex items-center justify-center p-4 sm:p-6">
        <div className="kyc-in flex w-full max-w-md flex-col items-center gap-3 rounded-xl border border-line bg-surface-card px-6 py-7 text-center shadow-xl sm:px-10 sm:py-8">
          <span
            className={cn(
              "kyc-pop mb-1 flex h-14 w-14 items-center justify-center rounded-full shadow-glow",
              planLock ? "bg-premium-fg text-white" : "bg-brand-gradient text-ink-on-brand"
            )}
          >
            {planLock ? <Crown1 size={26} color="currentColor" /> : <Lock1 size={26} color="currentColor" variant="Bold" />}
          </span>
          <p className="text-h6 text-ink">{planLock ? title ?? "A Gold feature" : title ?? "Unlocks after your profile is approved"}</p>
          <p className="max-w-xs text-body-sm leading-relaxed text-ink-secondary">
            {planLock
              ? text ?? "Upgrade to Gold or Platinum to unlock this."
              : status === "changes"
              ? "Fix the flagged details above and resubmit to unlock this."
              : "We’re reviewing your profile — this usually takes less than 24 hours."}
          </p>
          {planLock && (
            <ButtonLink href="/plans" size="md" className="mt-3" leftIcon={<Crown1 size={18} color="currentColor" />}>
              Upgrade to Gold
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
