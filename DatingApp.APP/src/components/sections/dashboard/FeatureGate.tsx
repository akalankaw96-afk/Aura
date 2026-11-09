"use client";

import React from "react";
import { Lock1 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { useKyc } from "@/lib/verification";

/**
 * Locks a dashboard feature until the profile is approved (KYC live).
 * The content stays visible but blurred + inert, with a calm lock card on top,
 * so new members can see what's coming instead of an empty page.
 */
export function FeatureGate({
  title = "Unlocks after your profile is approved",
  text = "We’re reviewing your profile — this usually takes less than 24 hours.",
  className,
  children,
}: {
  title?: string;
  text?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { locked, status } = useKyc();
  if (!locked) return <>{children}</>;
  return (
    <div className={cn("relative", className)}>
      <div aria-hidden inert className="pointer-events-none select-none opacity-60 blur-[3px] saturate-50 transition-all duration-500">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div className="kyc-in flex max-w-sm flex-col items-center gap-2 rounded-xl border border-line bg-surface-card px-6 py-5 text-center shadow-xl backdrop-blur-sm">
          <span className="kyc-pop flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-ink-on-brand shadow-glow">
            <Lock1 size={22} color="currentColor" variant="Bold" />
          </span>
          <p className="text-label-lg text-ink">{title}</p>
          <p className="text-body-sm text-ink-secondary">
            {status === "changes" ? "Fix the flagged details above and resubmit to unlock this." : text}
          </p>
        </div>
      </div>
    </div>
  );
}
