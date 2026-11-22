"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight2,
  Clock,
  CloseCircle,
  Crown1,
  Danger,
  Edit2,
  Gallery,
  Heart,
  Lock1,
  Messages2,
  Mobile,
  Profile2User,
  SearchNormal1,
  ShieldTick,
  Sms,
  TickCircle,
  UserTick,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useFlashToast } from "@/components/ui";
import { formatPhone } from "@/components/auth/shared";
import { loadDraft, type RegistrationDraft } from "@/lib/registrationDraft";
import { useKyc, type KycStatus } from "@/lib/verification";
import { useAuthSession } from "@/lib/session";
import { getReviewStatus, useApiImage, type ProfileStatusInfo } from "@/lib/media";
import { apiService } from "@/services/api";

/** Flagged field from the moderator → label, icon and the step that fixes it (/profile/complete). */
const FLAG_INFO: Record<string, { label: string; Icon: typeof Clock; step: string }> = {
  photo: { label: "Main photo", Icon: Gallery, step: "photos" },
  documents: { label: "ID document", Icon: ShieldTick, step: "identity" },
  selfie: { label: "Selfie", Icon: ShieldTick, step: "identity" },
  name: { label: "Name", Icon: Edit2, step: "details" },
  dob: { label: "Date of birth", Icon: Edit2, step: "details" },
  gender: { label: "Gender", Icon: Edit2, step: "details" },
  about: { label: "About you", Icon: Edit2, step: "details" },
  profession: { label: "Profession", Icon: Edit2, step: "details" },
  education: { label: "Education", Icon: Edit2, step: "details" },
  religion: { label: "Religion", Icon: Edit2, step: "details" },
  location: { label: "Location", Icon: Edit2, step: "details" },
  other: { label: "Other", Icon: Edit2, step: "details" },
};

/** What a Draft profile still needs → where to add it. */
const TODO: { key: string; label: string; note: string; Icon: typeof Clock; step: string }[] = [
  { key: "details", label: "Profile details", note: "Name, birth date, religion, work", Icon: Profile2User, step: "details" },
  { key: "photo", label: "Photos", note: "A clear main photo, or an avatar", Icon: Gallery, step: "photos" },
  { key: "idDocument", label: "ID document", note: "NIC front and back, or passport", Icon: ShieldTick, step: "identity" },
  { key: "selfie", label: "Selfie", note: "So we know it’s really you", Icon: UserTick, step: "identity" },
];

/**
 * Dashboard → Profile verification panel (shown until the profile is approved).
 *  pending / resubmitted → progress timeline, what we check, what you can do now, what's locked
 *  changes (rejected)    → flagged fields with reasons + Fix & resubmit
 *  live                  → a one-time "You're live" celebration, then nothing
 */
const STEPS = ["Account created", "Mobile verified", "Profile submitted", "Safety review", "Profile live"];

