"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Book1,
  Briefcase,
  Calendar,
  Heart,
  Location,
  MessageText,
  People,
  Ruler,
  SearchNormal1,
  Teacher,
  Verify,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Flag } from "@/components/ui/Flag";
import { useToast } from "@/components/ui/Toast";
import { MemberShell } from "@/components/layout/MemberShell";
import { REQUEST_PROFILES, REQUEST_TABS, type RequestProfile, type RequestTab } from "@/content/dashboard";

const DETAIL_ICONS = { calendar: Calendar, ruler: Ruler, book: Book1, people: People, briefcase: Briefcase, teacher: Teacher, heart: Heart, location: Location };

/**
 * Figma: 📊 Member Dashboard → Requests — Desktop 1440.
 * Tabs (Received / Sent / Accepted) · Request list (400 wide) · Profile detail.
 * Mobile: the list first; picking a request opens its detail with a Back button.
 */
export function RequestsScreen() {
  const toast = useToast();
  const [tab, setTab] = useState<RequestTab>("received");
  const [query, setQuery] = useState("");
  // accepted / declined move requests between tabs (mock — no API)
  const [moved, setMoved] = useState<Record<string, RequestTab | "declined">>({});
  const tabOf = (p: RequestProfile) => moved[p.id] ?? p.tab;
  const inTab = (t: RequestTab) => REQUEST_PROFILES.filter((p) => tabOf(p) === t);
  const list = useMemo(
    () => inTab(tab).filter((p) => `${p.fullName} ${p.id}`.toLowerCase().includes(query.trim().toLowerCase())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, query, moved],
  );
  const [selectedId, setSelectedId] = useState<string | null>(REQUEST_PROFILES[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const selected = list.find((p) => p.id === selectedId) ?? list[0] ?? null;

  const pick = (id: string) => {
    setSelectedId(id);
    setMobileOpen(true);
  };
  const switchTab = (t: RequestTab) => {
    setTab(t);
    setSelectedId(null);
    setMobileOpen(false);
  };

  const accept = (p: RequestProfile) => {
    setMoved((m) => ({ ...m, [p.id]: "accepted" }));
    setTab("accepted");
    setSelectedId(p.id);
    toast.success("Interest accepted", `You can now message ${p.name}. Photos and contacts are unlocked.`);
  };
  const decline = (p: RequestProfile) => {
    setMoved((m) => ({ ...m, [p.id]: "declined" }));
    setSelectedId(null);
    setMobileOpen(false);
    toast.info("Request declined", `${p.name} won’t be notified.`);
  };

  return (
    <MemberShell
      crumb="Requests"
      title="Interest requests"
      subtitle="Members who are interested in your profile. Accept to unlock photos and messages."
      right={
        <div role="tablist" aria-label="Requests" className="flex w-fit gap-1 rounded-full border border-line bg-surface-card p-1">
          {REQUEST_TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => switchTab(t.id)}
                className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-label-md transition-colors", on ? "bg-brand-gradient text-ink-on-brand" : "text-ink-secondary hover:text-ink")}
              >
                {t.label}
                <span className={cn("rounded-full px-1.5 text-label-sm", on ? "bg-[rgba(255,255,255,0.25)]" : "bg-brand-subtle text-brand-text")}>{inTab(t.id).length}</span>
              </button>
            );
          })}
        </div>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* Figma: Request list — 400 wide, padding 12, gap 4 */}
        <section aria-label="Request list" className={cn("reveal flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-surface-card p-3 shadow-sm", mobileOpen && "max-lg:hidden")}>
          <label className="mb-1 flex h-11 items-center gap-2 rounded-[12px] bg-surface-subtle px-3.5 text-ink-tertiary focus-within:ring-2 focus-within:ring-brand-focus">
            <SearchNormal1 size={18} color="currentColor" />
            <span className="sr-only">Search requests</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or ID" className="w-full bg-transparent text-body-sm text-ink outline-none" />
          </label>
          {list.length === 0 && <p className="px-3 py-10 text-center text-body-sm text-ink-tertiary">No requests here yet.</p>}
          {list.map((p) => {
            const on = selected?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p.id)}
                aria-current={on}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[12px] p-3 text-left transition-colors",
                  on ? "bg-brand-subtle ring-[1.5px] ring-inset ring-brand" : "hover:bg-surface-subtle",
                )}
              >
                <Avatar src={p.photo} hidden={p.photoHidden} size={48} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn("flex items-center gap-1.5 text-label-lg", on ? "text-brand-text" : "text-ink")}>
                    {p.name}, {p.age} <Verify size={14} color="currentColor" variant="Bold" className="text-icon-brand" />
                  </span>
                  <span className="truncate text-body-sm text-ink-secondary">{p.meta}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-caption text-ink-tertiary">{p.time}</span>
                  {p.isNew && tabOf(p) === "received" && <span aria-label="New" className="h-2 w-2 rounded-full bg-brand" />}
                </span>
              </button>
            );
          })}
        </section>

        {/* Figma: Profile detail */}
        {selected ? (
          <Detail key={selected.id} p={selected} tab={tabOf(selected) as RequestTab} onBack={() => setMobileOpen(false)} onAccept={accept} onDecline={decline} className={cn(!mobileOpen && "max-lg:hidden")} />
        ) : (
          <div className="hidden min-h-[400px] items-center justify-center rounded-xl border border-dashed border-line bg-surface-card text-body-md text-ink-tertiary lg:flex">Select a request to see the profile</div>
        )}
      </div>
    </MemberShell>
  );
}

