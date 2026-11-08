"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight2, Book1, Briefcase, Cake, Heart, Ruler, ShieldTick, Star1, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Flag } from "@/components/ui/Flag";
import type { FeaturedProfile } from "@/content/home";

/**
 * Figma: Profile Card (16:1057) as used in "04 Featured profiles".
 * 296 × 497 · padding 8 · radius lg · border default · Shadow/SM.
 * Hover: border focus + Shadow/LG. One action: "View details" (Button Primary S, full width).
 * The heart on the photo shortlists the profile.
 */
export function ProfileCard({ profile, onShortlist }: { profile: FeaturedProfile; onShortlist?: (p: FeaturedProfile, saved: boolean) => void }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="flex flex-col rounded-lg border border-line bg-surface-card p-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-focus hover:shadow-lg">
      {/* Photo 280 × 264 */}
      <div className="relative aspect-[280/264] overflow-hidden rounded-sm bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.photo} alt={`Profile photo of ${profile.id}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-between p-3">
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-start gap-1.5">
              <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-success-bg px-2 text-label-sm text-success-fg">
                <Verify size={14} color="currentColor" /> Verified
              </span>
              {profile.horoscope && (
                <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-info-bg px-2 text-label-sm text-info-fg">
                  <Star1 size={14} color="currentColor" /> Horoscope
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label={saved ? `Remove ${profile.id} from shortlist` : `Shortlist ${profile.id}`}
              aria-pressed={saved}
              onClick={() => {
                setSaved(!saved);
                onShortlist?.(profile, !saved);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-glass-strong text-brand transition-transform hover:scale-105 active:scale-95"
            >
              <Heart size={20} color="currentColor" variant={saved ? "Bold" : "Linear"} />
            </button>
          </div>
          <span className="inline-flex h-[22px] w-fit items-center gap-1 rounded-full bg-surface-scrim px-2 text-label-sm text-ink-on-brand backdrop-blur-[8px]">
            <ShieldTick size={14} color="currentColor" /> Photo verified
          </span>
        </div>
      </div>

      {/* Body: padding 16/12/12/12, gap 16 */}
      <div className="flex flex-1 flex-col gap-4 px-3 pb-3 pt-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-h5 text-ink">{profile.id}</h3>
          <p className="flex items-center gap-1.5 text-body-sm text-ink-secondary">
            <Flag country={profile.country} />
            {profile.location}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-2 gap-y-2">
          <Detail icon={<Cake size={18} color="currentColor" />} label="Age" value={`${profile.age} years`} />
          <Detail icon={<Ruler size={18} color="currentColor" />} label="Height" value={profile.height} />
          <Detail icon={<Briefcase size={18} color="currentColor" />} label="Profession" value={profile.profession} />
          <Detail icon={<Book1 size={18} color="currentColor" />} label="Religion" value={profile.religion} />
        </dl>

        <div className="h-px bg-line" />

        {/* Figma: Actions → View profile (Button Primary S, 254 × 42) */}
        <Link
          href={`/register?profile=${profile.id}`}
          className="group/btn flex h-[42px] w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 text-button-sm text-ink-on-brand transition-shadow hover:shadow-glow"
        >
          View details <ArrowRight2 size={18} color="currentColor" className="transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="relative flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-icon-brand">{icon}</span>
      <dt className="sr-only">{label}</dt>
      <dd className={cn("truncate text-body-sm font-semibold text-ink")}>{value}</dd>
    </div>
  );
}
