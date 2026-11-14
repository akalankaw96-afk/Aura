"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight2 } from "iconsax-react";
import { Chip } from "@/components/ui/Chip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/context/LanguageContext";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { useRouter } from "next/navigation";
import { FEATURED, type FeaturedProfile } from "@/content/home";
import { sendInterest, toFeatured, useMemberProfiles } from "@/lib/profiles";

/**
 * Figma: 04 Featured profiles — padding 48/80/96, gap 48.
 * Header row (left header + All/Brides/Grooms chips), 4-column grid
 * (gap 32), "View all proposals" button (Button L, gradient).
 * Mobile: one card per view, horizontal swipe.
 */
export function FeaturedProfiles() {
  const toast = useToast();
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState<"all" | "bride" | "groom">("all");
  // Public home page: the 8 most recent approved members (empty until profiles are approved)
  const { profiles } = useMemberProfiles({ verifiedOnly: true });
  const members = useMemo(() => profiles.slice(0, 8).map(toFeatured), [profiles]);
  const list = useMemo(() => members.filter((p) => filter === "all" || p.gender === filter), [members, filter]);

  const router = useRouter();
  // Profile details open as a full page (search results list + profile)
  const handleOpenDetail = (p: FeaturedProfile) => router.push(`/search?for=${p.gender}&id=${p.id}&from=home`);

  if (members.length === 0) return null;

  return (
    <section id="profiles" className="scroll-mt-28 overflow-hidden pb-16 pt-12 lg:pb-24">
      <div className="container-page flex flex-col gap-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader align="left" eyebrow={t.featured.eyebrow} title={t.featured.title} description={t.featured.subtitle} className="max-md:mx-auto max-md:items-center max-md:text-center" />
          <div role="tablist" aria-label="Show" className="flex justify-center gap-2">
            {(
              [
                ["all", t.hero.all, "/brand/couple.png"],
                ["bride", t.hero.brides, "/brand/bride.png"],
                ["groom", t.hero.grooms, "/brand/groom.png"],
              ] as const
            ).map(([value, label, avatar]) => (
              <Chip key={value} role="tab" aria-selected={filter === value} selected={filter === value} avatar={avatar} onClick={() => setFilter(value)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="reveal-stagger -mx-page-x flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto px-page-x pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {list.map((p) => (
            <div key={p.id} className="w-[85%] shrink-0 snap-center sm:w-auto">
              <ProfileCard
                profile={p}
                onView={handleOpenDetail}
                onInterest={async () => {
                  const r = await sendInterest(p);
                  if (r.ok) toast.success("Interest sent", r.message);
                  else toast.error("Interest not sent", r.message);
                  return r.ok;
                }}
                onShortlist={(pr, saved) =>
                  saved
                    ? toast.success(lang === "si" ? "ලැයිස්තුවට එක් කළා" : "Added to shortlist", `${pr.id} ${lang === "si" ? "ඔබගේ ලැයිස්තුවට සුරැකිණි." : "is saved to your shortlist."}`)
                    : toast.info(lang === "si" ? "ලැයිස්තුවෙන් ඉවත් කළා" : "Removed from shortlist", `${pr.id} ${lang === "si" ? "ඉවත් කරන ලදී." : "was removed."}`)
                }
              />
            </div>
          ))}
        </div>

        <Link
          href="/search"
          className="mx-auto flex h-14 items-center gap-3 rounded-full bg-brand-gradient px-8 text-button-lg text-ink-on-brand transition-shadow hover:shadow-glow"
        >
          {lang === "si" ? "සියලුම යෝජනා බලන්න" : FEATURED.cta}
          <ArrowRight2 size={24} color="currentColor" />
        </Link>
      </div>

    </section>
  );
}
