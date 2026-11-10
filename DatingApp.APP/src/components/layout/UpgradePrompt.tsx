"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CloseCircle, Crown1, Eye, Heart, Messages2, SearchNormal1, Sms, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { FREE_LIMITS, UPGRADE_EVENT, USAGE_LABEL, type UsageKind } from "@/lib/usage";

/**
 * Upgrade prompt — opens whenever a Free member hits a monthly limit
 * (messages, searches or interests). Mounted once in the root layout;
 * anything can open it via lib/usage → consume().
 */
const ICON: Record<UsageKind, React.ReactNode> = {
  profileViews: <Eye size={26} color="currentColor" />,
  chats: <Messages2 size={26} color="currentColor" />,
  messages: <Messages2 size={26} color="currentColor" />,
  searches: <SearchNormal1 size={26} color="currentColor" />,
  interests: <Heart size={26} color="currentColor" />,
};

const PERKS = [
  { Icon: Messages2, label: "Unlimited messages" },
  { Icon: Heart, label: "Unlimited interests" },
  { Icon: SearchNormal1, label: "Unlimited & advanced search" },
  { Icon: Eye, label: "See who viewed you" },
  { Icon: Sms, label: "Contact & WhatsApp sharing" },
];

export function UpgradePrompt() {
  const [kind, setKind] = useState<UsageKind | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const open = (e: Event) => {
      setClosing(false);
      setKind((e as CustomEvent<{ kind: UsageKind }>).detail.kind);
    };
    window.addEventListener(UPGRADE_EVENT, open);
    return () => window.removeEventListener(UPGRADE_EVENT, open);
  }, []);

  useEffect(() => {
    if (!kind) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  });

  function close() {
    setClosing(true);
    window.setTimeout(() => setKind(null), 200);
  }

  if (!kind) return null;
  const limit = FREE_LIMITS[kind];
  const unit = USAGE_LABEL[kind].unit;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
      <div className={cn("absolute inset-0 bg-black/45 transition-opacity duration-200", closing ? "opacity-0" : "animate-fade-in")} onClick={close} aria-hidden />
      <div
        className={cn(
          "relative w-full max-w-[440px] overflow-hidden rounded-t-[28px] bg-surface-card shadow-xl transition-all duration-200 sm:rounded-[28px]",
          closing ? "translate-y-4 opacity-0" : "animate-dialog-in"
        )}
      >
        {/* gold header */}
        <div className="relative flex flex-col items-center gap-3 bg-premium-bg px-6 pb-6 pt-8 text-center">
          <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1 text-ink-tertiary hover:bg-white">
            <CloseCircle size={24} color="currentColor" />
          </button>
          <span className="kyc-pop relative flex h-16 w-16 items-center justify-center rounded-full bg-surface-card text-premium-fg shadow-md">
            {ICON[kind]}
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-card bg-premium-fg text-white">
              <Crown1 size={14} color="currentColor" />
            </span>
          </span>
          <h2 id="upgrade-title" className="text-h5 text-ink">
            {USAGE_LABEL[kind].limitReachedTitle || `You’ve used your ${limit} free ${unit}`}
          </h2>
          <p className="text-body-sm text-ink-secondary">
            {USAGE_LABEL[kind].limitReachedMsg || `Free members get ${limit} ${unit} a month — your allowance resets on the 1st. Upgrade to keep going right now.`}
          </p>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5">
          <ul className="flex flex-col gap-2.5">
            {PERKS.map(({ Icon, label }, i) => (
              <li key={label} className="flex items-center gap-3 text-body-sm text-ink" style={{ animation: `fade-up 380ms cubic-bezier(0.22,1,0.36,1) ${120 + i * 50}ms backwards` }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-premium-bg text-premium-fg">
                  <Icon size={16} color="currentColor" />
                </span>
                <span className="flex-1">{label}</span>
                <TickCircle size={18} color="currentColor" variant="Bold" className="text-success-fg" />
              </li>
            ))}
          </ul>
          <Link
            href="/plans"
            onClick={close}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient text-button-md text-ink-on-brand transition-shadow hover:shadow-glow"
          >
            <Crown1 size={18} color="currentColor" /> Upgrade to Gold — from LKR 1,875/mo
          </Link>
          <button type="button" onClick={close} className="text-body-sm font-semibold text-ink-secondary hover:text-ink">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
