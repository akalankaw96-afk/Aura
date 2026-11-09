"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight2,
  Book1,
  Briefcase,
  Calendar,
  Flag as FlagIcon,
  Gallery,
  Heart,
  HeartAdd,
  Home2,
  Location,
  Lock1,
  MessageText,
  People,
  Profile,
  Ruler,
  SearchNormal1,
  Share,
  Star1,
  Teacher,
  TickCircle,
  Verify,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Flag, type CountryCode } from "@/components/ui/Flag";
import { useToast } from "@/components/ui/Toast";
import { matchLabel, type ProfileExtras } from "@/content/search";

export interface ViewProfile {
  id: string;
  name?: string;
  gender: "bride" | "groom";
  age: number;
  height: string;
  profession: string;
  education?: string;
  religion: string;
  location: string;
  country: CountryCode;
  photo: string;
  horoscope: boolean;
  bio?: string;
  aboutFamily?: string;
  rasi?: string;
  nakshatra?: string;
}

const fallbackPhoto = (g: ViewProfile["gender"]) => (g === "groom" ? "/brand/groom.png" : "/brand/bride.png");

/**
 * Full-page profile view — same structure as Requests (Figma: Requests — Desktop 1440):
 * left: the search results list (400 wide, sticky, scrolls on its own),
 * right: the selected profile in full. Mobile: detail only, with "Back to results".
 */
export function ProfileView({
  results,
  selected,
  extrasById,
  onSelect,
  onBack,
  onInterest,
}: {
  results: ViewProfile[];
  selected: ViewProfile;
  extrasById: Record<string, ProfileExtras>;
  onSelect: (p: ViewProfile) => void;
  onBack: () => void;
  /** false when the interest couldn’t be sent (free limit reached) */
  onInterest: (p: ViewProfile) => boolean;
}) {
  const [query, setQuery] = useState("");
  // keep the opened profile in the list even if the current filters exclude it
  const all = useMemo(() => (results.some((r) => r.id === selected.id) ? results : [selected, ...results]), [results, selected]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((p) => `${p.id} ${p.name ?? ""} ${p.location} ${p.profession}`.toLowerCase().includes(q)) : all;
  }, [all, query]);
  const index = all.findIndex((p) => p.id === selected.id);

  // bring the active row into view inside the list
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: "nearest" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selected.id]);

  return (
    <>
      <main className="container-page flex flex-1 flex-col pb-20 pt-6 lg:pt-8">
        {/* Page header — same as Messages / Requests: Back Button left of the title */}
        <div className="enter mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-4 gap-y-1">
            <nav aria-label="Breadcrumb" className="col-start-2 flex items-center gap-2 text-body-sm text-ink-tertiary">
              <button type="button" onClick={onBack} className="transition-colors hover:text-brand">
                Search proposals
              </button>
              <span>/</span>
              <span aria-current="page" className="font-semibold text-brand-text">
                {selected.id}
              </span>
            </nav>
            <BackButton label="Back to results" onClick={onBack} />
            <h1 className="text-h3 text-ink md:text-h2">Profile details</h1>
            <p className="col-start-2 text-body-md text-ink-secondary">Browse your search results on the left — the full profile opens on the right.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-ink-tertiary">
              {index + 1} of {all.length}
            </span>
            <button
              type="button"
              aria-label="Previous profile"
              disabled={index <= 0}
              onClick={() => onSelect(all[index - 1])}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-card text-ink shadow-xs transition-colors hover:border-brand hover:bg-brand-subtle hover:text-brand disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowLeft size={18} color="currentColor" />
            </button>
            <button
              type="button"
              aria-label="Next profile"
              disabled={index >= all.length - 1}
              onClick={() => onSelect(all[index + 1])}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-card text-ink shadow-xs transition-colors hover:border-brand hover:bg-brand-subtle hover:text-brand disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowRight2 size={18} color="currentColor" />
            </button>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* Left — search results (Figma: Request list, 400 wide, padding 12, gap 4) */}
        <section
          aria-label="Search results"
          className="enter hidden min-w-0 flex-col gap-1 rounded-xl border border-line bg-surface-card p-3 shadow-sm lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-120px)]"
        >
          <label className="mb-1 flex h-11 shrink-0 items-center gap-2 rounded-[12px] bg-surface-subtle px-3.5 text-ink-tertiary focus-within:ring-2 focus-within:ring-brand-focus">
            <SearchNormal1 size={18} color="currentColor" />
            <span className="sr-only">Find in results</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find by ID, city or profession" className="w-full bg-transparent text-body-sm text-ink outline-none" />
          </label>
          <p className="px-1 pb-1 text-caption text-ink-tertiary">{list.length} proposals in your search</p>
          <div ref={listRef} className="-mx-1 flex min-h-0 flex-col gap-1 overflow-y-auto px-1 scrollbar-none">
            {list.length === 0 && <p className="px-3 py-10 text-center text-body-sm text-ink-tertiary">No proposals match “{query}”.</p>}
            {list.map((p) => {
              const on = p.id === selected.id;
              const x = extrasById[p.id];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p)}
                  aria-current={on}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] p-3 text-left transition-colors",
                    on ? "bg-brand-subtle ring-[1.5px] ring-inset ring-brand" : "hover:bg-surface-subtle",
                  )}
                >
                  <Photo p={p} className="h-14 w-14 rounded-full" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("flex items-center gap-1.5 text-label-lg", on ? "text-brand-text" : "text-ink")}>
                      {p.id} <Verify size={14} color="currentColor" variant="Bold" className="text-icon-brand" />
                    </span>
                    <span className="truncate text-body-sm text-ink-secondary">
                      {p.age} yrs · {p.profession}
                    </span>
                    <span className="flex items-center gap-1 truncate text-caption text-ink-tertiary">
                      <Flag country={p.country} /> {p.location}
                    </span>
                  </span>
                  {x && <span className="shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-label-sm text-success-fg">{x.match}%</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Right — profile detail */}
          <Detail key={selected.id} p={selected} x={extrasById[selected.id]} onInterest={onInterest} />
        </div>
      </main>
    </>
  );
}

