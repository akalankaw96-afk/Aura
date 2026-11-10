"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AddCircle, Crown1, Lock1, Lovely, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { DASH_HERO } from "@/content/dashboard";
import { HERO } from "@/content/home";
import { useLanguage } from "@/context/LanguageContext";
import { useAccess } from "@/lib/verification";
import { useAuthSession } from "@/lib/session";

/**
 * Figma: Dashboard → Hero — 1280 wide, padding 48, gap 40, radius 2xl.
 * Hero photo + black 62 % + brand gradient (left → right), welcome copy + CTAs,
 * and a glass "Profile strength" card (340 wide).
 */
export function DashboardHero() {
  const { t, lang } = useLanguage();
  const { locked, isPaid, plan } = useAccess();
  const { firstName, hasCompletedProfile } = useAuthSession();
  const [hello, setHello] = useState("Welcome");

  useEffect(() => {
    const h = new Date().getHours();
    if (lang === "si") {
      setHello(h < 12 ? t.dashboard.goodMorning : h < 17 ? t.dashboard.goodAfternoon : t.dashboard.goodEvening);
    } else {
      setHello(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    }
  }, [lang, t]);

  return (
    <section aria-label="Welcome" className="relative isolate overflow-hidden rounded-2xl bg-rose-950 text-ink-on-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={HERO.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black opacity-[0.62]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(107,5,38,0.85),rgba(222,5,71,0.35))]" />

      <div className="flex flex-col gap-8 p-6 sm:p-10 lg:flex-row lg:items-center lg:gap-10 lg:p-12">
        <div className="flex flex-1 flex-col gap-4">
          <div className="enter flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line-glass bg-surface-glass py-1.5 pl-2.5 pr-3 text-label-sm backdrop-blur-[8px]">
              <Lovely size={16} color="currentColor" /> {t.dashboard.eyebrow}
            </span>
            {/* paid members: plan badge */}
            {!locked && isPaid && (
              <span className="kyc-pop inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] py-1.5 pl-2.5 pr-3 text-label-sm font-bold text-gold-900 shadow-md">
                <Crown1 size={16} color="currentColor" /> {plan === "platinum" ? "Platinum" : "Gold"} member
              </span>
            )}
          </div>
          <h1 className="enter text-h2 md:text-display-lg" style={{ "--enter-delay": "80ms" } as React.CSSProperties}>
            {hello}, {firstName}
          </h1>
          <p className="enter text-body-md text-ink-on-brand-muted md:text-body-lg" style={{ "--enter-delay": "160ms" } as React.CSSProperties}>
            {locked
              ? lang === "si"
                ? "ඔබේ පැතිකඩ සමාලෝචනය වෙමින් පවතී — අතරතුර ඔබේ පාලක පුවරුව බලන්න."
                : !hasCompletedProfile
                ? "Please complete your candidate profile to activate personalized match recommendations."
                : "Your profile is being reviewed — take a look around while we get your matches ready."
              : lang === "si"
              ? `අද දිනයේ නව ගැළපීම් 12ක් සහ යෝජනා 3ක් ඔබ වෙනුවෙන් සූදානම්ව ඇත.`
              : DASH_HERO.subtitle}
          </p>
          <div className="enter flex flex-wrap gap-3 pt-2" style={{ "--enter-delay": "240ms" } as React.CSSProperties}>
            {locked ? (
              <span
                aria-disabled
                title="Unlocks after your profile is approved"
                className="flex h-11 cursor-not-allowed items-center gap-2 rounded-full bg-[rgba(255,255,255,0.18)] px-6 text-button-md text-ink-on-brand-muted"
              >
                <Lock1 size={16} color="currentColor" /> {t.dashboard.seeMatches}
              </span>
            ) : (
              <Link href={DASH_HERO.primary.href} className="flex h-11 items-center rounded-full bg-brand-gradient px-6 text-button-md text-ink-on-brand transition-shadow hover:shadow-glow">
                {t.dashboard.seeMatches}
              </Link>
            )}
            <Link
              href={hasCompletedProfile ? "/register/status" : "/register"}
              className="flex h-11 items-center rounded-full bg-brand-subtle px-6 text-button-md text-brand-text ring-1 ring-inset ring-brand"
            >
              {hasCompletedProfile ? "View Status" : t.dashboard.completeProfile}
            </Link>
          </div>
        </div>

        <ProfileStrength />
      </div>
    </section>
  );
}

/** Figma: Hero → Profile strength — glass card, 340 wide, padding 20, gap 16, radius xl */
function ProfileStrength() {
  const { t, lang } = useLanguage();
  const { locked, isPaid, plan } = useAccess();
  const { fullName, firstName, photoUrl, profileCode, hasCompletedProfile, isVerified } = useAuthSession();

  const targetStrength = isVerified ? 100 : hasCompletedProfile ? 70 : 35;
  const [w, setW] = useState(0);

  useEffect(() => {
    const tTimer = window.setTimeout(() => setW(targetStrength), 500);
    return () => window.clearTimeout(tTimer);
  }, [targetStrength]);

  const todoLabels: Record<string, string> = {
    "Personal details": lang === "si" ? "පුද්ගලික තොරතුරු" : "Personal details",
    "Family & partner preferences": lang === "si" ? "පවුලේ තොරතුරු සහ කැමැත්ත" : "Family & partner preferences",
    "Upload photo (verified)": lang === "si" ? "සත්‍යාපිත ඡායාරූපය" : "Upload photo (verified)",
    "Add horoscope for better matches": lang === "si" ? "කේන්දර සටහන එක් කරන්න" : "Add horoscope for better matches",
    "Google account connected": lang === "si" ? "Google ගිණුම සම්බන්ධයි" : "Google account connected",
    "Profile submitted": lang === "si" ? "පැතිකඩ යොමු කරන ලදී" : "Profile submitted",
    "Safety review in progress": lang === "si" ? "ආරක්ෂක සමාලෝචනය සිදුවෙමින් පවතී" : "Safety review in progress",
    "Account verified": lang === "si" ? "ගිණුම සත්‍යාපිතයි" : "Account verified",
    "Profile live": lang === "si" ? "පැතිකඩ සක්‍රීයයි" : "Profile live",
  };

  const dynamicTodos = isVerified
    ? [
        { done: true, label: "Account verified" },
        { done: true, label: "Profile live" },
        { done: false, label: "Add horoscope for better matches" },
      ]
    : hasCompletedProfile
    ? [
        { done: true, label: "Google account connected" },
        { done: true, label: "Profile submitted" },
        { done: false, label: "Safety review in progress" },
      ]
    : [
        { done: true, label: "Google account connected" },
        { done: false, label: "Personal details" },
        { done: false, label: "Upload photo (verified)" },
      ];

  const displayPhoto = photoUrl || "";
  const displayId = profileCode || (hasCompletedProfile ? "AM-PENDING" : "NEW MEMBER");

  return (
    <aside
      aria-label="Profile strength"
      className="enter flex w-full flex-col gap-4 rounded-xl border border-line-glass bg-surface-glass p-5 backdrop-blur-[24px] lg:w-[340px] lg:shrink-0"
      style={{ "--enter-delay": "320ms" } as React.CSSProperties}
    >
      <div className="flex items-center gap-3">
        <span className="relative shrink-0">
          {displayPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayPhoto}
              alt=""
              className={cn("h-14 w-14 rounded-full border-2 object-cover", !locked && isPaid ? "border-gold-300" : "border-white")}
            />
          ) : (
            <div className={cn("flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white font-bold text-xl border-2", !locked && isPaid ? "border-gold-300" : "border-white")}>
              {firstName[0] || "M"}
            </div>
          )}
          {!locked && isPaid && (
            <span aria-label={plan === "platinum" ? "Platinum" : "Gold"} className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold-300 text-gold-900 ring-2 ring-white">
              <Crown1 size={14} color="currentColor" />
            </span>
          )}
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-h6 truncate max-w-[200px]">{fullName || "Your Profile"}</p>
          <p className="text-caption text-ink-on-brand-muted">
            {locked ? "Pending review" : `${displayId} · ${t.featured.verified}`}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-label-md">
          <span>{t.dashboard.profileStrength}</span>
          <span>{targetStrength}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.2)]" role="progressbar" aria-valuenow={targetStrength} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gold-300 transition-[width] duration-1000 ease-out" style={{ width: `${w}%` }} />
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {dynamicTodos.map((item) => (
          <li key={item.label} className={cn("flex items-center gap-2 text-body-sm", item.done ? "text-ink-on-brand" : "text-ink-on-brand-muted")}>
            {item.done ? <TickCircle size={16} color="currentColor" variant="Bold" className="text-gold-300" /> : <AddCircle size={16} color="currentColor" />}
            {item.done ? (
              todoLabels[item.label] || item.label
            ) : (
              <Link href={hasCompletedProfile ? "/register/status" : "/register"} className="hover:text-ink-on-brand hover:underline">
                {todoLabels[item.label] || item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
