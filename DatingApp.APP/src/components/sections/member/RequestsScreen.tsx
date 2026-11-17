"use client";

import React, { useState } from "react";
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
import { handleLimitError, refreshUsage, requirePaidAction } from "@/lib/usage";
import { requireMember } from "@/lib/session";
import {
  refreshConnections,
  useAddedFriends,
  useFavourites,
  useReceivedInterests,
  useSentInterests,
  type ConnectionProfile,
} from "@/lib/connections";
import { respondInterest, sendInterestTo, withdrawInterest } from "@/lib/matching";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Flag } from "@/components/ui/Flag";
import { useToast } from "@/components/ui/Toast";
import { MemberShell } from "@/components/layout/MemberShell";
import { ConnectionEmptyState } from "./ConnectionEmptyState";
import { REQUEST_TABS, type ConnectionTab } from "@/content/dashboard";

const DETAIL_ICONS = { calendar: Calendar, ruler: Ruler, book: Book1, people: People, briefcase: Briefcase, teacher: Teacher, heart: Heart, location: Location };
const EMPTY_COPY: Record<ConnectionTab, { title: string; body: string }> = {
  friends: { title: "No friends yet", body: "When an interest is accepted, that member will appear here." },
  favourites: { title: "No favourites yet", body: "Tap the heart on a profile you like to save it here and come back to it anytime." },
  received: { title: "No new requests", body: "When someone sends you an interest, you’ll see it here." },
  sent: { title: "No interests sent yet", body: "Find a profile you like and send an interest. You can follow its progress here." },
};

/**
 * Figma: 📊 Member Dashboard → Requests — Desktop 1440.
 * Tabs (Friends / Favourites / Received / Sent) · Request list (400 wide) · Profile detail.
 * Mobile: the list first; picking a request opens its detail with a Back button.
 * Data (S03-T05/T06): friends = GET /match-requests/matched, favourites = GET /shortlist,
 * received / sent = GET /match-requests/received · sent. Accept, decline and withdraw call the API.
 */