export function VerificationPanel() {
  const { status } = useKyc();
  const { session, firstName, photoUrl } = useAuthSession();
  useFlashToast(); // shows "Profile submitted" after the registration redirect
  const [draft, setDraft] = useState<RegistrationDraft | null>(null);
  const [justLive, setJustLive] = useState(false);
  const prev = useRef<KycStatus>(status);

  useEffect(() => setDraft(loadDraft()), [status]);

  // Own photo, even while in review (needs the token → blob URL)
  const shownPhoto = useApiImage(photoUrl || draft?.photo || null);

  // The review state from the server: Draft (still to submit), flags from the moderator, what's missing
  const [review, setReview] = useState<ProfileStatusInfo | null>(null);
  useEffect(() => {
    let cancelled = false;
    getReviewStatus()
      .then((info) => {
        if (cancelled) return;
        setReview(info);
        void apiService.refreshSession(); // keep the session's status in step (e.g. approved while away)
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (prev.current !== "live" && status === "live") setJustLive(true);
    prev.current = status;
  }, [status]);


  if (status === "live") {
    if (!justLive) return null;
    return (
      <section className="kyc-in relative overflow-hidden rounded-xl border border-success-bg bg-success-bg p-5 sm:p-6" aria-live="polite">
        <div className="flex items-center gap-4">
          <span className="kyc-pop flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-success-fg text-white shadow-lg">
            <UserTick size={28} color="currentColor" variant="Bold" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-h5 text-ink">You’re live! 🎉</h2>
            <p className="text-body-sm text-ink-secondary">Your profile was approved. Send interests, chat and search are all unlocked.</p>
          </div>
          <button type="button" onClick={() => setJustLive(false)} aria-label="Dismiss" className="rounded-full p-1 text-ink-tertiary hover:bg-white">
            <CloseCircle size={22} color="currentColor" />
          </button>
        </div>
      </section>
    );
  }

  const rejected = status === "changes" || review?.status === "ChangesRequested";
  const isDraft = !!review && (review.status === "Draft" || review.status === "None");
  const flags = review?.flags ?? [];
  const missing = new Set(review?.missing ?? []);
  const todo = TODO.filter((t) => (t.key === "details" ? missing.has("profile") || missing.has("dateOfBirth") : missing.has(t.key)));
  const current = isDraft ? 2 : 3; // index of "Profile submitted" or "Safety review"
  const name = firstName || draft?.firstName || "there";
  const displayPhoto = shownPhoto;
  const mobileDisplay = session?.phoneNumber || draft?.mobile ? formatPhone(session?.phoneNumber || draft?.mobile || "") : (session?.email || "your email/mobile");
  const reviewedOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <section
        aria-labelledby="kyc-title"
        className={cn(
          "kyc-in relative overflow-hidden rounded-xl border bg-surface-card p-5 shadow-sm sm:p-6",
          rejected ? "border-error-bg" : "border-premium-line"
        )}
      >
        {/* tinted top glow */}
        <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-28", rejected ? "bg-gradient-to-b from-error-bg to-transparent" : "bg-gradient-to-b from-premium-bg to-transparent")} />

        {/* Header */}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span
            className={cn(
              "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-md",
              rejected ? "bg-error-fg" : "bg-premium-fg"
            )}
          >
            {!rejected && <span aria-hidden className="kyc-ring absolute inset-0 rounded-full bg-premium-fg" />}
            {rejected ? <Danger size={28} color="currentColor" variant="Bold" /> : <Clock size={28} color="currentColor" variant="Bold" className="relative" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="kyc-title" className="text-h5 text-ink">
                {rejected
                  ? "Your profile needs a few changes"
                  : status === "resubmitted"
                  ? "Thanks, we’re checking your changes"
                  : isDraft
                  ? `Welcome ${name}, finish your profile`
                  : `Your Profile Is Under Review`}
              </h2>
              <Badge tone={rejected ? "error" : isDraft ? "brand" : "warning"}>
                {rejected ? "Action needed" : isDraft ? "Not submitted yet" : "Pending review"}
              </Badge>
            </div>
            <p className="mt-1 text-body-sm text-ink-secondary">
              {rejected
                ? "Please fix the items below and resubmit. Nothing is shown to other members until it’s approved."
                : isDraft
                ? "Add your photos and ID, then submit your profile. Our safety team reviews it within 24 hours."
                : <>Your dashboard features will be available once your KYC verification is approved. We’ll notify you at{" "}
                    <b className="text-ink">{mobileDisplay}</b> as soon as you’re live.</>}
            </p>
          </div>
          {displayPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayPhoto} alt="" className="hidden h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-surface-card shadow-md sm:block" />
          )}
        </div>

        {isDraft && !rejected && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand/20 bg-brand-subtle p-4">
            <span className="text-label-md font-bold text-ink">
              {todo.length ? `${todo.length} thing${todo.length === 1 ? "" : "s"} to add before you submit` : "Everything is ready — submit your profile"}
            </span>
            {todo.length > 0 && (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
                {todo.map(({ key, label, note, Icon, step }) => (
                  <li key={key}>
                    <Link href={`/profile/complete?step=${step}`} className="group flex items-center gap-3 rounded-md bg-surface-card px-3 py-2.5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand">
                        <Icon size={18} color="currentColor" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-sm font-bold text-ink">{label}</span>
                        <span className="block truncate text-caption text-ink-tertiary">{note}</span>
                      </span>
                      <ArrowRight2 size={16} color="currentColor" className="text-ink-tertiary transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/profile/complete${todo[0] ? `?step=${todo[0].step}` : "?step=identity"}`} className="self-start">
              <Button variant="primary" className="rounded-full shadow-sm" rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
                {todo.length ? "Complete my profile" : "Review & submit"}
              </Button>
            </Link>
          </div>
        )}

        {/* Progress timeline */}
        <ol className="relative mt-6 grid grid-cols-5 gap-1" aria-label="Verification progress">
          {/* track + animated fill */}
          <span aria-hidden className="absolute left-[10%] right-[10%] top-[15px] h-1 rounded-full bg-surface-muted" />
          <span
            aria-hidden
            className={cn("kyc-progress absolute left-[10%] top-[15px] h-1 rounded-full", rejected ? "bg-error-fg" : "bg-brand-gradient")}
            style={{ ["--kyc-w" as string]: `${(current / (STEPS.length - 1)) * 80}%` } as React.CSSProperties}
          />
          {STEPS.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={s} className="relative flex flex-col items-center gap-2 text-center" style={{ animation: `fade-up 420ms cubic-bezier(0.22,1,0.36,1) ${150 + i * 90}ms backwards` }}>
                <span
                  className={cn(
                    "relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-label-sm",
                    done && "border-success-fg bg-success-fg text-white",
                    active && !rejected && "border-premium-fg bg-premium-bg text-premium-fg",
                    active && rejected && "border-error-fg bg-error-bg text-error-fg",
                    !done && !active && "border-line-strong bg-surface-card text-ink-tertiary"
                  )}
                >
                  {active && !rejected && <span aria-hidden className="kyc-ring absolute inset-0 rounded-full bg-premium-fg opacity-40" />}
                  {done ? <TickCircle size={18} color="currentColor" variant="Bold" /> : active && rejected ? <CloseCircle size={18} color="currentColor" variant="Bold" /> : active ? <Clock size={16} color="currentColor" className="relative" /> : i + 1}
                </span>
                <span className={cn("text-[11px] font-semibold leading-tight sm:text-label-sm", active ? (rejected ? "text-error-fg" : "text-premium-fg") : done ? "text-ink" : "text-ink-tertiary")}>
                  {active && rejected ? "Changes needed" : s}
                </span>
              </li>
            );
          })}
        </ol>

        {rejected ? (
          /* Rejected fields — Figma 06b · Profile rejected (status rows + Rejected / Approved badges) */
          <div className="mt-6 flex flex-col gap-3">
            <Alert type="error" title={`${flags.length} field${flags.length === 1 ? "" : "s"} need${flags.length === 1 ? "s" : ""} changes`}>
              Reviewed on {review?.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : reviewedOn} by our safety team. Everything else is fine.
            </Alert>
            <ul className="flex flex-col gap-2">
              {flags.map((f, i) => {
                const info = FLAG_INFO[f.field] ?? FLAG_INFO.other;
                return (
                  <li key={f.field} style={{ animation: `fade-up 420ms cubic-bezier(0.22,1,0.36,1) ${250 + i * 70}ms backwards` }}>
                    <Link
                      href={`/profile/complete?step=${info.step}`}
                      className="group flex items-center gap-3 rounded-md bg-surface-subtle px-4 py-3 transition-colors hover:bg-error-bg"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-surface-card text-error-fg">
                        <info.Icon size={20} color="currentColor" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-sm font-bold text-ink">{info.label}</span>
                        <span className="block text-body-xs text-ink-tertiary">{f.reason}</span>
                      </span>
                      <Badge tone="error">Change</Badge>
                      <ArrowRight2 size={16} color="currentColor" className="shrink-0 text-ink-tertiary transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href={`/profile/complete?step=${(FLAG_INFO[flags[0]?.field] ?? FLAG_INFO.other).step}`} className="mt-1">
              <Button variant="primary" fullWidth className="rounded-full" rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
                Edit &amp; resubmit
              </Button>
            </Link>
          </div>
        ) : isDraft ? null : (
          /* What we check / what you can do now */
          // minmax(0,1fr): one long single-line note (e.g. "While you wait" subtitles) can't widen the column on phones
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
            <div className="min-w-0 rounded-md bg-surface-subtle p-4">
              <p className="mb-3 text-label-md text-ink">What we’re checking</p>
              <ul className="flex flex-col gap-2.5 text-body-sm">
                <CheckItem Icon={Mobile} done label="Mobile number" note="Verified" />
                <CheckItem Icon={Gallery} label="Photos" note={review?.hasMainPhoto ? `${review.photoCount} photo${review.photoCount === 1 ? "" : "s"}, clear face` : "Illustration, quick check"} />
                <CheckItem Icon={ShieldTick} label="Identity" note={review?.documentTypes.includes("Passport") ? "Passport + selfie" : "NIC + selfie"} />
                <CheckItem Icon={Profile2User} label="Profile details" note="Age, religion, location" />
                <CheckItem Icon={ShieldTick} label="Safety" note="No contact details in your bio" />
              </ul>
            </div>
            <div className="flex min-w-0 flex-col gap-3 rounded-md bg-surface-subtle p-4">
              <p className="text-label-md text-ink">While you wait</p>
              <QuickAction href="/search" Icon={SearchNormal1} title="Browse profiles" sub="Look around, sending interest unlocks soon" />
              <QuickAction href="/plans" Icon={Crown1} title="Explore Gold" sub="Unlimited interests once you’re live" tone="premium" />
              <QuickAction href="/terms" Icon={ShieldTick} title="Safety tips" sub="How to connect safely on Vikasitha" />
            </div>
          </div>
        )}

        {/* What's locked */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="mr-1 flex items-center gap-1.5 text-label-sm text-ink-secondary">
            <Lock1 size={16} color="currentColor" /> Unlocks after approval:
          </span>
          {[
            { Icon: Heart, label: "Send interest" },
            { Icon: Messages2, label: "Messages" },
            { Icon: Profile2User, label: "Friends" },
            { Icon: SearchNormal1, label: "Full search" },
            { Icon: Sms, label: "Contact sharing" },
          ].map(({ Icon, label }, i) => (
            <span
              key={label}
              className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-subtle px-2.5 text-label-sm text-ink-tertiary"
              style={{ animation: `pop-in 300ms cubic-bezier(0.22,1,0.36,1) ${400 + i * 50}ms backwards` }}
            >
              <Icon size={14} color="currentColor" /> {label}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}

function CheckItem({ Icon, label, note, done }: { Icon: typeof Clock; label: string; note: string; done?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", done ? "bg-success-bg text-success-fg" : "bg-premium-bg text-premium-fg")}>
        <Icon size={16} color="currentColor" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{label}</span>
        <span className="block text-caption text-ink-tertiary">{note}</span>
      </span>
      {done ? (
        <TickCircle size={18} color="currentColor" variant="Bold" className="text-success-fg" />
      ) : (
        <span className="flex gap-0.5" aria-label="Checking">
          {[0, 1, 2].map((d) => (
            <span key={d} className="kyc-dot h-1.5 w-1.5 rounded-full bg-premium-fg" style={{ animationDelay: `${d * 160}ms` }} />
          ))}
        </span>
      )}
    </li>
  );
}

function QuickAction({ href, Icon, title, sub, tone = "brand" }: { href: string; Icon: typeof Clock; title: string; sub: string; tone?: "brand" | "premium" }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-md bg-surface-card px-3 py-2.5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tone === "premium" ? "bg-premium-bg text-premium-fg" : "bg-brand-subtle text-brand")}>
        <Icon size={18} color="currentColor" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-bold text-ink">{title}</span>
        <span className="block truncate text-caption text-ink-tertiary">{sub}</span>
      </span>
      <ArrowRight2 size={16} color="currentColor" className="text-ink-tertiary transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
