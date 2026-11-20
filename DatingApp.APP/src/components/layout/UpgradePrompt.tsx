"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, CloseCircle, Crown1, Eye, Heart, Messages2, SearchNormal1, Sms, TickCircle } from "iconsax-react";
import { allSearchLimitsExhausted, UPGRADE_EVENT, USAGE_LABEL, useUsage, type UsageKind } from "@/lib/usage";
import { useSignedIn } from "@/lib/session";
import { Button, Modal } from "@/components/ui";

/**
 * Upgrade prompt — opens whenever a Free member hits a monthly limit set by the admin
 * (searches, profile views, interests, new chats) or tries a Gold feature (asking for contact details).
 * Mounted once in the root layout; anything can open it via lib/usage → openUpgrade() / handleLimitError().
 * Numbers come from GET /api/me/usage.
 *
 * Two modes:
 *  • Browsing used up on /search (searches AND profile views at 0): hard stop.
 *    No close button, Esc does nothing. Upgrade to Gold · Back to Dashboard.
 *  • Any other limit or Gold feature: closable. Close (X / Esc) · Upgrade to Gold · Close.
 */
const ICON: Record<UsageKind, React.ReactNode> = {
  profileViews: <Eye size={26} color="currentColor" />,
  chats: <Messages2 size={26} color="currentColor" />,
  searches: <SearchNormal1 size={26} color="currentColor" />,
  interests: <Heart size={26} color="currentColor" />,
  contactShare: <Sms size={26} color="currentColor" />,
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
  const router = useRouter();
  const signedIn = useSignedIn();
  const { usage } = useUsage();
  const [promptKind, setPromptKind] = useState<UsageKind | null>(null);
  // both browsing allowances used up → the Search page stays behind the prompt
  const browsingUsedUp = signedIn && allSearchLimitsExhausted(usage);
  const searchLimit: UsageKind | undefined = browsingUsedUp && pathname === "/search" ? "searches" : undefined;
  const kind = promptKind ?? searchLimit;

  useEffect(() => {
    const open = (e: Event) => {
      setPromptKind((e as CustomEvent<{ kind: UsageKind }>).detail.kind);
    };
    window.addEventListener(UPGRADE_EVENT, open);
    return () => window.removeEventListener(UPGRADE_EVENT, open);
  }, []);

  // leaving the page (link, Back button, browser back) clears an action-triggered prompt
  useEffect(() => {
    setPromptKind(null);
  }, [pathname]);
  useEffect(() => {
    const reset = () => setPromptKind(null);
    window.addEventListener("popstate", reset);
    return () => window.removeEventListener("popstate", reset);
  }, []);

  function backToDashboard() {
    setPromptKind(null);
    if (pathname !== "/dashboard") router.push("/dashboard");
  }

  if (!kind) return null;
  const limit = kind === "contactShare" ? 0 : usage.limits[kind] ?? 0;
  const goldOnly = kind === "contactShare" || limit === 0;
  /** hard stop only when browsing is used up on the Search page; everything else can be closed */
  const allUsedUp = browsingUsedUp && (kind === "searches" || kind === "profileViews") && pathname === "/search";
  const goldFeature = !allUsedUp;
  const label = USAGE_LABEL[kind];
  const unit = label.unit;
  const resets = usage.resetsAt
    ? new Date(usage.resetsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })
    : "the 1st";

  return (
    // Esc closes a Gold-feature prompt, never a reached limit (dismissible); the backdrop never closes it
    <Modal
      open
      onClose={() => setPromptKind(null)}
      labelledBy="upgrade-title"
      describedBy="upgrade-description"
      size="sm"
      dismissible={goldFeature}
      closeOnBackdrop={false}
      hideClose
    >
          {/* gold header */}
          <div className="relative flex flex-col items-center gap-3 bg-premium-bg px-6 pb-6 pt-8 text-center">
            {goldFeature && (
              <button
                type="button"
                onClick={() => setPromptKind(null)}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full p-1 text-ink-tertiary transition-colors hover:bg-surface-card hover:text-ink focus-visible:outline-none focus-visible:shadow-ring-brand"
              >
                <CloseCircle size={24} color="currentColor" />
              </button>
            )}
            <span className="kyc-pop relative flex h-16 w-16 items-center justify-center rounded-full bg-surface-card text-premium-fg shadow-md">
              {ICON[kind]}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-card bg-premium-fg text-white">
                <Crown1 size={14} color="currentColor" />
              </span>
            </span>
            <h2 id="upgrade-title" className="text-h5 text-ink">
              {allUsedUp
                ? "You’ve used your free browsing allowance"
                : goldOnly
                  ? label.goldTitle || `${label.title} is a Gold feature`
                  : `You’ve used your ${limit} free ${unit}`}
            </h2>
            <p id="upgrade-description" className="text-body-sm text-ink-secondary">
              {allUsedUp
                ? `You’ve used all your free searches and profile views this month. They come back on ${resets}. Upgrade to keep browsing, or return to your dashboard.`
                : goldOnly
                  ? label.goldMsg || `Upgrade to Gold to use ${unit}.`
                  : `Your plan includes ${limit} ${unit} a month. They come back on ${resets}. Upgrade to Gold to keep going right now.`}
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
              onClick={() => setPromptKind(null)}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient text-button-md text-ink-on-brand transition-shadow hover:shadow-glow"
            >
              <Crown1 size={18} color="currentColor" /> Upgrade to Gold, from LKR 1,875/mo
            </Link>
            {goldFeature ? (
              <Button variant="outline" size="md" fullWidth onClick={() => setPromptKind(null)}>
                Close
              </Button>
            ) : (
              <Button variant="outline" size="md" fullWidth onClick={backToDashboard} leftIcon={<ArrowLeft size={18} color="currentColor" />}>
                Back to Dashboard
              </Button>
            )}
          </div>
    </Modal>
  );
}
