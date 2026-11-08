"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight2 } from "iconsax-react";
import { Chip } from "@/components/ui/Chip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useToast } from "@/components/ui/Toast";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { FEATURED } from "@/content/home";

/**
 * Figma: 04 Featured profiles — padding 48/80/96, gap 48.
 * Header row (left header + All/Brides/Grooms chips), 4-column grid
 * (gap 32), "View all proposals" button (Button L, gradient).
 * Mobile: one card per view, horizontal swipe.
 */
export function FeaturedProfiles() {
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | "bride" | "groom">("all");
  const list = useMemo(() => FEATURED.profiles.filter((p) => filter === "all" || p.gender === filter), [filter]);

  return (
    <section id="profiles" className="scroll-mt-28 overflow-hidden pb-16 pt-12 lg:pb-24">
      <div className="container-page flex flex-col gap-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader align="left" eyebrow={FEATURED.eyebrow} title={FEATURED.title} description={FEATURED.description} className="max-md:mx-auto max-md:items-center max-md:text-center" />
          <div role="tablist" aria-label="Show" className="flex justify-center gap-2">
            {(
              [
                ["all", "All", "/brand/couple.png"],
                ["bride", "Brides", "/brand/bride.png"],
                ["groom", "Grooms", "/brand/groom.png"],
              ] as const
            ).map(([value, label, avatar]) => (
              <Chip key={value} role="tab" aria-selected={filter === value} selected={filter === value} avatar={avatar} onClick={() => setFilter(value)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="-mx-page-x flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto px-page-x pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {list.map((p) => (
            <div key={p.id} className="w-[85%] shrink-0 snap-center sm:w-auto">
              <ProfileCard profile={p} onInterest={() => toast.success("Interest sent", `${p.id} will be notified. We’ll tell you when they reply.`)} />
            </div>
          ))}
        </div>

        <Link
          href="/register"
          className="mx-auto flex h-14 items-center gap-3 rounded-full bg-brand-gradient px-8 text-button-lg text-ink-on-brand transition-shadow hover:shadow-glow"
        >
          {FEATURED.cta}
          <ArrowRight2 size={24} color="currentColor" />
        </Link>
      </div>
    </section>
  );
}
