"use client";

import React, { useState } from "react";
import {
  Book1,
  Briefcase,
  Clock,
  Crown1,
  Gallery,
  Heart,
  HeartAdd,
  Lovely,
  People,
  Profile,
  Star1,
  Teacher,
  Verify,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { requireMember } from "@/lib/session";
import { Flag } from "@/components/ui/Flag";
import { Button } from "@/components/ui/Button";
import type { FeaturedProfile } from "@/content/home";
import { matchLabel, type ProfileExtras } from "@/content/search";

/**
 * Figma: Profile Card List (89:19962 · State = Default / Hover / Promoted).
 * 952 wide · padding 12/20/12/12 · gap 20 · radius 16. Photo 196 × 259 (radius 12)
 * with badge + "n photos"; title row, location + activity, 3 × 2 detail grid,
 * one-line bio, divider, tags + actions. Top right: Match ring + shortlist heart.
 * Hover: brand border + Shadow/LG, heart fills. Promoted: gold-50 surface.
 */
export function ProfileCardList({
  profile,
  extras,
  bio,
  promoted,
  onView,
  onInterest,
  style,
}: {
  profile: FeaturedProfile;
  extras: ProfileExtras;
  bio?: string;
  promoted?: boolean;
  onView: (p: FeaturedProfile) => void;
  /** return false when the interest couldn’t be sent (e.g. free limit reached) */
  onInterest: (p: FeaturedProfile) => boolean | void;
  style?: React.CSSProperties;
}) {
  const [saved, setSaved] = useState(false);
  const [sent, setSent] = useState(false);
  const online = extras.active === "Active now";

  return (
    <article
      style={style}
      className={cn(
        "group/card flex flex-col gap-5 rounded-lg border p-3 shadow-sm transition-all duration-300 sm:flex-row sm:pr-5",
        promoted
          ? "promo-shine border-premium-line bg-premium-bg hover:shadow-lg"
          : "border-line bg-surface-card hover:border-brand-focus hover:shadow-lg"
      )}
    >
      {/* Photo */}
      <button
        type="button"
        onClick={() => onView(profile)}
        className="relative aspect-[196/259] w-full shrink-0 overflow-hidden rounded-[12px] bg-surface-muted sm:w-[196px]"
        aria-label={`View ${profile.id}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photo}
          alt=""
          loading="lazy"
          onError={(e) => {
            // photo missing → the bride / groom illustration (Figma: photo hidden)
            const img = e.currentTarget;
            const fallback = profile.gender === "groom" ? "/brand/groom.png" : "/brand/bride.png";
            if (!img.src.endsWith(fallback)) img.src = fallback;
          }}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        />
        <span className="absolute left-2.5 top-2.5">
          {promoted ? (
            <span className="promo-badge inline-flex h-[22px] items-center gap-1 rounded-full bg-premium-bg px-2 text-label-sm text-premium-fg">
              <Crown1 size={14} color="currentColor" /> Promoted
            </span>
          ) : (
            <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-success-bg px-2 text-label-sm text-success-fg">
              <Verify size={14} color="currentColor" /> Verified
            </span>
          )}
        </span>
        <span className="absolute bottom-2.5 left-2.5 inline-flex h-[22px] items-center gap-1 rounded-full bg-surface-scrim px-2 text-label-sm text-ink-on-brand backdrop-blur-[8px]">
          <Gallery size={14} color="currentColor" /> {extras.photos} photos
        </span>
      </button>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 py-1">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="flex flex-wrap items-center gap-x-2 text-h4 text-ink">
              <button type="button" onClick={() => onView(profile)} className="transition-colors hover:text-brand-text">
                {profile.id}
              </button>
              <Verify size={20} color="currentColor" variant="Bold" className="text-gold-500" />
              <span className="text-h5 font-semibold text-ink-secondary">· {profile.age} yrs · {profile.height}</span>
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-body-md text-ink-secondary">
              <Flag country={profile.country} />
              {profile.location}
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 text-label-sm text-success-fg">
                <span className={cn("h-2 w-2 rounded-full bg-success-fg", online && "animate-pulse")} />
                {extras.active}
              </span>
            </p>
          </div>
          <MatchPill pct={extras.match} />
          <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? `Remove ${profile.id} from shortlist` : `Shortlist ${profile.id}`}
            onClick={() => requireMember("shortlist profiles") && setSaved((v) => !v)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-border bg-surface-card text-brand transition-transform hover:scale-105 active:scale-95"
          >
            <Heart
              size={22}
              color="currentColor"
              variant={saved ? "Bold" : "Linear"}
              className={cn("transition-transform", saved && "animate-pop-in")}
            />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 md:grid-cols-3">
          <Detail icon={<Briefcase size={18} color="currentColor" />} label="Profession" value={profile.profession} />
          <Detail icon={<Teacher size={18} color="currentColor" />} label="Education" value={extras.education} />
          <Detail icon={<Book1 size={18} color="currentColor" />} label="Religion" value={profile.religion} />
          <Detail icon={<People size={18} color="currentColor" />} label="Ethnicity" value={extras.ethnicity} />
          <Detail icon={<Lovely size={18} color="currentColor" />} label="Civil status" value={extras.civil} />
          <Detail icon={<Profile size={18} color="currentColor" />} label="Posted by" value={extras.postedBy} />
        </dl>

        {bio && <p className="truncate text-body-sm text-ink-secondary">“{bio}”</p>}

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {profile.horoscope && (
            <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-info-bg px-2.5 text-label-sm text-info-fg">
              <Star1 size={14} color="currentColor" /> Horoscope
            </span>
          )}
          {/* posted time — list (landscape) card only */}
          <span title={`Posted on ${extras.postedAt}`} className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-surface-subtle px-2.5 text-label-sm text-ink-secondary">
            <Clock size={14} color="currentColor" className="text-icon-brand" />
            {extras.posted}
            <span aria-hidden className="text-ink-disabled">·</span>
            <span className="text-ink-tertiary">{extras.postedAt}</span>
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="md" className="rounded-full" onClick={() => onView(profile)}>
              View profile
            </Button>
            <Button
              variant="primary"
              size="md"
              className="rounded-full"
              disabled={sent}
              leftIcon={<HeartAdd size={18} color="currentColor" />}
              onClick={() => {
                if (!requireMember("send an interest")) return;
                if (onInterest(profile) !== false) setSent(true);
              }}
            >
              {sent ? "Interest sent" : "Send interest"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-surface-subtle text-icon-brand">{icon}</span>
      <div className="min-w-0">
        <dt className="text-caption text-ink-tertiary">{label}</dt>
        <dd className="truncate text-label-md text-ink">{value}</dd>
      </div>
    </div>
  );
}

/** Figma: Match pill — ring with % + label + "n of 10 preferences" */
export function MatchPill({ pct }: { pct: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="hidden shrink-0 items-center gap-2 rounded-full bg-brand-subtle py-1.5 pl-1.5 pr-4 lg:flex">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-card">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-brand-ring" />
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            className="match-ring text-brand"
            style={{ ["--ring-from" as string]: c, ["--ring-to" as string]: c * (1 - pct / 100) } as React.CSSProperties}
          />
        </svg>
        <span className="relative text-label-sm font-bold text-ink">{pct}%</span>
      </span>
      <span className="leading-tight">
        <span className="block text-label-md text-brand-text">{matchLabel(pct)}</span>
        <span className="block text-caption text-ink-tertiary">{Math.round(pct / 10)} of 10 preferences</span>
      </span>
    </div>
  );
}
