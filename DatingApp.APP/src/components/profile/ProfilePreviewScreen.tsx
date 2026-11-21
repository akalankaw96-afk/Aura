"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Add, CloseCircle, Edit2, Eye, InfoCircle, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { apiService } from "@/services/api";
import { listMyPhotos, useApiImage, type PhotoDto } from "@/lib/media";
import { useKyc } from "@/lib/verification";
import { profileExtras } from "@/content/search";
import { toProposal } from "@/components/sections/search/searchQuery";
import { ProfileDetail, type ViewProfile } from "@/components/sections/search/ProfileView";
import { EditProfileModal, PROFILE_UPDATED_EVENT, openEditProfile } from "@/components/sections/dashboard/EditProfileModal";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/types";

/**
 * /profile/preview — "Preview my profile" from the dashboard.
 * The member's own profile in the same Profile details layout and the same card other members see
 * (`ProfileDetail` with `preview`): their public name, approved photos only, private fields hidden.
 * Left: profile strength tips (photos and description open the editor). Exit preview → dashboard.
 */
export function ProfilePreviewScreen() {
  const router = useRouter();
  const { locked } = useKyc();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [photos, setPhotos] = useState<PhotoDto[]>([]);

  const load = useCallback(async () => {
    const [p, ph] = await Promise.all([apiService.getMyProfile(), listMyPhotos().catch(() => [] as PhotoDto[])]);
    setProfile(p);
    setPhotos(ph);
  }, []);

  useEffect(() => {
    void load();
    const reload = () => void load();
    // the editor opens on this page too: show changes straight away
    window.addEventListener(PROFILE_UPDATED_EVENT, reload);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, reload);
  }, [load]);

  // the main photo may still be in review: fetched with the member's token
  const mainPhoto = useApiImage(profile?.photoUrl);
  const approved = photos.filter((p) => p.status === "Approved").length;
  const waiting = photos.filter((p) => p.status === "Pending").length;

  const view = useMemo<ViewProfile | null>(() => {
    if (!profile) return null;
    return {
      ...toProposal(profile),
      // members see the chosen display name ("Nethmi P."), never the full legal name
      name: profile.details?.displayName || profile.name,
      photo: mainPhoto ?? "",
    };
  }, [profile, mainPhoto]);

  const extras = useMemo(() => {
    if (!view || !profile) return undefined;
    const x = profileExtras({
      location: view.location,
      education: profile.education,
      community: profile.community,
      district: profile.details?.district,
      civil: profile.details?.civilStatus,
      postedBy: profile.details?.createdBy,
      photo: view.photo,
    });
    return { ...x, photos: Math.max(approved, view.photo ? 1 : 0) };
  }, [view, profile, approved]);

  const exit = () => router.push("/dashboard");

  return (
    <main className="container-page flex flex-1 flex-col gap-6 pb-20 pt-6 lg:pt-8">
      <PreviewBar locked={locked} onExit={exit} />

      {/* same header as Profile details */}
      <div className="enter grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-4 gap-y-1">
        <nav aria-label="Breadcrumb" className="col-start-2 flex items-center gap-2 text-body-sm text-ink-tertiary">
          <Link href="/dashboard" className="transition-colors hover:text-brand">
            Dashboard
          </Link>
          <span>/</span>
          <span aria-current="page" className="font-semibold text-brand-text">
            Preview
          </span>
        </nav>
        <BackButton label="Exit preview" onClick={exit} />
        <h1 className="text-h3 text-ink md:text-h2">Profile details</h1>
        <p className="col-start-2 hidden text-body-md text-ink-secondary lg:block">This is how other members see your profile.</p>
      </div>

      {profile === undefined && <PreviewSkeleton />}

      {profile === null && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-line bg-surface-card p-6 shadow-sm sm:flex-row sm:items-center">
          <p className="flex-1 text-body-md text-ink-secondary">We couldn’t load your profile. Check your connection and try again.</p>
          <Button variant="outline" size="md" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      )}

      {view && profile && (
        <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <StrengthPanel profile={profile} approved={approved} waiting={waiting} />
          <div className="order-first min-w-0 lg:order-none">
            <ProfileDetail p={view} x={extras} preview onInterest={() => false} />
          </div>
        </div>
      )}

      <EditProfileModal />
    </main>
  );
}

/* ───────────── preview bar ───────────── */