export function RequestsScreen({ initialTab, initialProfileId }: { initialTab: ConnectionTab; initialProfileId?: string }) {
  const toast = useToast();
  const [tab, setTab] = useState<ConnectionTab>(initialTab);
  const [query, setQuery] = useState("");
  const { profiles: favourites, loaded } = useFavourites();
  const { profiles: addedFriends } = useAddedFriends();
  const { profiles: sentInterests, save: saveInterest } = useSentInterests();
  const { profiles: received } = useReceivedInterests();
  const [busy, setBusy] = useState(false);
  const inTab = (t: ConnectionTab): ConnectionProfile[] =>
    t === "friends" ? addedFriends : t === "favourites" ? favourites : t === "received" ? received : sentInterests;
  const tabProfiles = inTab(tab);
  const list = tabProfiles.filter((p) => `${p.fullName} ${p.id}`.toLowerCase().includes(query.trim().toLowerCase()));
  const noSearchMatches = tabProfiles.length > 0 && list.length === 0;
  const [selectedId, setSelectedId] = useState<string | null>(initialProfileId ?? null);
  const [mobileOpen, setMobileOpen] = useState(Boolean(initialProfileId));
  const selected = selectedId ? list.find((p) => p.id === selectedId) : list[0];

  const pick = (id: string) => {
    setSelectedId(id);
    setMobileOpen(true);
  };
  const switchTab = (t: ConnectionTab) => {
    setTab(t);
    setSelectedId(null);
    setMobileOpen(false);
  };

  // Answering an interest is free on every plan
  const answer = async (p: ConnectionProfile, accept: boolean) => {
    if (!requireMember(accept ? "accept a request" : "decline a request") || !p.requestId || busy) return;
    setBusy(true);
    try {
      await respondInterest(p.requestId, accept);
      await refreshConnections();
      if (accept) {
        setTab("friends");
        setQuery("");
        setSelectedId(p.id);
        toast.success("Interest accepted", `You can now message ${p.name}.`);
      } else {
        setSelectedId(null);
        setMobileOpen(false);
        toast.info("Request declined", `${p.name} won’t be notified.`);
      }
    } catch (err) {
      toast.error("Couldn’t update this request", err instanceof Error ? err.message : "Please try again.");
      void refreshConnections();
    } finally {
      setBusy(false);
    }
  };
  const accept = (p: ConnectionProfile) => void answer(p, true);
  const decline = (p: ConnectionProfile) => void answer(p, false);

  const withdraw = async (p: ConnectionProfile) => {
    if (!p.requestId || busy) return;
    setBusy(true);
    try {
      await withdrawInterest(p.requestId);
      await refreshConnections();
      setSelectedId(null);
      setMobileOpen(false);
      toast.info("Interest withdrawn", `${p.name} won’t see it any more. Your monthly interest count isn’t refunded.`);
    } catch (err) {
      toast.error("Couldn’t withdraw", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // From Favourites — counts one of the month's interests on the server (402 → Upgrade prompt)
  const sendInterest = async (p: ConnectionProfile) => {
    if (!requirePaidAction("interests", "send an interest") || !p.profileId) return;
    try {
      await sendInterestTo(p.profileId);
      saveInterest({ ...p, time: "Just now", note: "You sent an interest. Waiting for a reply." });
      void refreshUsage();
      toast.success("Interest sent", `You can chat with ${p.name} once they accept.`);
    } catch (err) {
      if (!handleLimitError(err)) toast.error("Interest not sent", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <MemberShell
      crumb="Friends"
      title="Friends"
      subtitle="Your friends, saved profiles and the interests you have received or sent."
      rightPlacement="below"
      right={
        <div role="tablist" aria-label="Friends" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface-card p-1">
          {REQUEST_TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => switchTab(t.id)}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-label-md transition-colors", on ? "bg-brand-gradient text-ink-on-brand" : "text-ink-secondary hover:text-ink")}
              >
                {t.label}
                <span className={cn("rounded-full px-1.5 text-label-sm", on ? "bg-[rgba(255,255,255,0.25)]" : "bg-brand-subtle text-brand-text")}>{inTab(t.id).length}</span>
              </button>
            );
          })}
        </div>
      }
    >
      <div className={cn("grid items-start gap-6", selected && "lg:grid-cols-[400px_minmax(0,1fr)]")}>
        {/* Figma: Request list — 400 wide, padding 12, gap 4 */}
        <section aria-label="Request list" className={cn("reveal flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-surface-card p-3 shadow-sm", mobileOpen && selected && "max-lg:hidden")}>
          {tabProfiles.length > 0 && <label className="mb-1 flex h-11 items-center gap-2 rounded-[12px] bg-surface-subtle px-3.5 text-ink-tertiary focus-within:ring-2 focus-within:ring-brand-focus">
            <SearchNormal1 size={18} color="currentColor" />
            <span className="sr-only">Search requests</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or ID" className="w-full bg-transparent text-body-sm text-ink outline-none" />
          </label>}
          {!loaded && list.length === 0 && <p className="px-3 py-8 text-center text-body-sm text-ink-tertiary">Loading…</p>}
          {loaded && list.length === 0 && (
            <ConnectionEmptyState
              title={noSearchMatches ? "No matching profiles" : EMPTY_COPY[tab].title}
              body={noSearchMatches ? "Try a different name or profile ID, or clear your search to see the full list." : EMPTY_COPY[tab].body}
              action={noSearchMatches ? (
                <Button size="md" variant="outline" onClick={() => setQuery("")}>Clear search</Button>
              ) : (
                <ButtonLink href="/search" size="md">Browse profiles</ButtonLink>
              )}
            />
          )}
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
                  {p.isNew && tab === "received" && <span aria-label="New" className="h-2 w-2 rounded-full bg-brand" />}
                </span>
              </button>
            );
          })}
        </section>

        {/* Figma: Profile detail */}
        {selected && (
          <Detail
            key={selected.id}
            p={selected}
            tab={tab}
            sent={inTab("sent").some((profile) => profile.id === selected.id)}
            onSend={sendInterest}
            onBack={() => setMobileOpen(false)}
            onAccept={accept}
            onDecline={decline}
            onWithdraw={(profile) => void withdraw(profile)}
            busy={busy}
            className={cn(!mobileOpen && "max-lg:hidden")}
          />
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
  sent,
  onSend,
  onBack,
  onAccept,
  onDecline,
  onWithdraw,
  busy,
  className,
}: {
  p: ConnectionProfile;
  tab: ConnectionTab;
  sent: boolean;
  onSend: (p: ConnectionProfile) => void;
  onBack: () => void;
  onAccept: (p: ConnectionProfile) => void;
  onDecline: (p: ConnectionProfile) => void;
  onWithdraw: (p: ConnectionProfile) => void;
  busy?: boolean;
  className?: string;
}) {
  const toast = useToast();
  const { profiles, save } = useFavourites();
  const saved = profiles.some((profile) => profile.id === p.id);

  return (
    <article aria-label={`${p.fullName}’s profile`} className={cn("flex min-w-0 animate-fade-up flex-col gap-6 rounded-xl border border-line bg-surface-card p-4 shadow-sm sm:p-6", className)}>
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-1.5 text-label-md text-brand-text lg:hidden">
        <ArrowLeft size={18} color="currentColor" /> Back to {tab === "friends" ? "friends" : tab === "favourites" ? "favourites" : "requests"}
      </button>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Photo 280 × 340, radius lg */}
        <div className={cn("relative aspect-[280/340] w-full shrink-0 overflow-hidden rounded-lg md:w-[280px]", p.photoHidden ? "bg-gold-100" : "bg-surface-muted")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.photo} alt={p.photoHidden ? "" : `${p.fullName}`} className={cn("absolute inset-0 h-full w-full", p.photoHidden ? "object-contain p-10" : "object-cover")} />
          <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? "Remove from favourites" : "Add to favourites"}
            onClick={() => {
              if (requireMember("shortlist profiles") && save(p)) toast.success("Added to favourites", `${p.name} is saved to your favourites.`);
            }}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface-glass-strong text-brand transition-transform hover:scale-105 focus-visible:shadow-ring-brand active:scale-95"
          >
            <Heart size={20} color="currentColor" variant={saved ? "Bold" : "Linear"} />
          </button>
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

          {tab !== "friends" && tab !== "favourites" && <div className="flex flex-col gap-1.5 rounded-[16px] bg-brand-subtle p-4">
            <p className="flex items-center gap-1.5 text-label-sm text-brand-text">
              <Heart size={16} color="currentColor" variant="Bold" />
              {tab === "received"
                ? `Sent you an interest · ${p.time}`
                : p.status === "Declined"
                  ? `Not a match this time · ${p.time}`
                  : `You sent an interest · ${p.time}`}
            </p>
            {p.note && <p className="text-body-md text-ink">{tab === "received" ? `“${p.note}”` : p.note}</p>}
          </div>}

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

      {p.about && <div className="flex flex-col gap-2">
        <h3 className="text-h6 text-ink">About {p.name}</h3>
        <p className="text-body-md text-ink-secondary">{p.about}</p>
      </div>}

      <div className="h-px bg-line" />

      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-[160px] flex-1 text-body-sm text-ink-tertiary">
          {tab === "received"
            ? "Accepting unlocks chat. Answering is free on every plan."
            : tab === "sent"
              ? p.status === "Declined" ? "They decided not to go ahead. Keep looking, the right match is out there." : "We’ll let you know as soon as they reply."
              : tab === "favourites" ? "Saved to your favourites." : "You’re connected, say hello!"}
        </p>
        {tab === "received" && (
          <div className="flex gap-3 max-sm:w-full">
            <Button size="md" variant="outline" className="max-sm:flex-1" disabled={busy} onClick={() => onDecline(p)}>
              Decline
            </Button>
            <Button size="md" className="max-sm:flex-1" disabled={busy} onClick={() => onAccept(p)}>
              Accept interest
            </Button>
          </div>
        )}
        {tab === "favourites" && <ProfileActions profileId={p.id} sent={sent} onSend={() => onSend(p)} />}
        {tab === "sent" && p.status === "Pending" && (
          <Button size="md" variant="outline" disabled={busy} onClick={() => onWithdraw(p)}>
            Withdraw interest
          </Button>
        )}
        {tab === "friends" && (
          <Link href="/messages" className="flex h-11 items-center gap-2 rounded-full bg-brand-gradient px-6 text-button-md text-ink-on-brand transition-shadow hover:shadow-glow">
            <MessageText size={18} color="currentColor" /> Send a message
          </Link>
        )}
      </div>
    </article>
  );
}
