"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { markSafetyEvent } from "@/lib/feedback";
import {
  ArrowLeft,
  ArrowRight2,
  ArrowLeft2,
  Book1,
  Briefcase,
  Calendar,
  Call,
  CloseCircle,
  Flag as FlagIcon,
  Gallery,
  Heart,
  Home2,
  Location,
  Lock1,
  Maximize4,
  People,
  Profile,
  Ruler,
  SearchNormal1,
  Sms,
  Star1,
  Teacher,
  TickCircle,
  Verify,
  Wallet2,
} from "iconsax-react";
import { createPortal } from "react-dom";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { ShareProfileDialog } from "@/components/profile/ShareProfileDialog";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { favouriteProfile, useFavourites, useIsConnected, useSentInterests } from "@/lib/connections";
import { useRouter } from "next/navigation";
import { requireMember, useSignedIn } from "@/lib/session";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Flag, type CountryCode } from "@/components/ui/Flag";
import { COUNTRIES } from "@/components/ui/PhoneField";
import type { ProfileKycDetails } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { type ProfileExtras } from "@/content/search";

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
  countryName?: string;
  details?: ProfileKycDetails | null;
  photo: string;
  horoscope: boolean;
  bio?: string;
  aboutFamily?: string;
  rasi?: string;
  nakshatra?: string;
}

const fallbackPhoto = (g: ViewProfile["gender"]) => (g === "groom" ? "/brand/groom.png" : "/brand/bride.png");

/**
 * Full-page profile view — same structure as Friends (Figma: Requests — Desktop 1440):
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
  backTo = "results",
}: {
  results: ViewProfile[];
  selected: ViewProfile;
  extrasById: Record<string, ProfileExtras>;
  onSelect: (p: ViewProfile) => void;
  onBack: () => void;
  /** where Back leads: the search results, or Home when the profile was opened from the Home page */
  backTo?: "results" | "home" | "dashboard";
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
                {backTo === "home" ? "Home" : backTo === "dashboard" ? "Dashboard" : "Search proposals"}
              </button>
              <span>/</span>
              <span aria-current="page" className="font-semibold text-brand-text">
                {selected.id}
              </span>
            </nav>
            <BackButton label={backTo === "home" ? "Back to home" : backTo === "dashboard" ? "Back to dashboard" : "Back to results"} onClick={onBack} />
            <h1 className="text-h3 text-ink md:text-h2">Profile details</h1>
            <p className="col-start-2 hidden text-body-md text-ink-secondary lg:block">{backTo === "results" ? "Browse your search results on the left" : "More profiles on the left"}. The full profile opens on the right.</p>
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

/** login = unlocks after login · contact = only after both members accept a contact share */
type LockKind = "login" | "contact";
type DetailItem = { icon: React.ElementType; label: string; value?: string | null; lock?: LockKind; placeholder?: string };
type DetailSection = { id: string; title: string; items: DetailItem[] };

/** One detail — icon tile + label + value (the profile-detail row style used across the app). */
function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-subtle text-icon-brand">
        <Icon size={20} color="currentColor" />
      </span>
      <span className="flex min-w-0 flex-col">
        <dt className="text-caption text-ink-tertiary">{label}</dt>
        <dd className="break-words text-body-md font-semibold text-ink">{value}</dd>
      </span>
    </div>
  );
}

/**
 * Hidden detail — same row, lock badge on the icon and a blurred PLACEHOLDER value
 * (real data is never rendered for people who can't see it). Tap → login popup / explanation.
 */