function Photo({ p, className }: { p: ViewProfile; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={p.photo || fallbackPhoto(p.gender)}
      alt=""
      onError={(e) => {
        const img = e.currentTarget;
        const fb = fallbackPhoto(p.gender);
        if (!img.src.endsWith(fb)) img.src = fb;
      }}
      className={cn("shrink-0 bg-surface-muted object-cover", className)}
    />
  );
}

function Detail({ p, x, onInterest }: { p: ViewProfile; x?: ProfileExtras; onInterest: (p: ViewProfile) => boolean }) {
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");
  const blocked = /(\+?\d[\d\s-]{6,}\d)|(https?:\/\/|www\.)/i.test(note);

  const details: { icon: React.ElementType; label: string; value: string }[] = [
    { icon: Calendar, label: "Age", value: `${p.age} years` },
    { icon: Ruler, label: "Height", value: p.height },
    { icon: Book1, label: "Religion", value: p.religion },
    { icon: People, label: "Ethnicity", value: x?.ethnicity ?? "—" },
    { icon: Briefcase, label: "Profession", value: p.profession },
    { icon: Teacher, label: "Education", value: p.education || x?.education || "—" },
    { icon: Heart, label: "Civil status", value: x?.civil ?? "Never married" },
    { icon: Location, label: "Lives in", value: p.location },
    { icon: Profile, label: "Posted by", value: x?.postedBy ?? "Self" },
    { icon: Star1, label: "Horoscope", value: p.horoscope ? "Available" : "On request" },
  ];

  const share = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/search?id=${p.id}`);
    toast.success("Link copied", `Share ${p.id} with your family.`);
  };
  const send = () => {
    if (blocked || sent) return;
    if (onInterest(p)) setSent(true);
  };

  return (
    <article aria-label={`${p.id} profile`} className="flex min-w-0 animate-fade-up flex-col gap-6 rounded-xl border border-line bg-surface-card p-4 shadow-sm sm:p-6">

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Photo 280 × 340 */}
        <div className="relative aspect-[280/340] w-full shrink-0 overflow-hidden rounded-lg bg-surface-muted md:w-[280px]">
          <Photo p={p} className="absolute inset-0 h-full w-full" />
          <span className="absolute left-3 top-3">
            <Badge tone="success">Photo verified</Badge>
          </span>
          {x && (
            <span className="absolute bottom-3 left-3 inline-flex h-[22px] items-center gap-1 rounded-full bg-surface-scrim px-2 text-label-sm text-ink-on-brand backdrop-blur-[8px]">
              <Gallery size={14} color="currentColor" /> {x.photos} photos
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h1 className="flex items-center gap-2 text-h4 text-ink md:text-h3">
                {p.id} <Verify size={22} color="currentColor" variant="Bold" className="shrink-0 text-gold-500" />
              </h1>
              <p className="flex flex-wrap items-center gap-1.5 text-body-md text-ink-secondary">
                <Flag country={p.country} /> {p.location}
                {x && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1 text-label-sm text-success-fg">
                      <span className="h-2 w-2 rounded-full bg-success-fg" /> {x.active}
                    </span>
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge tone="success">ID verified</Badge>
                {p.horoscope && <Badge tone="info">Horoscope</Badge>}
                {x && <Badge tone="neutral">{x.posted}</Badge>}
              </div>
            </div>
            {x && (
              <div className="flex shrink-0 flex-col items-center gap-0.5 rounded-[16px] bg-success-bg px-3 py-2 text-success-fg">
                <span className="text-h5">{x.match}%</span>
                <span className="text-caption">{matchLabel(x.match)}</span>
              </div>
            )}
          </div>

          <dl className="grid gap-x-3 gap-y-4 sm:grid-cols-2">
            {details.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.label} className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-subtle text-icon-brand">
                    <Icon size={18} color="currentColor" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <dt className="text-caption text-ink-tertiary">{d.label}</dt>
                    <dd className="truncate text-body-sm font-semibold text-ink">{d.value}</dd>
                  </span>
                </div>
              );
            })}
          </dl>
        </div>
      </div>

      {p.bio && (
        <section className="flex flex-col gap-2">
          <h2 className="text-h6 text-ink">About</h2>
          <p className="text-body-md text-ink-secondary">{p.bio}</p>
        </section>
      )}

      {p.aboutFamily && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-h6 text-ink">
            <Home2 size={18} color="currentColor" className="text-icon-brand" /> Family background
          </h2>
          <p className="text-body-md text-ink-secondary">{p.aboutFamily}</p>
        </section>
      )}

      {p.horoscope && (p.rasi || p.nakshatra) && (
        <section className="flex flex-col gap-3 rounded-[16px] border border-premium-line bg-premium-bg p-4">
          <h2 className="flex items-center gap-2 text-h6 text-premium-fg">
            <Star1 size={18} color="currentColor" /> Horoscope
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-body-sm">
            {p.rasi && (
              <span>
                <span className="text-ink-tertiary">Rasi </span>
                <span className="font-semibold text-ink">{p.rasi}</span>
              </span>
            )}
            {p.nakshatra && (
              <span>
                <span className="text-ink-tertiary">Nakshatra </span>
                <span className="font-semibold text-ink">{p.nakshatra}</span>
              </span>
            )}
          </div>
        </section>
      )}

      {/* Contact — unlocked after both accept */}
      <section className="flex items-center gap-3 rounded-[16px] bg-surface-subtle p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-card text-icon-brand">
          <Lock1 size={20} color="currentColor" />
        </span>
        <p className="flex-1 text-body-sm text-ink-secondary">
          <span className="block font-semibold text-ink">Contact details & chat are private</span>
          Phone, WhatsApp and messages unlock when {p.id} accepts your interest.
        </p>
      </section>

      {/* Interest note */}
      {sent ? (
        <div className="flex animate-fade-up items-center gap-3 rounded-[16px] bg-success-bg p-4 text-success-fg">
          <TickCircle size={22} color="currentColor" variant="Bold" />
          <p className="text-body-sm">
            <span className="block font-semibold">Interest sent</span>
            We’ll let you know as soon as {p.id} replies.
          </p>
        </div>
      ) : (
        <label className="flex flex-col gap-2">
          <span className="text-label-md text-ink">Add a short note (optional)</span>
          <textarea
            rows={2}
            maxLength={150}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Our family liked your profile and would love to connect."
            className={cn(
              "w-full resize-none rounded-md border bg-surface-subtle px-4 py-3 text-body-md text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-brand-focus",
              blocked ? "border-error-fg" : "border-line",
            )}
          />
          <span className={cn("text-caption", blocked ? "text-error-fg" : "text-ink-tertiary")}>
            {blocked ? "Phone numbers and links can’t be shared before you both accept." : `${note.length}/150`}
          </span>
        </label>
      )}

      <div className="h-px bg-line" />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? "Remove from shortlist" : "Add to shortlist"}
          onClick={() => {
            setSaved(!saved);
            if (!saved) toast.success("Added to shortlist", `${p.id} is saved to your shortlist.`);
          }}
          className={cn("flex h-12 w-12 items-center justify-center rounded-full border transition-colors", saved ? "border-brand bg-brand-subtle text-brand" : "border-line-strong text-icon-brand hover:bg-brand-subtle")}
        >
          <Heart size={20} color="currentColor" variant={saved ? "Bold" : "Linear"} />
        </button>
        <button type="button" aria-label="Share profile" onClick={share} className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong text-icon-brand transition-colors hover:bg-brand-subtle">
          <Share size={20} color="currentColor" />
        </button>
        <button
          type="button"
          onClick={() => toast.info("Report received", `Our team will review ${p.id}. Thank you for keeping Vikasitha safe.`)}
          className="flex items-center gap-1.5 px-2 text-label-md text-ink-tertiary transition-colors hover:text-error-fg"
        >
          <FlagIcon size={16} color="currentColor" /> Report
        </button>
        <div className="flex-1" />
        <div className="flex gap-3 max-sm:w-full">
          <Link
            href="/messages"
            onClick={(e) => {
              if (!sent) {
                e.preventDefault();
                toast.info("Chat unlocks after they accept", `Send an interest to ${p.id} first.`);
              }
            }}
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong px-5 text-button-md text-ink transition-colors hover:border-brand hover:text-brand max-sm:flex-1"
          >
            <MessageText size={18} color="currentColor" /> Message
          </Link>
          <Button size="md" className="max-sm:flex-1" disabled={sent || blocked} onClick={send}>
            {sent ? <TickCircle size={18} color="currentColor" /> : <HeartAdd size={18} color="currentColor" />}
            {sent ? "Interest sent" : "Send interest"}
          </Button>
        </div>
      </div>
    </article>
  );
}
