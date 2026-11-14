"use client";

import React from "react";
import { Eye, Heart, MessageText, Star1 } from "iconsax-react";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { type StatIcon } from "@/content/dashboard";

const ICONS: Record<StatIcon, typeof Eye> = { eye: Eye, heart: Heart, star: Star1, message: MessageText };

/**
 * Figma: Dashboard → Stats — 4 cards, gap 24. Card: padding 20, gap 12, radius lg,
 * border default, Shadow/SM. Icon tile 44 (brand-subtle) + delta badge, value (H2), label, meta.
 */
export function StatsRow() {
  const { t, lang } = useLanguage();

  // Profile insights need the API (Sprint 03). No made-up numbers: show "—" until real counts exist.
  const soon = lang === "si" ? "ඉක්මනින්" : "Coming soon";
  const stats: { icon: StatIcon; value: string; label: string; meta: string; delta: string; tone: "success" | "brand" }[] = [
    { icon: "eye", value: "—", label: t.dashboard.profileViews, meta: soon, delta: "", tone: "brand" },
    { icon: "heart", value: "—", label: t.dashboard.interestsReceived, meta: soon, delta: "", tone: "brand" },
    { icon: "star", value: "—", label: t.dashboard.shortlistedYou, meta: soon, delta: "", tone: "brand" },
    { icon: "message", value: "—", label: t.dashboard.unreadMessages, meta: soon, delta: "", tone: "brand" },
  ];

  return (
    <section aria-label="Your activity" className="reveal-stagger grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
      {stats.map((s) => {
        const Icon = ICONS[s.icon];
        return (
          <article key={s.label} className="flex flex-col gap-3 rounded-lg border border-line bg-surface-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-focus hover:shadow-lg sm:p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-brand-subtle text-icon-brand">
                <Icon size={22} color="currentColor" />
              </span>
              {s.delta && <Badge tone={s.tone}>{s.delta}</Badge>}
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-h3 text-ink md:text-h2">{s.value}</p>
              <p className="text-label-lg text-ink">{s.label}</p>
              <p className="text-body-sm text-ink-tertiary">{s.meta}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
