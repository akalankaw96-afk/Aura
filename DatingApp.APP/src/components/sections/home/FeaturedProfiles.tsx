"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight2 } from "iconsax-react";
import { Chip } from "@/components/ui/Chip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/context/LanguageContext";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { ProfileDetailModal, type ProposalDetail } from "@/components/profile/ProfileDetailModal";
import { FEATURED, type FeaturedProfile } from "@/content/home";

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
  const [activeModalProfile, setActiveModalProfile] = useState<ProposalDetail | null>(null);
  const list = useMemo(() => FEATURED.profiles.filter((p) => filter === "all" || p.gender === filter), [filter]);

  const handleOpenDetail = (p: FeaturedProfile) => {
    setActiveModalProfile({
      id: p.id,
      code: p.id,
      gender: p.gender,
      age: p.age,
      height: p.height,
      profession: p.profession,
      education: p.profession.includes("Doctor") ? "MBBS, Colombo" : p.profession.includes("Engineer") ? "BSc Eng (Hons)" : "Bachelor's Degree",
      location: p.location,
      country: p.country.toUpperCase(),
      religion: p.religion,
      photo: p.photo,
      bio: `Verified candidate proposal (${p.id}). Dedicated professional with family values, balanced lifestyle, and cultural harmony.`,
      aboutFamily: "Respected, traditional Sri Lankan family background with high social esteem and strong community values.",
      horoscope: p.horoscope,
      rasi: p.horoscope ? "Mesha (Aries)" : undefined,
      nakshatra: p.horoscope ? "Aswida" : undefined,
    });
  };

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
                onInterest={() => toast.success("Interest sent", `${p.id} will be notified. We’ll tell you when they reply.`)}
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

      {activeModalProfile && (
        <ProfileDetailModal
          profile={activeModalProfile}
          onClose={() => setActiveModalProfile(null)}
          onConnect={(p) => {
            toast.success("Interest Sent!", `Your introductory request has been delivered to ${p.id}.`);
          }}
        />
      )}
    </section>
  );
}