function LockedRow({ icon: Icon, label, placeholder, hint, onOpen }: { icon: React.ElementType; label: string; placeholder: string; hint: string; onOpen: () => void }) {
  return (
    <div className="min-w-0">
      <dt className="sr-only">{label}</dt>
      <dd>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${label}: hidden. ${hint}`}
          className="group -m-1.5 flex w-[calc(100%+12px)] min-w-0 items-start gap-3 rounded-[14px] p-1.5 text-left transition-colors hover:bg-brand-subtle focus-visible:shadow-ring-brand"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-subtle text-icon-brand">
            <Icon size={20} color="currentColor" />
            <span className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand-gradient text-ink-on-brand ring-2 ring-surface-card">
              <Lock1 size={10} color="currentColor" variant="Bold" />
            </span>
          </span>
          <span className="flex min-w-0 flex-col" aria-hidden>
            <span className="text-caption text-ink-tertiary">{label}</span>
            <span className="select-none truncate text-body-md font-semibold text-ink blur-[5px]">{placeholder}</span>
            <span className="mt-0.5 text-caption font-semibold text-brand-text opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{hint}</span>
          </span>
        </button>
      </dd>
    </div>
  );
}

const iconButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface-card text-brand shadow-xs transition-colors hover:border-brand hover:bg-brand-subtle focus-visible:shadow-ring-brand active:scale-95";

function Detail({ p, x, onInterest }: { p: ViewProfile; x?: ProfileExtras; onInterest: (p: ViewProfile) => boolean }) {
  const toast = useToast();
  const signedIn = useSignedIn();
  const { profiles: favourites, save } = useFavourites();
  const saved = favourites.some((profile) => profile.id === p.id);
  const { profiles: sentInterests } = useSentInterests();
  const sent = sentInterests.some((profile) => profile.id === p.id);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  // Demo gallery: the API will return each member’s photos; for now the main photo is shown in a few framings
  const photos = useMemo(() => galleryOf(p, x?.photos ?? 1), [p, x?.photos]);
  const [reported, setReported] = useState(false);
  const connected = useIsConnected(p.id);
  const router = useRouter();
  const country = p.countryName || COUNTRIES.find((c) => c.iso === p.country)?.name;

  // Sections — empty values are hidden; guest-only fields are collected into one "unlock" box
  const sections: DetailSection[] = [
    {
      id: "basic",
      title: "Basic details",
      items: [
        { icon: Profile, label: "Profile ID", value: p.id },
        { icon: Calendar, label: "Age", value: `${p.age} years` },
        { icon: People, label: "Gender", value: p.gender === "groom" ? "Male" : "Female" },
        { icon: Ruler, label: "Height", value: p.height },
        { icon: Ruler, label: "Weight", value: p.details?.weightKg ? `${p.details.weightKg} kg` : null, lock: "login", placeholder: "62 kg" },
        { icon: Heart, label: "Civil status", value: x?.civil ?? "Never married" },
        { icon: Profile, label: "Created by", value: x?.postedBy ?? "Self" },
      ],
    },
    {
      id: "background",
      title: "Religion and background",
      items: [
        { icon: Book1, label: "Religion", value: p.religion },
        { icon: People, label: "Ethnicity", value: x?.ethnicity },
        { icon: People, label: "Caste", value: p.details?.caste },
      ],
    },
    {
      id: "career",
      title: "Education and career",
      items: [
        { icon: Teacher, label: "Education", value: p.education || x?.education },
        { icon: Briefcase, label: "Profession", value: p.profession },
        { icon: Wallet2, label: "Monthly income", value: p.details?.monthlySalaryRange, lock: "login", placeholder: "LKR 250,000+" },
      ],
    },
    {
      id: "location",
      title: "Location",
      items: [
        { icon: Location, label: "Lives in", value: p.location },
        { icon: Location, label: "Resident country", value: country },
        { icon: Location, label: "District", value: p.details?.district || x?.district },
      ],
    },
    {
      id: "horoscope",
      title: "Horoscope",
      items: [
        { icon: Star1, label: "Horoscope", value: p.horoscope ? "Available" : "On request" },
        { icon: Star1, label: "Rasi", value: p.rasi },
        { icon: Star1, label: "Nakshatra", value: p.nakshatra },
        { icon: Star1, label: "Zodiac sign", value: p.details?.zodiacSign, lock: "login", placeholder: "Kanya (Virgo)" },
      ],
    },
    {
      id: "contact",
      title: "Contact details",
      items: [
        { icon: Call, label: "Mobile", lock: "contact", placeholder: "+94 77 123 4567" },
        { icon: Sms, label: "Email", lock: "contact", placeholder: "name@gmail.com" },
      ],
    },
  ];
  // hidden: guests can't see "login" fields; nobody sees contact details until both accept a contact share
  const isHidden = (i: DetailItem) => i.lock === "contact" || (i.lock === "login" && !signedIn);
  const visible = sections
    .map((s) => ({ ...s, items: s.items.filter((i) => isHidden(i) || (i.value && i.value !== "—")) }))
    .filter((s) => s.items.length > 0);
  const lockHint = (i: DetailItem) => (!signedIn ? "Log in to view" : connected ? "Share contacts in chat" : "Shared after you both agree");
  const openLocked = (i: DetailItem) => {
    if (!requireMember(i.lock === "contact" ? "see contact details" : `see ${i.label.toLowerCase()}`)) return;
    if (connected) router.push("/messages");
    else toast.info("Contact details are private", `Send an interest. When ${p.id} accepts, you can both agree to share mobile and WhatsApp numbers in chat.`);
  };
  const share = () => {
    if (!requireMember("share profiles")) return;
    const url = new URL("/search", window.location.origin);
    url.searchParams.set("id", p.id);
    setShareUrl(url.toString());
  };
  const favourite = () => {
    if (!requireMember("shortlist profiles")) return;
    if (save(favouriteProfile({ ...p, photo: p.photo || fallbackPhoto(p.gender) }))) {
      toast.success("Added to favourites", `${p.id} is saved to your favourites.`);
    }
  };
  const send = () => {
    if (!requireMember("send an interest")) return;
    if (sent) return;
    onInterest(p);
  };
  const openPhoto = (i: number) => requireMember("view photos") && setViewer(i);

  const thumbs = photos.slice(1, 5);
  const extra = photos.length - 5;

  return (
    <article aria-label={`${p.id} profile`} className="flex min-w-0 animate-fade-up flex-col gap-8 rounded-xl border border-line bg-surface-card p-4 shadow-sm sm:p-6 lg:p-8">
      {/* ── Top: square photo + thumbnails | summary ───────────────── */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-8">
        <div className="flex flex-col gap-2">
          <div className="group relative aspect-square w-full overflow-hidden rounded-lg bg-surface-muted">
            <button type="button" aria-label={`View ${p.id} photos`} onClick={() => openPhoto(0)} className="absolute inset-0 cursor-zoom-in">
              <Photo p={p} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.25)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <span className="flex items-center gap-2 rounded-full bg-surface-card px-4 py-2 text-label-md text-ink shadow-md">
                  <Maximize4 size={16} color="currentColor" /> View photos
                </span>
              </span>
            </button>
            <span className="pointer-events-none absolute left-3 top-3">
              <Badge tone="success">Photo verified</Badge>
            </span>
          </div>
          {thumbs.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {thumbs.map((ph, i) => {
                const n = i + 1;
                const more = i === thumbs.length - 1 && extra > 0;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={more ? `View all ${photos.length} photos` : `View photo ${n + 1}`}
                    onClick={() => openPhoto(n)}
                    className="relative aspect-square overflow-hidden rounded-[12px] bg-surface-muted ring-brand transition-shadow hover:ring-2 focus-visible:ring-2"
                  >
                    <GalleryImg photo={ph} />
                    {more && (
                      <span className="absolute inset-0 flex items-center justify-center bg-surface-scrim text-label-lg text-ink-on-brand">+{extra}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h1 className="flex items-center gap-2 text-h4 text-ink md:text-h3">
                {p.name || p.id} <Verify size={22} color="currentColor" variant="Bold" className="shrink-0 text-gold-500" />
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
                {/* who manages the profile — families care whether a parent or the member posted it */}
                <Badge tone="neutral">Created by {(x?.postedBy ?? "Self") === "Self" ? "self" : x?.postedBy}</Badge>
                {p.horoscope && <Badge tone="info">Horoscope</Badge>}
                {x && <Badge tone="neutral" icon={false}>{x.posted}</Badge>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" aria-haspopup="dialog" aria-label="Share profile" onClick={share} className={iconButton}>
                <Share2 size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-pressed={saved}
                aria-label={saved ? "Saved to favourites" : "Add to favourites"}
                onClick={favourite}
                className={cn(iconButton, saved && "border-brand bg-brand-subtle")}
              >
                <Heart size={20} color="currentColor" variant={saved ? "Bold" : "Linear"} />
              </button>
            </div>
          </div>

          {/* key facts families look at first */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            <DetailRow icon={Calendar} label="Age" value={`${p.age} years`} />
            <DetailRow icon={Ruler} label="Height" value={p.height} />
            <DetailRow icon={Book1} label="Religion" value={p.religion} />
            <DetailRow icon={Briefcase} label="Profession" value={p.profession} />
          </dl>

          <div className="flex flex-col gap-1.5">
            <h2 className="text-label-md text-ink-tertiary">About {p.name || p.id}</h2>
            <p className="line-clamp-4 text-body-md text-ink-secondary">{p.bio?.trim() || "No bio provided"}</p>
          </div>

          <div className="mt-auto">
            <ProfileActions profileId={p.id} sent={sent} onSend={send} />
          </div>
        </div>
      </div>

      {sent && (
        <div className="-mt-2 flex animate-fade-up items-center gap-3 rounded-[16px] bg-success-bg p-4 text-success-fg">
          <TickCircle size={22} color="currentColor" variant="Bold" />
          <p className="text-body-sm">
            <span className="block font-semibold">Interest sent</span>
            We’ll let you know as soon as {p.id} replies.
          </p>
        </div>
      )}

      {/* ── Sections ───────────────────────────────────────────────── */}
      {visible.map((s) => (
        <section key={s.id} id={`pv-${s.id}`} aria-labelledby={`pv-${s.id}-title`} className="flex scroll-mt-28 flex-col gap-4">
          <h2 id={`pv-${s.id}-title`} className="flex items-center gap-2.5 text-h5 text-ink">
            <span aria-hidden className="h-5 w-1 rounded-full bg-brand-gradient" />
            {s.title}
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-x-6 xl:grid-cols-3">
            {s.items.map((d) =>
              isHidden(d) ? (
                <LockedRow key={d.label} icon={d.icon} label={d.label} placeholder={d.placeholder ?? "Hidden"} hint={lockHint(d)} onOpen={() => openLocked(d)} />
              ) : (
                <DetailRow key={d.label} icon={d.icon} label={d.label} value={d.value as string} />
              ),
            )}
          </dl>
        </section>
      ))}

      {p.aboutFamily && (
        <section id="pv-family" aria-labelledby="pv-family-title" className="flex scroll-mt-28 flex-col gap-3">
          <h2 id="pv-family-title" className="flex items-center gap-2.5 text-h5 text-ink">
            <span aria-hidden className="h-5 w-1 rounded-full bg-brand-gradient" />
            Family background
          </h2>
          <p className="text-body-md text-ink-secondary">{p.aboutFamily}</p>
        </section>
      )}

      <div className="-mt-2 flex justify-end">
        <button
          type="button"
          disabled={reported}
          onClick={() => requireMember("report a profile") && setReportOpen(true)}
          className="flex items-center gap-1.5 px-2 text-label-md text-ink-tertiary transition-colors hover:text-error-fg disabled:pointer-events-none disabled:text-success-fg"
        >
          {reported ? <TickCircle size={16} color="currentColor" /> : <FlagIcon size={16} color="currentColor" />}
          {reported ? "Reported" : "Report profile"}
        </button>
      </div>

      {shareUrl && <ShareProfileDialog url={shareUrl} onClose={() => setShareUrl(null)} />}

      {/* portals: the article animates (transform), which would trap position:fixed */}
      {viewer !== null && createPortal(<PhotoViewer id={p.id} photos={photos} start={viewer} onClose={() => setViewer(null)} />, document.body)}

      {reportOpen && createPortal(<ReportModal
        id={p.id}
        open={reportOpen}
        onCancel={() => setReportOpen(false)}
        onSubmit={() => {
          setReportOpen(false);
          if (!requireMember("report a profile")) return;
          setReported(true);
          markSafetyEvent();
          toast.success("Report submitted", `Thank you, our safety team will review ${p.id} within 24 hours.`);
        }}
      />, document.body)}
    </article>
  );
}

const REPORT_REASONS = [
  "Fake or misleading profile",
  "Photos are not of this person",
  "Asked for money or bank details",
  "Already married or in a relationship",
  "Rude or inappropriate behaviour",
  "Other",
];

/** Report profile — simple dialog: reason (required) + details, then Submit. Same style as the Block dialog. */
function ReportModal({ id, open, onCancel, onSubmit }: { id: string; open: boolean; onCancel: () => void; onSubmit: () => void }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [tried, setTried] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setDetails("");
    setTried(false);
    setClosing(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(onCancel);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function close(after: () => void) {
    setClosing(true);
    window.setTimeout(after, 180);
  }
  const needsDetails = reason === "Other" && details.trim().length < 10;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!reason || needsDetails) return;
    close(onSubmit);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        aria-hidden
        onClick={() => close(onCancel)}
        className={cn("absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200", closing ? "opacity-0" : "animate-fade-in")}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onSubmit={submit}
        className={cn("relative flex w-full max-w-[460px] flex-col gap-5 rounded-xl bg-surface-card p-6 shadow-xl transition-all duration-200", closing ? "scale-95 opacity-0" : "animate-dialog-in")}
      >
        <button type="button" aria-label="Close" onClick={() => close(onCancel)} className="absolute right-4 top-4 text-ink-tertiary transition-colors hover:text-ink">
          <CloseCircle size={22} color="currentColor" />
        </button>
        <div className="flex items-center gap-3 pr-8">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-bg text-error-fg">
            <FlagIcon size={22} color="currentColor" />
          </span>
          <div>
            <h2 id="report-title" className="text-h5 text-ink">
              Report {id}
            </h2>
            <p className="text-body-sm text-ink-secondary">Reports are private. The member won’t know it was you.</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Select label="Reason" placeholder="Choose a reason" options={REPORT_REASONS} value={reason} onChange={setReason} searchable={false} />
          {tried && !reason && <p className="text-body-xs text-error-fg">Please choose a reason.</p>}
        </div>

        <Textarea
          label="Tell us more"
          hint={reason === "Other" ? "Required" : "Optional"}
          value={details}
          onChange={setDetails}
          maxLength={300}
          rows={3}
          placeholder="What happened? Add anything that helps our safety team."
          error={tried && needsDetails ? "Please add a few words about the problem." : undefined}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => close(onCancel)}>
            Cancel
          </Button>
          <Button type="submit" variant="danger">
            Submit report
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Photo viewer — full-screen modal, swipe / scroll between photos      */
/* ------------------------------------------------------------------ */
interface GalleryPhoto {
  src: string;
  fallback: string;
  /** demo framing of the same photo */
  zoom: number;
  origin: string;
}

const FRAMES = [
  { zoom: 1, origin: "50% 50%" },
  { zoom: 1.45, origin: "50% 22%" },
  { zoom: 1.2, origin: "35% 60%" },
  { zoom: 1.3, origin: "65% 40%" },
  { zoom: 1.6, origin: "50% 35%" },
  { zoom: 1.15, origin: "50% 80%" },
];

function galleryOf(p: ViewProfile, count: number): GalleryPhoto[] {
  const src = p.photo || fallbackPhoto(p.gender);
  return Array.from({ length: Math.max(1, Math.min(count, FRAMES.length)) }, (_, i) => ({ src, fallback: fallbackPhoto(p.gender), ...FRAMES[i] }));
}

function GalleryImg({ photo, className, contain }: { photo: GalleryPhoto; className?: string; contain?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.src}
      alt=""
      draggable={false}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.endsWith(photo.fallback)) img.src = photo.fallback;
      }}
      style={{ transform: `scale(${photo.zoom})`, transformOrigin: photo.origin }}
      className={cn("h-full w-full select-none", contain ? "object-contain" : "object-cover", className)}
    />
  );
}

function PhotoViewer({ id, photos, start, onClose }: { id: string; photos: GalleryPhoto[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const [closing, setClosing] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setClosing(true);
    window.setTimeout(onClose, 180);
  };
  const go = (i: number, smooth = true) => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  };

  // open on the chosen photo, lock page scroll, keyboard ← → Esc
  useEffect(() => {
    go(start, false);
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(indexRef.current + 1);
      if (e.key === "ArrowLeft") go(indexRef.current - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const indexRef = useRef(index);
  indexRef.current = index;

  // follow swipe / trackpad scroll
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== indexRef.current) setIndex(i);
  };
  // vertical mouse wheel moves between photos too
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX) || Math.abs(e.deltaY) < 30) return;
    go(index + (e.deltaY > 0 ? 1 : -1));
  };
  useEffect(() => {
    thumbsRef.current?.children[index]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`${id} photos`} className="fixed inset-0 z-[100] flex flex-col">
      <div aria-hidden onClick={close} className={cn("absolute inset-0 bg-[rgba(10,6,8,0.94)] backdrop-blur-sm transition-opacity duration-200", closing ? "opacity-0" : "animate-fade-in")} />

      <div className={cn("relative flex min-h-0 flex-1 flex-col transition-all duration-200", closing ? "scale-[0.98] opacity-0" : "animate-dialog-in")}>
        {/* top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6">
          <p className="flex items-center gap-2 text-label-lg">
            <Gallery size={20} color="currentColor" />
            {id}
            <span className="text-body-sm text-[rgba(255,255,255,0.6)]">
              {index + 1} / {photos.length}
            </span>
          </p>
          <button type="button" aria-label="Close photos" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)] text-white transition-colors hover:bg-[rgba(255,255,255,0.24)]">
            <CloseCircle size={24} color="currentColor" />
          </button>
        </div>

        {/* slides — scroll-snap, swipe on touch, wheel / arrows on desktop */}
        <div className="relative min-h-0 flex-1">
          <div ref={trackRef} onScroll={onScroll} onWheel={onWheel} className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-contain scrollbar-none">
            {photos.map((ph, i) => (
              <div key={i} className="flex h-full w-full shrink-0 snap-center items-center justify-center px-4 sm:px-20">
                <div className="relative h-full max-h-[78vh] w-full max-w-[560px] overflow-hidden rounded-lg bg-black shadow-xl">
                  <GalleryImg photo={ph} />
                </div>
              </div>
            ))}
          </div>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                disabled={index === 0}
                onClick={() => go(index - 1)}
                className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-surface-card text-ink shadow-lg transition-all hover:scale-105 hover:text-brand disabled:pointer-events-none disabled:opacity-30 sm:flex lg:left-8"
              >
                <ArrowLeft2 size={22} color="currentColor" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                disabled={index === photos.length - 1}
                onClick={() => go(index + 1)}
                className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-surface-card text-ink shadow-lg transition-all hover:scale-105 hover:text-brand disabled:pointer-events-none disabled:opacity-30 sm:flex lg:right-8"
              >
                <ArrowRight2 size={22} color="currentColor" />
              </button>
            </>
          )}
        </div>

        {/* thumbnails + dots */}
        <div className="flex flex-col items-center gap-3 px-4 pb-5 pt-4">
          <div ref={thumbsRef} className="flex max-w-full gap-2 overflow-x-auto px-1 py-1 scrollbar-none">
            {photos.map((ph, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={cn(
                  "h-16 w-14 shrink-0 overflow-hidden rounded-[10px] transition-all duration-200",
                  i === index ? "ring-2 ring-brand ring-offset-2 ring-offset-black" : "opacity-50 hover:opacity-90",
                )}
              >
                <GalleryImg photo={ph} />
              </button>
            ))}
          </div>
          <p className="text-caption text-[rgba(255,255,255,0.55)]">Swipe, scroll or use ← → to browse · Esc to close</p>
        </div>
      </div>
    </div>
  );
}
