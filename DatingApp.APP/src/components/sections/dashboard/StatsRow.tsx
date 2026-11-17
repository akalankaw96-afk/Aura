"use client";

import React from "react";
import Link from "next/link";
import { Eye, Heart, MessageText, Star1 } from "iconsax-react";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { type StatIcon } from "@/content/dashboard";
import { useDashboard } from "@/lib/dashboard";
import { timeAgo } from "@/lib/connections";
import { profileKey } from "@/lib/profiles";

const ICONS: Record<StatIcon, typeof Eye> = { eye: Eye, heart: Heart, star: Star1, message: MessageText };

/**
 * Figma: Dashboard → Stats — 4 cards, gap 24. Card: padding 20, gap 12, radius lg,
 * border default, Shadow/SM. Icon tile 44 (brand-subtle) + delta badge, value (H2), label, meta.
 * Numbers from GET /api/me/dashboard (S03-T09). Below: "Who viewed you" — the latest viewers (Gold / Platinum;
 * the whole row sits behind the paid FeatureGate on the dashboard page).
 */
export function StatsRow() {
  const { t } = useLanguage();
  const { data } = useDashboard();
  const n = (v: number | undefined) => (data ? (v ?? 0).toLocaleString() : "—");

  const stats: { icon: StatIcon; value: string; label: string; meta: string; delta: string; tone: "success" | "brand"; href: string }[] = [
    {
      icon: "eye",
      value: n(data?.profileViewers),
      label: t.dashboard.profileViews,
      meta: data ? `${data.profileViewersThisWeek} this week` : "Loading…",
      delta: data && data.profileViewersThisWeek > 0 ? `+${data.profileViewersThisWeek}` : "",
      tone: "success",
      href: "#viewers",
    },
    {
      icon: "heart",
      value: n(data?.interestsReceived),
      label: t.dashboard.interestsReceived,
      meta: data ? (data.interestsWaiting > 0 ? `${data.interestsWaiting} waiting for you` : `${data.matches} matched`) : "Loading…",
      delta: data && data.interestsWaiting > 0 ? `${data.interestsWaiting} new` : "",
      tone: "brand",
      href: "/friends?tab=received",
    },
    {
      icon: "star",
      value: n(data?.shortlistedBy),
      label: t.dashboard.shortlistedYou,
      meta: "Members who saved your profile",
      delta: "",
      tone: "brand",
      href: "/search",
    },
    {
      icon: "message",
      value: n(data?.unreadMessages),
      label: t.dashboard.unreadMessages,
      meta: data ? (data.unreadChats > 0 ? `In ${data.unreadChats} chat${data.unreadChats === 1 ? "" : "s"}` : "You’re all caught up") : "Loading…",
      delta: "",
      tone: "brand",
      href: "/messages",
    },
  ];

  const viewers = data?.recentViewers ?? [];

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Your activity" className="reveal-stagger grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = ICONS[s.icon];
          return (
            <Link
              key={s.label}
              href={s.href}
              className="flex flex-col gap-3 rounded-lg border border-line bg-surface-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-focus hover:shadow-lg focus-visible:shadow-ring-brand sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-brand-subtle text-icon-brand">
                  <Icon size={22} color="currentColor" />
                </span>
                {s.delta && <Badge tone={s.tone}>{s.delta}</Badge>}
              </div>
              <div className="flex flex-col gap-0.5">
                <p key={s.value} className="animate-pop-in text-h3 text-ink md:text-h2">{s.value}</p>
                <p className="text-label-lg text-ink">{s.label}</p>
                <p className="text-body-sm text-ink-tertiary">{s.meta}</p>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Who viewed you — latest viewers (names for Gold / Platinum) */}
      {data && !data.viewersLocked && (
        <section id="viewers" aria-label="Who viewed you" className="flex scroll-mt-28 flex-col gap-3 rounded-lg border border-line bg-surface-card p-4 shadow-sm sm:p-5">
          <h2 className="text-h6 text-ink">Who viewed you</h2>
          {viewers.length === 0 ? (
            <p className="text-body-sm text-ink-tertiary">Nobody has opened your profile yet. Members who view it will appear here.</p>
          ) : (
            <ul className="flex gap-4 overflow-x-auto pb-1">
              {viewers.map((v) => (
                <li key={v.profile.id} className="shrink-0">
                  <Link
                    href={`/search?id=${encodeURIComponent(v.profile.id)}&for=${v.profile.gender === "female" ? "bride" : "groom"}&from=dashboard`}
                    className="flex w-[92px] flex-col items-center gap-1.5 rounded-md p-1 text-center transition-colors hover:bg-surface-subtle"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.profile.photoUrl || (v.profile.gender === "female" ? "/brand/bride.png" : "/brand/groom.png")} alt="" className="h-16 w-16 rounded-full bg-surface-muted object-cover" />
                    <span className="w-full truncate text-label-md text-ink">{(v.profile.details?.displayName || v.profile.name || profileKey(v.profile)).split(" ")[0]}</span>
                    <span className="text-caption text-ink-tertiary">{timeAgo(v.lastViewedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
