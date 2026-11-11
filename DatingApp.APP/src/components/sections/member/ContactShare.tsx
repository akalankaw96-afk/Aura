"use client";

import React from "react";
import { Call, CallCalling, Clock, CloseCircle, ShieldTick, TickCircle, Whatsapp } from "iconsax-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Share contact details — mutual consent (docs/UI_UX_GUIDELINES.md).
 *  1. A member taps "Share contact" in the chat header → request card appears in the thread ("sent").
 *  2. The other member sees the request card with Accept & share · Not now ("received").
 *  3. Accepted → both see each other's mobile + WhatsApp, on this conversation only ("accepted").
 *  4. Declined → the requester sees a gentle note and can keep chatting; they may ask again later.
 * Only mobile/WhatsApp numbers are exchanged — never e-mail or address.
 */
export type ContactShareStatus = "none" | "sent" | "received" | "accepted" | "declined-by-them" | "declined-by-me";

const wa = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;
const tel = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

/* ── Chat header action ─────────────────────────────────────────── */
export function ContactShareHeaderAction({
  status,
  phone,
  onRequest,
  onRespond,
}: {
  status: ContactShareStatus;
  phone: string;
  onRequest: () => void;
  /** scrolls to the request card */
  onRespond: () => void;
}) {
  if (status === "accepted") {
    return (
      <div className="hidden items-center gap-2 rounded-full bg-success-bg py-1 pl-3 pr-1 text-label-sm text-success-fg md:flex">
        <TickCircle size={16} color="currentColor" variant="Bold" />
        <span className="whitespace-nowrap">{phone}</span>
        <a
          href={wa(phone)}
          target="_blank"
          rel="noreferrer"
          aria-label={`WhatsApp ${phone}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-card text-success-fg transition-colors hover:bg-success-fg hover:text-ink-on-brand focus-visible:outline-none focus-visible:shadow-ring-brand"
        >
          <Whatsapp size={16} color="currentColor" variant="Bold" />
        </a>
      </div>
    );
  }
  if (status === "sent") {
    return (
      <Button variant="outline" size="sm" disabled className="hidden md:inline-flex" leftIcon={<Clock size={16} color="currentColor" />}>
        Request sent
      </Button>
    );
  }
  if (status === "received") {
    return (
      <Button size="sm" className="hidden md:inline-flex" onClick={onRespond} leftIcon={<CallCalling size={16} color="currentColor" />}>
        Respond to request
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={onRequest} leftIcon={<CallCalling size={16} color="currentColor" />}>
      Share contact
    </Button>
  );
}

/** Label for the compact (⋯) menu on small screens */
export function contactShareMenuLabel(status: ContactShareStatus, phone: string) {
  switch (status) {
    case "accepted":
      return `WhatsApp ${phone}`;
    case "sent":
      return "Contact request sent";
    case "received":
      return "Respond to contact request";
    default:
      return "Share contact details";
  }
}

/* ── In-thread card ─────────────────────────────────────────────── */
export const ContactShareCard = React.forwardRef<
  HTMLDivElement,
  {
    status: ContactShareStatus;
    name: string;
    partnerPhone: string;
    myPhone: string;
    onAccept: () => void;
    onDecline: () => void;
    onCancel: () => void;
    onRequest: () => void;
  }
>(function ContactShareCard({ status, name, partnerPhone, myPhone, onAccept, onDecline, onCancel, onRequest }, ref) {
  if (status === "none") return null;
  const first = name.split(" ")[0] || name;

  return (
    <div ref={ref} className="mx-auto w-full max-w-md scroll-mt-6 animate-pop-in" role="status" aria-live="polite">
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border p-4 shadow-xs",
          status === "accepted" ? "border-success-fg bg-success-bg" : status === "received" ? "border-brand bg-brand-subtle" : "border-line bg-surface-card",
        )}
      >
        {/* header */}
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              status === "accepted" ? "bg-surface-card text-success-fg" : status.startsWith("declined") ? "bg-surface-subtle text-ink-tertiary" : "bg-surface-card text-icon-brand",
            )}
          >
            {status === "accepted" ? (
              <TickCircle size={22} color="currentColor" variant="Bold" />
            ) : status === "sent" ? (
              <Clock size={22} color="currentColor" />
            ) : status.startsWith("declined") ? (
              <CloseCircle size={22} color="currentColor" />
            ) : (
              <CallCalling size={22} color="currentColor" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-label-md text-ink">
              {status === "received" && `${first} wants to share contact details`}
              {status === "sent" && `Contact request sent to ${first}`}
              {status === "accepted" && "Contact details shared"}
              {status === "declined-by-them" && `${first} isn’t ready to share yet`}
              {status === "declined-by-me" && "You chose not to share for now"}
            </p>
            <p className="mt-0.5 text-body-sm text-ink-secondary">
              {status === "received" && `If you accept, you’ll swap mobile and WhatsApp numbers with ${first} — only with ${first}.`}
              {status === "sent" && `We’ll show both numbers here as soon as ${first} accepts. Keep chatting meanwhile.`}
              {status === "accepted" && `You and ${first} can now call or WhatsApp each other.`}
              {status === "declined-by-them" && "No worries — keep getting to know each other here. You can ask again later."}
              {status === "declined-by-me" && `${first} won’t see your number. You can share any time from the chat header.`}
            </p>
          </div>
        </div>

        {/* accepted: both numbers */}
        {status === "accepted" && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-card px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-caption text-ink-tertiary">{first}’s mobile &amp; WhatsApp</p>
                <p className="text-label-lg text-ink">{partnerPhone}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={tel(partnerPhone)}
                  aria-label={`Call ${first}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:shadow-ring-brand"
                >
                  <Call size={18} color="currentColor" />
                </a>
                <a
                  href={wa(partnerPhone)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 items-center gap-1.5 rounded-full bg-success-fg px-4 text-button-sm text-ink-on-brand transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:shadow-ring-brand"
                >
                  <Whatsapp size={18} color="currentColor" variant="Bold" /> WhatsApp
                </a>
              </div>
            </div>
            <p className="text-caption text-ink-tertiary">Your number {myPhone} was shared with {first}.</p>
          </div>
        )}

        {/* actions */}
        {status === "received" && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" size="sm" className="flex-1" onClick={onDecline}>
              Not now
            </Button>
            <Button size="sm" className="flex-1" onClick={onAccept} leftIcon={<TickCircle size={16} color="currentColor" />}>
              Accept &amp; share
            </Button>
          </div>
        )}
        {status === "sent" && (
          <Button variant="ghost" size="sm" className="self-start" onClick={onCancel}>
            Cancel request
          </Button>
        )}
        {status === "declined-by-me" && (
          <Button variant="outline" size="sm" className="self-start" onClick={onRequest} leftIcon={<CallCalling size={16} color="currentColor" />}>
            Share my contact
          </Button>
        )}

        {status !== "accepted" && (
          <p className="flex items-center gap-1.5 text-caption text-ink-tertiary">
            <ShieldTick size={14} color="currentColor" className="shrink-0" />
            Only mobile &amp; WhatsApp numbers are shared — never your email or address.
          </p>
        )}
      </div>
    </div>
  );
});
