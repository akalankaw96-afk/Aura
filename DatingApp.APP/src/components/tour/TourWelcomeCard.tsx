"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Crown1, PlayCircle } from "iconsax-react";
import { Button, LoveSticker } from "@/components/ui";
import { useAccess } from "@/lib/verification";
import { TOUR_ITEM_IDS, openTour, readTourStatus, setTourStatus } from "@/lib/tour";

/**
 * Dashboard: "Welcome to Gold — take a 2-minute tour" for approved Gold / Platinum members who
 * haven't done the tour. "Later" hides it for 3 days; finishing or skipping the tour hides it.
 * The tour can always be reopened from How to use.
 */
export function TourWelcomeCard() {
  const { isPaid, locked, plan } = useAccess();
  const [status, setStatus] = useState<ReturnType<typeof readTourStatus> | "loading">("loading");

  useEffect(() => {
    const sync = () => setStatus(readTourStatus());
    sync();
    window.addEventListener("vk-tour-status", sync);
    return () => window.removeEventListener("vk-tour-status", sync);
  }, []);

  if (locked || !isPaid || status !== null) return null;
  const planName = plan === "platinum" ? "Platinum" : "Gold";

  return (
    <section
      aria-label={`Welcome to ${planName}`}
      className="kyc-in relative isolate flex flex-col gap-4 overflow-hidden rounded-xl border border-premium-line bg-[linear-gradient(120deg,var(--color-status-premium-bg),var(--color-surface-card)_70%)] p-5 shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:p-6"
    >
      <LoveSticker variant="double" size={44} rotate={14} className="absolute -right-2 -top-3 -z-10 opacity-80 max-sm:hidden" />
      <span className="relative shrink-0 self-start sm:self-center">
        <Image src="/brand/couple.png" alt="" width={64} height={64} className="h-16 w-16 rounded-full border-4 border-surface-card object-cover shadow-md" />
        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-card bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900">
          <Crown1 size={14} color="currentColor" variant="Bold" />
        </span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-h5 text-ink">Welcome to {planName} 👑 Take a 2-minute tour</h2>
        <p className="text-body-sm text-ink-secondary">
          See how to get the most from your plan: search, interests, chat, sharing contacts and more ({TOUR_ITEM_IDS.length} quick steps).
        </p>
      </div>
      <div className="flex shrink-0 gap-2 max-sm:w-full">
        <Button variant="ghost" size="md" className="max-sm:flex-1" onClick={() => setTourStatus("later")}>
          Later
        </Button>
        <Button size="md" className="max-sm:flex-1" onClick={openTour} leftIcon={<PlayCircle size={18} color="currentColor" />}>
          Start tour
        </Button>
      </div>
    </section>
  );
}