function PreviewBar({ locked, onExit }: Readonly<{ locked: boolean; onExit: () => void }>) {
  return (
    <section
      aria-label="Profile preview"
      className="enter relative isolate flex flex-col gap-4 overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--rose-950)_0%,var(--rose-900)_55%,var(--rose-800)_100%)] p-4 text-white shadow-lg ring-1 ring-inset ring-[rgba(255,255,255,0.08)] sm:flex-row sm:items-center sm:p-5"
    >
      <span aria-hidden className="pointer-events-none absolute -right-12 -top-16 -z-10 h-44 w-44 rounded-full border-[22px] border-[rgba(255,255,255,0.08)]" />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-gold-900 shadow-md">
          <Eye size={22} color="currentColor" variant="Bold" />
        </span>
        <div className="min-w-0">
          <p className="text-label-lg">You’re previewing your profile</p>
          <p className="text-body-sm text-[rgba(255,255,255,0.8)]">
            {locked ? "It isn’t live yet. This is how members will see it once it’s approved." : "This is how other members see it. Nobody is notified."}
          </p>
        </div>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        {!locked && (
          <button
            type="button"
            onClick={() => openEditProfile()}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[rgba(255,255,255,0.14)] px-4 text-button-sm text-white ring-1 ring-inset ring-[rgba(255,255,255,0.35)] transition-colors hover:bg-[rgba(255,255,255,0.24)] sm:flex-none"
          >
            <Edit2 size={16} color="currentColor" /> Edit profile
          </button>
        )}
        <button
          type="button"
          onClick={onExit}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-button-sm text-rose-700 shadow-md transition-transform hover:-translate-y-0.5 active:scale-95 sm:flex-none"
        >
          <CloseCircle size={18} color="currentColor" /> Exit preview
        </button>
      </div>
    </section>
  );
}

/* ───────────── profile strength ───────────── */

type Tip = { done: boolean; label: string; todo: string; action: { tab: "about" | "photos" } | { href: string } };

function tipsFor(profile: Profile, approved: number): Tip[] {
  const more = Math.max(0, 3 - approved);
  return [
    { done: !!profile.photoUrl, label: "Main photo", todo: "Add a main photo", action: { tab: "photos" } },
    { done: approved >= 3, label: "3 or more photos", todo: approved ? `Add ${more} more photo${more > 1 ? "s" : ""}` : "Add 3 photos", action: { tab: "photos" } },
    { done: (profile.bio ?? "").trim().length >= 80, label: "About you", todo: "Write a bit more about you", action: { tab: "about" } },
    { done: !!profile.aboutFamily?.trim(), label: "Family background", todo: "Add your family background", action: { href: "/support" } },
  ];
}

function StrengthPanel({ profile, approved, waiting }: Readonly<{ profile: Profile; approved: number; waiting: number }>) {
  const { locked } = useKyc();
  const tips = tipsFor(profile, approved);
  const pct = Math.round((tips.filter((t) => t.done).length / tips.length) * 100);
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setW(pct), 300);
    return () => window.clearTimeout(t);
  }, [pct]);

  return (
    <aside aria-label="Profile strength" className="enter flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface-card p-5 shadow-sm lg:sticky lg:top-28">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h6 text-ink">Profile strength</h2>
        <span className="text-label-lg text-brand-text">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Profile strength"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-surface-muted"
      >
        <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${w}%` }} />
      </div>
      <p className="text-body-sm text-ink-secondary">{pct === 100 ? "Great, your profile is complete." : "Complete profiles get more interests."}</p>

      <ul className="flex flex-col gap-1">
        {tips.map((t) => (
          <li key={t.label}>
            {t.done ? (
              <span className="flex items-center gap-3 rounded-md px-2 py-2 text-body-sm text-ink">
                <TickCircle size={20} color="currentColor" variant="Bold" className="shrink-0 text-success-fg" />
                {t.label}
              </span>
            ) : (
              <TipAction tip={t} disabled={locked} />
            )}
          </li>
        ))}
      </ul>

      {waiting > 0 && (
        <p className="flex items-start gap-2 rounded-md bg-info-bg px-3 py-2.5 text-body-xs text-info-fg">
          <InfoCircle size={16} color="currentColor" className="mt-px shrink-0" />
          {waiting} photo{waiting > 1 ? "s are" : " is"} waiting for review. Members see {waiting > 1 ? "them" : "it"} once approved.
        </p>
      )}

      {!locked && (
        <Button variant="outline" size="md" fullWidth onClick={() => openEditProfile()} leftIcon={<Edit2 size={18} color="currentColor" />}>
          Edit profile
        </Button>
      )}
    </aside>
  );
}

function TipAction({ tip, disabled }: Readonly<{ tip: Tip; disabled: boolean }>) {
  const cls = cn(
    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-body-sm text-ink-secondary transition-colors",
    !disabled && "hover:bg-brand-subtle hover:text-ink",
  );
  const body = (
    <>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-icon-brand">
        <Add size={14} color="currentColor" />
      </span>
      <span className="flex-1">{tip.todo}</span>
    </>
  );
  if (disabled) return <span className={cls}>{body}</span>;
  if ("href" in tip.action) {
    return (
      <Link href={tip.action.href} className={cls}>
        {body}
        <span className="text-caption text-ink-tertiary">Ask support</span>
      </Link>
    );
  }
  const tab = tip.action.tab;
  return (
    <button type="button" onClick={() => openEditProfile(tab)} className={cls}>
      {body}
    </button>
  );
}

function PreviewSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]" aria-busy="true" aria-label="Loading your profile">
      <div className="hidden h-72 animate-pulse rounded-xl bg-surface-muted lg:block" />
      <div className="flex flex-col gap-6 rounded-xl border border-line bg-surface-card p-6">
        <div className="grid gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
          <div className="aspect-square animate-pulse rounded-lg bg-surface-muted" />
          <div className="flex flex-col gap-3">
            <div className="h-8 w-1/2 animate-pulse rounded bg-surface-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
            <div className="h-24 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
