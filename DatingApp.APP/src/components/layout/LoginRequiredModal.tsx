"use client";

import React, { useEffect, useState } from "react";
import { CloseCircle, Heart, Lock1, MessageText, ShieldTick } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CoupleAvatar } from "@/components/ui/Brand";
import { LOGIN_REQUIRED_EVENT } from "@/lib/session";

/**
 * "Log in to continue" — opens when a guest taps a member-only action
 * (send interest, message, shortlist, share, report). Mounted once in the root layout;
 * anything opens it via lib/session → requireMember(action).
 * Same dialog pattern as the Upgrade prompt (bottom sheet on mobile).
 */
const PERKS = [
  { Icon: Heart, label: "Send interests & shortlist profiles" },
  { Icon: MessageText, label: "Chat safely once they accept" },
  { Icon: ShieldTick, label: "Every profile is ID-verified" },
];

export function LoginRequiredModal() {
  const [state, setState] = useState<{ action: string; next: string } | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const open = (e: Event) => {
      setClosing(false);
      setState((e as CustomEvent<{ action: string; next: string }>).detail);
    };
    window.addEventListener(LOGIN_REQUIRED_EVENT, open);
    return () => window.removeEventListener(LOGIN_REQUIRED_EVENT, open);
  }, []);

  useEffect(() => {
    if (!state) return;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", esc);
    };
  });

  function close() {
    setClosing(true);
    window.setTimeout(() => setState(null), 200);
  }

  if (!state) return null;
  const next = encodeURIComponent(state.next);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="login-required-title">
      <div className={cn("absolute inset-0 bg-[rgba(0,0,0,0.45)] transition-opacity duration-200", closing ? "opacity-0" : "animate-fade-in")} onClick={close} aria-hidden />
      <div
        className={cn(
          "relative w-full max-w-[440px] overflow-hidden rounded-t-[28px] bg-surface-card shadow-xl transition-all duration-200 sm:rounded-[28px]",
          closing ? "translate-y-4 opacity-0" : "animate-dialog-in",
        )}
      >
        {/* brand header */}
        <div className="relative flex flex-col items-center gap-3 bg-brand-subtle px-6 pb-6 pt-8 text-center">
          <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1 text-ink-tertiary transition-colors hover:text-ink">
            <CloseCircle size={24} color="currentColor" />
          </button>
          <span className="kyc-pop relative">
            <CoupleAvatar size={72} />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-card bg-brand text-white">
              <Lock1 size={14} color="currentColor" />
            </span>
          </span>
          <h2 id="login-required-title" className="text-h5 text-ink">
            Log in to {state.action}
          </h2>
          <p className="text-body-sm text-ink-secondary">This feature is for members only. Log in, or create a free account in about 2 minutes.</p>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5">
          <ul className="flex flex-col gap-2.5">
            {PERKS.map(({ Icon, label }, i) => (
              <li key={label} className="flex items-center gap-3 text-body-sm text-ink" style={{ animation: `fade-up 380ms cubic-bezier(0.22,1,0.36,1) ${120 + i * 50}ms backwards` }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-icon-brand">
                  <Icon size={16} color="currentColor" />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 pt-1">
            <ButtonLink href={`/login?next=${next}`} size="md" fullWidth onClick={close}>
              Log in
            </ButtonLink>
            <ButtonLink href={`/register?next=${next}`} variant="secondary" size="md" fullWidth onClick={close}>
              Create free account
            </ButtonLink>
            <Button variant="ghost" size="md" fullWidth onClick={close}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
