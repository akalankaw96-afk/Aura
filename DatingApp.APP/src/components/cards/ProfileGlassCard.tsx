import React from "react";
import { Briefcase, Cake, NoteText, Ruler, Verify } from "iconsax-react";
import { Flag } from "@/components/ui/Flag";
import type { MarqueeProfile } from "@/content/home";

/**
 * Figma: Profile Card Glass (26:1390) — used in the hero marquee.
 * 232 × 155 · padding 16 · gap 12 · radius lg · glass fill + border.
 */
export function ProfileGlassCard({ profile }: { profile: MarqueeProfile }) {
  return (
    <article className="flex w-[232px] shrink-0 flex-col gap-3 rounded-lg border border-line-glass bg-surface-glass p-4 text-ink-on-brand shadow-sm backdrop-blur-[12px]">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.avatar} alt="" className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="flex items-center gap-1.5 text-label-lg">
            {profile.id}
            <Verify size={18} color="currentColor" variant="Bold" className="text-gold-300" aria-label="Verified" />
          </p>
          <p className="flex items-center gap-1.5 text-caption text-ink-on-brand-muted">
            <Flag country={profile.country} className="h-4 w-[14px]" />
            {profile.city}
          </p>
        </div>
      </div>
      <div className="h-px bg-line-glass-subtle" />
      <dl className="grid grid-cols-2 gap-x-2 gap-y-2 text-body-sm font-semibold">
        <Item icon={<Cake size={16} color="currentColor" />} label="Age" value={`${profile.age} yrs`} />
        <Item icon={<Ruler size={16} color="currentColor" />} label="Height" value={profile.height} />
        <Item icon={<Briefcase size={16} color="currentColor" />} label="Profession" value={profile.profession} />
        <Item icon={<NoteText size={16} color="currentColor" />} label="Religion" value={profile.religion} />
      </dl>
    </article>
  );
}

function Item({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="relative flex min-w-0 items-center gap-1">
      <span className="shrink-0 opacity-90">{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd className="truncate">{value}</dd>
    </div>
  );
}
