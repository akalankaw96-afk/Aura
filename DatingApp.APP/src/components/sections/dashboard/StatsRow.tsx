import React from "react";
import { Eye, Heart, MessageText, Star1 } from "iconsax-react";
import { Badge } from "@/components/ui/Badge";
import { STATS, type StatIcon } from "@/content/dashboard";

const ICONS: Record<StatIcon, typeof Eye> = { eye: Eye, heart: Heart, star: Star1, message: MessageText };

/**
 * Figma: Dashboard → Stats — 4 cards, gap 24. Card: padding 20, gap 12, radius lg,
 * border default, Shadow/SM. Icon tile 44 (brand-subtle) + delta badge, value (H2), label, meta.
 */
export function StatsRow() {
  return (
    <section aria-label="Your activity" className="reveal-stagger grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
      {STATS.map((s) => {
        const Icon = ICONS[s.icon];
        return (
          <article key={s.label} className="flex flex-col gap-3 rounded-lg border border-line bg-surface-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-focus hover:shadow-lg sm:p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-brand-subtle text-icon-brand">
                <Icon size={22} color="currentColor" />
              </span>
              <Badge tone={s.tone}>{s.delta}</Badge>
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
