"use client";

import { favouriteProfile, useFavourites } from "@/lib/connections";
import React, { useState } from "react";
import Link from "next/link";
import { Book1, Heart, LanguageSquare, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { requireMember } from "@/lib/session";
import { Flag } from "@/components/ui/Flag";
import type { MarqueeProfile } from "@/content/home";

export type ProfilePhotoCardStyle = "glass" | "card";

/**
 * Figma: Profile Photo Card (150:21863) — hero marquee, photo first.
 * 224 wide · padding 8 (bottom 12) · gap 12 · radius xl · glass fill + border + blur 24.
 *  - Photo 208 × 252, radius md, rose shade at the bottom
 *  - Verified pill (top-left) + Shortlist button (top-right, 32 round)
 *  - Name, age + country flag (Heading/H6) and location (Caption) on the photo
 *  - Religion + Language tags (Label/SM, glass pills)
 * Hover (State = Hover): glass 24 %, white border 60 %, deep shadow, lift,
 * photo zooms slightly and the shortlist button turns brand.
 *
 * Style = Card — same details in the Category Card style (white card,
 * full-bleed photo, success "Verified" badge, no shortlist button).
 */
export function ProfilePhotoCard({ profile, variant = "glass", className, href }: { profile: MarqueeProfile; variant?: ProfilePhotoCardStyle; className?: string; /** opens the profile details page */ href?: string }) {
  const card = variant === "card" ? <ProfilePhotoCardSolid profile={profile} className={className} /> : <ProfilePhotoCardGlass profile={profile} className={className} />;
  if (!href) return card;
  return (
    <Link href={href} aria-label={`View ${profile.name}, ${profile.age}, ${profile.id}`} className="block shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus">
      {card}
    </Link>
  );
}

function ProfilePhotoCardGlass({ profile, className }: { profile: MarqueeProfile; className?: string }) {
  const { profiles, save } = useFavourites();
  const saved = profiles.some((entry) => entry.id === profile.id);

  return (
    <article
      className={cn(
        "group/card flex w-[224px] shrink-0 flex-col gap-3 rounded-xl border border-line-glass bg-surface-glass px-2 pb-3 pt-2 text-ink-on-brand backdrop-blur-[24px]",
        "transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.24)] hover:shadow-[0_20px_32px_-8px_rgba(23,3,13,0.35)]",
        className,
      )}
    >
      <div className="relative h-[252px] overflow-hidden rounded-md bg-rose-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photo}
          alt={`${profile.name}, ${profile.age}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.06]"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[150px] bg-[linear-gradient(180deg,rgba(42,6,18,0)_0%,rgba(42,6,18,0.55)_55%,rgba(42,6,18,0.92)_100%)]" />

        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[rgba(23,3,13,0.42)] py-1 pl-1.5 pr-2 text-label-sm backdrop-blur-[8px]">
          <Verify size={14} color="currentColor" variant="Bold" className="text-gold-300" /> Verified
        </span>

        <button
          type="button"
          aria-label={saved ? `Remove ${profile.name} from shortlist` : `Shortlist ${profile.name}`}
          aria-pressed={saved}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (requireMember("shortlist profiles")) save(favouriteProfile(profile));
          }}
          className={cn(
            "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-[8px] transition-all duration-300 active:scale-90",
            saved || "group-hover/card:border-transparent group-hover/card:bg-brand",
            saved ? "border-transparent bg-brand" : "border-line-glass bg-[rgba(23,3,13,0.42)]",
          )}
        >
          <Heart size={16} color="currentColor" variant={saved ? "Bold" : "Outline"} className={cn("transition-transform", saved && "scale-110")} />
        </button>

        <div className="absolute inset-x-3 bottom-3 flex flex-col gap-0.5">
          <p className="flex items-center gap-1.5 text-h6">
            <span className="truncate">
              {profile.name}, {profile.age}
            </span>
            <Flag country={profile.country} className="h-4 w-[18px] shrink-0" />
          </p>
          <p className="truncate text-caption text-ink-on-brand-muted">{profile.location}</p>
        </div>
      </div>

      <ul className="flex gap-1.5 px-1">
        <Tag icon={<Book1 size={14} color="currentColor" />} label="Religion" value={profile.religion} />
        <Tag icon={<LanguageSquare size={14} color="currentColor" />} label="Language" value={profile.language} />
      </ul>
    </article>
  );
}

function Tag({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="inline-flex items-center gap-1 rounded-full border border-line-glass-subtle bg-surface-glass px-2.5 py-1 text-label-sm" title={label}>
      {icon}
      <span className="sr-only">{label}: </span>
      {value}
    </li>
  );
}

/**
 * Figma: Profile Photo Card (Style = Card) — 240 wide, radius lg, border default,
 * Shadow/SM (hover: border focus, Shadow/LG, name turns brand, photo zooms).
 *  - Photo 240 × 232, padding 12, success Badge "Verified"
 *  - Body padding 16, gap 4: Name, age + flag (H5) · location (Body/SM) · tags (brand-subtle pills)
 */
function ProfilePhotoCardSolid({ profile, className }: { profile: MarqueeProfile; className?: string }) {
  return (
    <article
      className={cn(
        "group/card flex w-[240px] shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-surface-card text-ink shadow-sm",
        "transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-brand-focus hover:shadow-lg",
        className,
      )}
    >
      <div className="relative h-[232px] overflow-hidden bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photo}
          alt={`${profile.name}, ${profile.age}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.06]"
        />
        <span className="on-photo absolute left-3 top-3 inline-flex h-[22px] items-center gap-1 rounded-full bg-success-bg px-2 text-label-sm text-success-fg">
          <Verify size={14} color="currentColor" /> Verified
        </span>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <p className="flex items-center gap-2 text-h5 transition-colors group-hover/card:text-brand-text">
          <span className="truncate">
            {profile.name}, {profile.age}
          </span>
          <Flag country={profile.country} className="h-4 w-[18px] shrink-0" />
        </p>
        <p className="truncate text-body-sm text-ink-secondary">{profile.location}</p>
        <ul className="flex gap-1.5 pt-2">
          <SolidTag icon={<Book1 size={14} color="currentColor" />} label="Religion" value={profile.religion} />
          <SolidTag icon={<LanguageSquare size={14} color="currentColor" />} label="Language" value={profile.language} />
        </ul>
      </div>
    </article>
  );
}

function SolidTag({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-1 text-label-sm text-brand-text" title={label}>
      {icon}
      <span className="sr-only">{label}: </span>
      {value}
    </li>
  );
}
