"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight2, SearchNormal1 } from "iconsax-react";
import { Chip } from "@/components/ui/Chip";
import { HeroSearch } from "@/components/sections/home/Hero";
import { SEARCH_CARD } from "@/content/dashboard";

/**
 * Figma: Dashboard → Search card (highlighted) — padding 24, gap 20, radius xl,
 * 1.5px border-focus + Shadow/Brand Glow. Header (gradient icon tile, title,
 * Advanced search) + Search Bar (Layout = 2 fields) + Quick filter chips.
 */
export function SearchCard() {
  const [quick, setQuick] = useState<string[]>([]);
  const toggle = (q: string) => setQuick((list) => (list.includes(q) ? list.filter((x) => x !== q) : [...list, q]));

  return (
    <section aria-label={SEARCH_CARD.title} className="reveal relative z-20 flex flex-col gap-5 rounded-xl border-[1.5px] border-brand-focus bg-surface-card p-4 shadow-glow sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-brand-gradient text-ink-on-brand">
          <SearchNormal1 size={22} color="currentColor" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-h5 text-ink">{SEARCH_CARD.title}</h2>
          <p className="text-body-sm text-ink-secondary">{SEARCH_CARD.subtitle}</p>
        </div>
        <Link href="/register" className="hidden items-center gap-1 text-link-sm text-brand-link underline sm:flex">
          {SEARCH_CARD.advanced} <ArrowRight2 size={16} color="currentColor" />
        </Link>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
        <HeroSearch />
        <div className="flex flex-1 flex-col gap-2.5">
          <p className="text-label-sm text-ink-tertiary">{SEARCH_CARD.quickTitle}</p>
          <div className="flex flex-wrap gap-2">
            {SEARCH_CARD.quick.map((q) => (
              <Chip key={q} size="sm" selected={quick.includes(q)} onClick={() => toggle(q)} className="h-[35px] px-4">
                {q}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
