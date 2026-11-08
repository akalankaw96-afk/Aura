"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight2, SearchNormal1 } from "iconsax-react";
import { Chip } from "@/components/ui/Chip";
import { HeroSearch } from "@/components/sections/home/Hero";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Figma: Dashboard → Search card (highlighted) — padding 24, gap 20, radius xl,
 * 1.5px border-focus + Shadow/Brand Glow. Header (gradient icon tile, title,
 * Advanced search) + Search Bar (Layout = 2 fields) + Quick filter chips.
 */
export function SearchCard() {
  const { t, lang } = useLanguage();
  const [quick, setQuick] = useState<string[]>([]);
  const toggle = (q: string) => setQuick((list) => (list.includes(q) ? list.filter((x) => x !== q) : [...list, q]));

  const quickFilters = [
    { id: "new", label: lang === "si" ? "මෙම සතියේ නව" : "New this week" },
    { id: "verified", label: lang === "si" ? "සත්‍යාපිත පමණි" : "Verified only" },
    { id: "horoscope", label: lang === "si" ? "කේන්දර සහිත" : "With horoscope" },
    { id: "colombo", label: lang === "si" ? "කොළඹ අවට" : "Near Colombo" },
    { id: "abroad", label: lang === "si" ? "විදේශගත" : "Living abroad" },
  ];

  return (
    <section aria-label={t.dashboard.quickSearch} className="reveal relative z-20 flex flex-col gap-5 rounded-xl border-[1.5px] border-brand-focus bg-surface-card p-4 shadow-glow sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-brand-gradient text-ink-on-brand">
          <SearchNormal1 size={22} color="currentColor" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-h5 text-ink">{t.dashboard.quickSearch}</h2>
          <p className="text-body-sm text-ink-secondary">{t.dashboard.searchSubtitle}</p>
        </div>
        <Link href="/register" className="hidden items-center gap-1 text-link-sm text-brand-link underline sm:flex">
          {t.dashboard.advancedSearch} <ArrowRight2 size={16} color="currentColor" />
        </Link>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
        <HeroSearch />
        <div className="flex flex-1 flex-col gap-2.5">
          <p className="text-label-sm text-ink-tertiary">{lang === "si" ? "ක්ෂණික පෙරහන්" : "Quick filters"}</p>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((q) => (
              <Chip key={q.id} size="sm" selected={quick.includes(q.id)} onClick={() => toggle(q.id)} className="h-[35px] px-4">
                {q.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
