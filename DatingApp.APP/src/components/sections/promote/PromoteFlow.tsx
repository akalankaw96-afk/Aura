"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bank, Chart, CloseCircle, Crown1, Eye, Heart, Location, Profile2User, RecordCircle, Timer1 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useAuthSession } from "@/lib/session";
import { useAccess } from "@/lib/verification";
import { BOOST, OPEN_PROMOTE_EVENT, openPromote, useBoost } from "@/lib/promotion";
import { getPlans } from "@/lib/billing";

/** Boost price from the API (admin can change it); BOOST.price until it loads. */
function useBoostPrice() {
  const [price, setPrice] = useState<number>(BOOST.price);
  useEffect(() => {
    getPlans()
      .then((all) => {
        const b = all.find((p) => p.product === "boost" && p.days === BOOST.days);
        if (b) setPrice(b.amount);
      })
      .catch(() => {});
  }, []);
  return price;
}

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const lkr = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;

const PERKS = [
  { Icon: Crown1, title: "Top of matching searches", text: "Shown in the Promoted row for members who match you." },
  { Icon: Eye, title: "Up to 10× more views", text: "A gold card with a “Promoted” badge stands out." },
  { Icon: Profile2User, title: "Only the right people", text: "Shown only to members inside your partner preferences." },
];

/* ------------------------------------------------------------------ */
/* Dashboard card — KYC approved + Pro (Gold / Platinum)               */
/* ------------------------------------------------------------------ */
/**
 * `placement` lets the dashboard show the two states in different places:
 * "top" renders only while promoted (status under the hero), "offer" only when not promoted.
 * Omit it to render whichever state applies.
 */