function Avatar({ src, hidden, size }: { src: string; hidden?: boolean; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={cn("shrink-0 rounded-full object-cover", hidden && "bg-gold-100")} style={{ width: size, height: size }} />
  );
}

function Detail({
  p,
  tab,
  onBack,
  onAccept,
  onDecline,
  className,
}: {
  p: RequestProfile;
  tab: RequestTab;
  onBack: () => void;
  onAccept: (p: RequestProfile) => void;
  onDecline: (p: RequestProfile) => void;
  className?: string;
}) {
  const toast = useToast();
  const [saved, setSaved] = useState(false);

  return (
    <article aria-label={`${p.fullName}’s profile`} className={cn("flex min-w-0 animate-fade-up flex-col gap-6 rounded-xl border border-line bg-surface-card p-4 shadow-sm sm:p-6", className)}>
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-1.5 text-label-md text-brand-text lg:hidden">
        <ArrowLeft size={18} color="currentColor" /> All requests
      </button>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Photo 280 × 340, radius lg */}
        <div className={cn("relative aspect-[280/340] w-full shrink-0 overflow-hidden rounded-lg md:w-[280px]", p.photoHidden ? "bg-gold-100" : "bg-surface-muted")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.photo} alt={p.photoHidden ? "" : `${p.fullName}`} className={cn("absolute inset-0 h-full w-full", p.photoHidden ? "object-contain p-10" : "object-cover")} />
          <span className="absolute left-3 top-3">{p.photoHidden ? <Badge tone="neutral">Photo after you both accept</Badge> : <Badge tone="success">Photo verified</Badge>}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="flex items-center gap-2 text-h4 text-ink md:text-h3">
              {p.fullName}, {p.age} <Verify size={22} color="currentColor" variant="Bold" className="shrink-0 text-icon-brand" />
            </h2>
            <p className="flex items-center gap-1.5 text-body-md text-ink-secondary">
              <Flag country={p.country} /> {p.location} · {p.id}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge tone="success">Verified</Badge>
              {p.horoscope && <Badge tone="info">Horoscope</Badge>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 rounded-[16px] bg-brand-subtle p-4">
            <p className="flex items-center gap-1.5 text-label-sm text-brand-text">
              <Heart size={16} color="currentColor" variant="Bold" />
              {tab === "received" ? `Sent you an interest · ${p.time}` : tab === "sent" ? `You sent an interest · ${p.time}` : "Interest accepted"}
            </p>
            <p className="text-body-md text-ink">{tab === "received" ? `“${p.note}”` : p.note}</p>
          </div>

          <dl className="grid gap-x-3 gap-y-4 sm:grid-cols-2">
            {p.details.map((d) => {
              const Icon = DETAIL_ICONS[d.icon];
              return (
                <div key={d.label} className="relative flex items-center gap-2.5">
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

      <div className="flex flex-col gap-2">
        <h3 className="text-h6 text-ink">About {p.name}</h3>
        <p className="text-body-md text-ink-secondary">{p.about}</p>
      </div>

      <div className="h-px bg-line" />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? "Remove from shortlist" : "Add to shortlist"}
          onClick={() => {
            setSaved(!saved);
            if (!saved) toast.success("Added to shortlist", `${p.name} is saved to your shortlist.`);
          }}
          className={cn("flex h-12 w-12 items-center justify-center rounded-full border transition-colors", saved ? "border-brand bg-brand-subtle text-brand" : "border-line-strong text-icon-brand hover:bg-brand-subtle")}
        >
          <Heart size={20} color="currentColor" variant={saved ? "Bold" : "Linear"} />
        </button>
        <p className="min-w-[160px] flex-1 text-body-sm text-ink-tertiary">
          {tab === "received" ? "Accepting unlocks photos, contact details and chat." : tab === "sent" ? "We’ll let you know as soon as they reply." : "You’re connected — say hello!"}
        </p>
        {tab === "received" && (
          <div className="flex gap-3 max-sm:w-full">
            <Button size="md" variant="outline" className="max-sm:flex-1" onClick={() => onDecline(p)}>
              Decline
            </Button>
            <Button size="md" className="max-sm:flex-1" onClick={() => onAccept(p)}>
              Accept interest
            </Button>
          </div>
        )}
        {tab === "sent" && (
          <Button size="md" variant="outline" onClick={() => toast.info("Reminder sent", `We’ll nudge ${p.name} gently.`)}>
            Send a reminder
          </Button>
        )}
        {tab === "accepted" && (
          <Link href="/messages" className="flex h-11 items-center gap-2 rounded-full bg-brand-gradient px-6 text-button-md text-ink-on-brand transition-shadow hover:shadow-glow">
            <MessageText size={18} color="currentColor" /> Send a message
          </Link>
        )}
      </div>
    </article>
  );
}
