"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseCircle, Crown1, Eye, Heart, Messages2, SearchNormal1, Sms, TickCircle } from "iconsax-react";
import { allSearchLimitsExhausted, exhaustedSearchLimit, FREE_LIMITS, UPGRADE_EVENT, USAGE_LABEL, useUsage, type UsageKind } from "@/lib/usage";
import { useSignedIn } from "@/lib/session";

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
  const pathname = usePathname();
  const signedIn = useSignedIn();
  const { usage, unlimited } = useUsage();
  const [promptKind, setPromptKind] = useState<UsageKind | null>(null);
  const [dismissedSearchLimit, setDismissedSearchLimit] = useState<UsageKind>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchLimit = signedIn && pathname === "/search"
    ? exhaustedSearchLimit(usage, unlimited)
    : undefined;
  const locked = signedIn && allSearchLimitsExhausted(usage, unlimited) && Boolean(searchLimit || promptKind);
  const kind = locked ? searchLimit ?? promptKind : promptKind ?? (searchLimit !== dismissedSearchLimit ? searchLimit : undefined);
  const open = Boolean(kind);

  useEffect(() => {
    const open = (e: Event) => {
      setPromptKind((e as CustomEvent<{ kind: UsageKind }>).detail.kind);
    };
    window.addEventListener(UPGRADE_EVENT, open);
    return () => window.removeEventListener(UPGRADE_EVENT, open);
  }, []);

  useEffect(() => {
    setPromptKind(null);
    setDismissedSearchLimit(undefined);
  }, [pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    setDismissedSearchLimit(searchLimit);
    setPromptKind(null);
  }

  if (!kind) return null;
  const limit = FREE_LIMITS[kind];
  const unit = USAGE_LABEL[kind].unit;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="upgrade-title"
      aria-describedby="upgrade-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!locked) close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/45 backdrop:backdrop-blur-md"
    >
      <div className="flex h-full items-end justify-center sm:items-center sm:p-4">
        <div className="relative max-h-full w-full max-w-[440px] animate-dialog-in overflow-y-auto rounded-t-[28px] bg-surface-card shadow-xl sm:rounded-[28px]">
          {/* gold header */}
          <div className="relative flex flex-col items-center gap-3 bg-premium-bg px-6 pb-6 pt-8 text-center">
            {!locked && <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1 text-ink-tertiary hover:bg-white">
              <CloseCircle size={24} color="currentColor" />
            </button>}
            <span className="kyc-pop relative flex h-16 w-16 items-center justify-center rounded-full bg-surface-card text-premium-fg shadow-md">
              {ICON[kind]}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-card bg-premium-fg text-white">
                <Crown1 size={14} color="currentColor" />
              </span>
            </span>
            <h2 id="upgrade-title" className="text-h5 text-ink">
              {locked ? "You’ve used your free browsing allowance" : USAGE_LABEL[kind].limitReachedTitle || `You’ve used your ${limit} free ${unit}`}
            </h2>
            <p id="upgrade-description" className="text-body-sm text-ink-secondary">
              {locked ? "You’ve used all your free searches and profile views this month. Upgrade to keep browsing, or return to your dashboard." : USAGE_LABEL[kind].limitReachedMsg || `Free members get ${limit} ${unit} a month — your allowance resets on the 1st. Upgrade to keep going right now.`}
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
              onClick={locked ? undefined : close}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient text-button-md text-ink-on-brand transition-shadow hover:shadow-glow"
            >
              <Crown1 size={18} color="currentColor" /> Upgrade to Gold — from LKR 1,875/mo
            </Link>
            {locked ? (
              <Link href="/dashboard" onClick={() => setPromptKind(null)} className="text-center text-body-sm font-semibold text-ink-secondary hover:text-ink">
                Back to Dashboard
              </Link>
            ) : (
              <button type="button" onClick={close} className="text-body-sm font-semibold text-ink-secondary hover:text-ink">
                Keep browsing
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