export function PromoteCard({ placement }: { placement?: "top" | "offer" } = {}) {
  const { locked, isPaid } = useAccess();
  const boost = useBoost();
  const price = useBoostPrice();
  const [bar, setBar] = useState(0);

  useEffect(() => {
    setBar(0);
    if (!boost.active) return;
    const used = Math.max(4, Math.round(((boost.totalDays - boost.daysLeft) / boost.totalDays) * 100));
    const t = window.setTimeout(() => setBar(used), 250);
    return () => window.clearTimeout(t);
  }, [boost.active, boost.daysLeft, boost.totalDays]);

  if (locked || !isPaid) return null;
  if (placement === "top" && !(boost.active && boost.ends)) return null;
  if (placement === "offer" && boost.active && boost.ends) return null;

  // Active boost — status + results
  if (boost.active && boost.ends) {
    return (
      <section aria-label="Profile promotion" className="kyc-in promo-shine flex flex-col gap-5 rounded-xl border border-premium-line bg-premium-bg p-5 sm:p-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-md">
            <Crown1 size={26} color="currentColor" />
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full bg-success-fg ring-2 ring-white" />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h5 text-ink">Your profile is promoted</h2>
              <span className="promo-badge inline-flex h-[22px] items-center gap-1 rounded-full bg-surface-card px-2 text-label-sm text-premium-fg ring-1 ring-inset ring-premium-line">
                <Crown1 size={14} color="currentColor" /> Promoted
              </span>
            </div>
            <div className="h-2 w-full max-w-[360px] overflow-hidden rounded-full bg-surface-card" role="progressbar" aria-label="Promotion period used" aria-valuenow={bar} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--gold-300),var(--gold-500))] transition-[width] duration-1000 ease-out" style={{ width: `${bar}%` }} />
            </div>
            <p className="flex items-center gap-1.5 text-body-sm text-ink-secondary">
              <Timer1 size={16} color="currentColor" className="text-premium-fg" />
              {boost.daysLeft} day{boost.daysLeft === 1 ? "" : "s"} left · ends {fmt(boost.ends)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:w-[300px]">
          {[
            { Icon: Eye, value: boost.views, label: "Profile views" },
            { Icon: Heart, value: boost.interests, label: "New interests" },
          ].map(({ Icon, value, label }) => (
            <div key={label} className="flex flex-col gap-1 rounded-[16px] bg-surface-card p-3 shadow-xs">
              <Icon size={18} color="currentColor" className="text-premium-fg" />
              <span className="text-h5 text-ink">+{value}</span>
              <span className="text-caption text-ink-tertiary">{label}</span>
            </div>
          ))}
        </div>

        <Button variant="outline" size="md" onClick={openPromote} leftIcon={<Crown1 size={18} color="currentColor" />}>
          Extend 7 days
        </Button>
      </section>
    );
  }

  // Not promoted yet — offer
  return (
    <section aria-label="Promote your profile" className="kyc-in promo-shine flex flex-col gap-5 rounded-xl border border-premium-line bg-premium-bg p-5 sm:p-6 md:flex-row md:items-center">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-md">
        <Chart size={26} color="currentColor" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-h5 text-ink">Promote your profile</h2>
        <p className="text-body-sm text-ink-secondary">
          Appear at the top of matching searches with a gold <span className="font-semibold text-premium-fg">Promoted</span> badge for {BOOST.days} days. Get up to 10× more views.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4 max-md:justify-between">
        <span className="flex flex-col items-end leading-tight">
          <span className="text-h5 text-ink">{lkr(price)}</span>
          <span className="text-caption text-ink-tertiary">{BOOST.days} days · one-time</span>
        </span>
        <Button size="md" onClick={openPromote} leftIcon={<Crown1 size={18} color="currentColor" />}>
          Promote my profile
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Promote flow — review → bank transfer (/plans/checkout?product=boost) */
/* ------------------------------------------------------------------ */
export function PromoteModal() {
  const router = useRouter();
  const { locked, isPaid } = useAccess();
  const boost = useBoost();
  const price = useBoostPrice();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const { profileCode, photoUrl } = useAuthSession();
  const memberId = profileCode || "Your Profile";
  const memberPhoto = photoUrl || "/brand/couple.png";

  // open from the card, from ?promote=1 (Search → "Promote your profile"), or the event
  useEffect(() => {
    const show = () => {
      setClosing(false);
      setOpen(true);
    };
    window.addEventListener(OPEN_PROMOTE_EVENT, show);
    const url = new URL(window.location.href);
    if (url.searchParams.get("promote")) {
      url.searchParams.delete("promote");
      window.history.replaceState(null, "", url);
      window.setTimeout(show, 600);
    }
    return () => window.removeEventListener(OPEN_PROMOTE_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  // only approved Pro members can promote
  if (locked || !isPaid) return null;

  function close() {
    setClosing(true);
    window.setTimeout(() => setOpen(false), 180);
  }
  const extending = boost.active && !!boost.ends;
  const startDate = extending && boost.ends ? boost.ends : new Date();
  const endDate = new Date(startDate.getTime() + BOOST.days * 86_400_000);

  // Paid by bank transfer like plans; the boost starts when our team confirms the receipt (S04-T05)
  const pay = () => {
    document.body.style.overflow = "";
    router.push("/plans/checkout?product=boost");
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden onClick={close} className={cn("absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200", closing ? "opacity-0" : "animate-fade-in")} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promote-title"
        className={cn(
          "relative flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-y-auto rounded-t-xl bg-surface-card shadow-xl transition-all duration-200 sm:rounded-xl",
          closing ? "translate-y-4 opacity-0" : "animate-dialog-in",
        )}
      >
        <button type="button" aria-label="Close" onClick={close} className="absolute right-4 top-4 z-10 text-[rgba(255,255,255,0.8)] transition-colors hover:text-white">
          <CloseCircle size={24} color="currentColor" />
        </button>

        <>
            {/* Header with preview */}
            <div className="relative shrink-0 overflow-hidden rounded-t-xl bg-[linear-gradient(120deg,var(--gold-900)_0%,var(--gold-700)_55%,var(--gold-500)_100%)] px-6 pb-6 pt-7 text-white">
              <p className="flex items-center gap-1.5 text-label-sm uppercase tracking-wide text-[rgba(255,255,255,0.8)]">
                <Crown1 size={14} color="currentColor" /> Profile boost
              </p>
              <h2 id="promote-title" className="mt-1 text-h4 text-white">
                {extending ? "Extend your promotion" : "Promote your profile"}
              </h2>
              {/* how your card looks while promoted */}
              <div className="promo-shine mt-5 flex items-center gap-3 rounded-[16px] bg-premium-bg p-3 text-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={memberPhoto} alt="" className="h-14 w-14 shrink-0 rounded-[12px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-label-lg">
                    {memberId}
                    <span className="promo-badge inline-flex h-[20px] items-center gap-1 rounded-full bg-surface-card px-2 text-label-sm text-premium-fg">
                      <Crown1 size={12} color="currentColor" /> Promoted
                    </span>
                  </p>
                  <p className="flex items-center gap-1 truncate text-body-xs text-ink-tertiary">
                    <Location size={12} color="currentColor" /> Top of matching searches
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-5 p-6">
              <ul className="flex flex-col gap-3">
                {PERKS.map(({ Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-premium-bg text-premium-fg">
                      <Icon size={18} color="currentColor" />
                    </span>
                    <span className="text-body-sm">
                      <span className="block font-semibold text-ink">{title}</span>
                      <span className="text-ink-secondary">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {/* Package */}
              <div className="flex items-center gap-3 rounded-[16px] border-2 border-brand bg-brand-subtle p-4">
                <RecordCircle size={22} color="currentColor" variant="Bold" className="shrink-0 text-brand" />
                <div className="flex-1">
                  <p className="text-label-lg text-ink">{BOOST.days}-day boost</p>
                  <p className="text-body-xs text-ink-secondary">
                    {fmt(startDate)} – {fmt(endDate)}
                    {extending && " · added after your current boost"}
                  </p>
                </div>
                <span className="text-h5 text-ink">{lkr(price)}</span>
              </div>

              {/* Payment */}
              <div className="flex items-start gap-3 rounded-[16px] bg-surface-subtle p-4 text-body-sm text-ink-secondary">
                <Bank size={20} color="currentColor" className="mt-0.5 shrink-0 text-brand" />
                <p>
                  Pay by bank transfer and upload the receipt. Your profile is promoted as soon as our team confirms it, usually within 24 hours.
                  {extending && " The 7 days are added after your current boost."}
                </p>
              </div>

              <Button size="lg" className="w-full" onClick={pay}>
                <Crown1 size={20} color="currentColor" /> Pay {lkr(price)} by bank transfer
              </Button>
            </div>
        </>
      </div>
    </div>,
    document.body,
  );
}
