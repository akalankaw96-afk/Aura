"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight2 } from "iconsax-react";
import { Chip } from "@/components/ui/Chip";
import { ProfilePhotoCard } from "@/components/cards/ProfilePhotoCard";
import { Marquee } from "@/components/sections/home/Hero";
import { useLanguage } from "@/context/LanguageContext";
import { BEST_MATCHES } from "@/content/dashboard";
import { HERO, MARQUEE_PROFILES } from "@/content/home";

/**
 * Figma: Dashboard → Best matches — full-width band on the hero photo (same layers as
 * the dashboard hero), padding 56/0/40, gap 32. Header: eyebrow + H2 + description,
 * All / Grooms / Brides chips + View all. Then the Profile Marquee (Profile Photo Card, Style = Card).
 */
export function BestMatches() {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState<"all" | "groom" | "bride">("all");
  const list = useMemo(() => MARQUEE_PROFILES.filter((p) => filter === "all" || p.gender === filter), [filter]);

  return (
    <section id="matches" aria-label={t.dashboard.bestMatchesTitle} className="relative isolate scroll-mt-28 overflow-hidden bg-rose-950 pb-10 pt-14 text-ink-on-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={HERO.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black opacity-[0.62]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(107,5,38,0.85),rgba(222,5,71,0.35))]" />

      <div className="flex flex-col gap-8">
        <div className="container-page reveal flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-overline uppercase">{t.dashboard.bestMatches}</p>
            <h2 className="text-h3 md:text-h2">{t.dashboard.bestMatchesTitle}</h2>
            <p className="text-body-md text-ink-on-brand-muted md:text-body-lg">
              {lang === "si" ? "ඔබේ වයස, ආගම සහ ස්ථාන කැමැත්ත අනුව දිනපතා යාවත්කාලීන වේ." : BEST_MATCHES.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div role="tablist" aria-label="Show" className="flex gap-2">
              {(
                [
                  ["all", t.hero.all, "/brand/couple.png"],
                  ["groom", t.hero.grooms, "/brand/groom.png"],
                  ["bride", t.hero.brides, "/brand/bride.png"],
                ] as const
              ).map(([v, label, avatar]) => (
                <Chip key={v} role="tab" aria-selected={filter === v} selected={filter === v} avatar={avatar} onClick={() => setFilter(v)}>
                  {label}
                </Chip>
              ))}
            </div>
            <Link href="/register" className="flex items-center gap-1 text-link-sm underline">
              {lang === "si" ? "සියල්ල බලන්න" : "View all"} <ArrowRight2 size={16} color="currentColor" />
            </Link>
          </div>
        </div>

        <div className="reveal">
          <Marquee key={filter}>
            {list.map((p) => (
              <ProfilePhotoCard key={p.id} profile={p} variant="card" />
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
