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
    <div className={cn("relative", className)}>
      <div aria-hidden inert className="pointer-events-none select-none opacity-60 blur-[3px] saturate-50 transition-all duration-500">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div className="kyc-in flex max-w-sm flex-col items-center gap-2 rounded-xl border border-line bg-surface-card px-6 py-5 text-center shadow-xl">
          <span
            className={cn(
              "kyc-pop flex h-12 w-12 items-center justify-center rounded-full shadow-glow",
              planLock ? "bg-premium-fg text-white" : "bg-brand-gradient text-ink-on-brand"
            )}
          >
            {planLock ? <Crown1 size={22} color="currentColor" /> : <Lock1 size={22} color="currentColor" variant="Bold" />}
          </span>
          <p className="text-label-lg text-ink">{planLock ? title ?? "A Gold feature" : title ?? "Unlocks after your profile is approved"}</p>
          <p className="text-body-sm text-ink-secondary">
            {planLock
              ? text ?? "Upgrade to Gold or Platinum to unlock this."
              : status === "changes"
              ? "Fix the flagged details above and resubmit to unlock this."
              : "We’re reviewing your profile. This usually takes less than 24 hours."}
          </p>
          {planLock && (
            <ButtonLink href="/plans" size="sm" className="mt-1" leftIcon={<Crown1 size={16} color="currentColor" />}>
              Upgrade to Gold
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
