"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight2, MessageText, TickCircle, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { useLanguage } from "@/context/LanguageContext";
import { FRIENDS, MESSAGES, REQUESTS, REQUEST_PROFILES, friendProfileId, type Friend } from "@/content/dashboard";
import { useAuthSession } from "@/lib/session";
import { useAddedFriends, useDeclinedInterests, useFavourites } from "@/lib/connections";
import { requirePaidAction } from "@/lib/usage";
import { ConnectionEmptyState } from "@/components/sections/member/ConnectionEmptyState";

/**
 * Figma: Dashboard — Version B (tabs) → Requests + Messages (two cards, gap 24).
 *  - Requests & friends card: Segmented Tabs [Friends · Favourites · New requests]
 *      Each row opens the corresponding profile on the Friends page (/friends).
 *      A just-accepted friend is first, green, with a "New friend" badge.
 *  - Messages card: Segmented Tabs [Messages · New messages] → Conversation Row.
 *  - Empty State in each tab when the list is empty (try /dashboard?empty=1).
 * Motion: sliding tab pill, tab content fades up, rows stagger in, counts pop.
 */
export function Inbox() {
  const { isVerified, hasCompletedProfile } = useAuthSession();
  // ?empty=1 → brand-new member: everything empty (Figma: empty-state version)
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    const isParamEmpty = new URLSearchParams(window.location.search).has("empty");
    setEmpty(isParamEmpty || !isVerified || !hasCompletedProfile);
  }, [isVerified, hasCompletedProfile]);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <RequestsFriendsCard key={`rf-${empty}`} empty={empty} />
      <MessagesCard key={`m-${empty}`} empty={empty} />
    </div>
  );
}

/* ── shared pieces ─────────────────────────────────────────────── */

function Card({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="reveal flex min-w-0 scroll-mt-28 flex-col gap-2 rounded-xl border border-line bg-surface-card p-4 shadow-sm sm:p-6">
      {children}
    </section>
  );
}

function CardHeader({ tabs, link, href }: { tabs: React.ReactNode; link: string; href: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pb-2">
      {tabs}
      <Link href={href} className="ml-auto flex items-center gap-1 whitespace-nowrap text-link-sm text-brand-link underline">
        {link} <ArrowRight2 size={16} color="currentColor" />
      </Link>
    </div>
  );
}

/** Figma: Member avatar inside rows — photo, or groom illustration when the photo is hidden; online dot */
function Avatar({ src, hidden, online, size = 48 }: { src: string; hidden?: boolean; online?: boolean; size?: number }) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className={cn("h-full w-full rounded-full object-cover", hidden && "bg-gold-100")} />
      {online && <span aria-label="Online" className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-card bg-success-fg" />}
    </span>
  );
}

/** Figma: Empty State (Visual = Icon) */
function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="flex animate-fade-up flex-col items-center gap-3 px-6 py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle text-icon-brand">{icon}</span>
      <p className="text-h6 text-ink">{title}</p>
      <p className="max-w-[360px] text-body-sm text-ink-secondary">{body}</p>
      <div className="pt-1">{action}</div>
    </div>
  );
}

/** Row wrapper with a staggered entrance and optional full-row link. */
function Row({ i, last, highlight, href, linkLabel, children }: {
  i: number;
  last?: boolean;
  highlight?: boolean;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  const className = cn(
    "group relative flex flex-wrap items-center gap-3 transition-colors sm:flex-nowrap",
    highlight ? "rounded-md bg-success-bg p-3" : "py-3",
    !highlight && !last && "border-b border-line",
    href && "hover:bg-surface-subtle focus-within:bg-surface-subtle",
  );
  return (
    <li style={{ animation: `fade-up 450ms cubic-bezier(0.22,1,0.36,1) ${i * 60}ms backwards` }}>
      <div className={className}>
        {href && <Link href={href} aria-label={linkLabel} className="absolute inset-0 z-10 rounded-md focus-visible:outline-none focus-visible:shadow-ring-brand" />}
        {children}
      </div>
    </li>
  );
}

/* ── Requests & friends ─────────────────────────────────────────── */

type RFTab = "friends" | "favourites" | "requests";

function RequestsFriendsCard({ empty }: { empty: boolean }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [tab, setTab] = useState<RFTab>("friends");
  const { profiles: addedFriends, save: addFriend } = useAddedFriends();
  const { profiles: declinedInterests, save: declineInterest } = useDeclinedInterests();
  const { profiles: favourites } = useFavourites();
  const addedIds = new Set(addedFriends.map((profile) => profile.id));
  const declinedIds = new Set(declinedInterests.map((profile) => profile.id));
  const [acceptedHere, setAcceptedHere] = useState<string[]>([]);
  const requests = empty ? [] : REQUESTS.filter((request) =>
    !declinedIds.has(request.id) && (!addedIds.has(request.id) || acceptedHere.includes(request.id)),
  );
  const pending = requests.filter((request) => !addedIds.has(request.id)).length;
  const friends: Friend[] = empty ? [] : [
    ...addedFriends.map((profile) => ({ ...profile, isNew: true, lastSeen: t.dashboard.connectedJustNow })),
    ...FRIENDS.filter((friend) => !addedIds.has(friendProfileId(friend))),
  ];
  const members: Friend[] = tab === "favourites" ? favourites : friends;

  function accept(id: string) {
    const request = REQUEST_PROFILES.find((profile) => profile.id === id);
    if (!request || !requirePaidAction("interests", "accept a request")) return;
    if (!addFriend({ ...request, note: "You accepted this interest." })) return;
    setAcceptedHere((ids) => [...ids, id]);
    toast.success(`${request.name} is now your friend`, "You can message them from Friends.");
  }

  function decline(id: string, name: string) {
    if (!requirePaidAction("interests", "decline a request") || !declineInterest({ id })) return;
    toast.info("Request declined", `${name} won’t be notified.`);
  }

  return (
    <Card id="requests">
      <CardHeader
        tabs={
          <SegmentedTabs<RFTab>
            label="Friends, favourites and requests"
            className="max-w-full overflow-x-auto"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "friends", label: t.dashboard.friends, count: friends.length },
              { id: "favourites", label: t.dashboard.favourites, count: favourites.length },
              { id: "requests", label: t.dashboard.newRequests, count: pending },
            ]}
          />
        }
        link={tab === "friends" ? t.dashboard.allFriends : tab === "favourites" ? t.dashboard.allFavourites : t.dashboard.viewAllRequests}
        href={`/friends?tab=${tab === "requests" ? "received" : tab}`}
      />

      <div key={tab} className="animate-fade-up">
        {tab !== "requests" &&
          (members.length === 0 ? (
            <ConnectionEmptyState
              compact
              title={tab === "favourites" ? t.dashboard.noFavouritesTitle : t.dashboard.noFriendsTitle}
              body={tab === "favourites" ? t.dashboard.noFavouritesBody : t.dashboard.noFriendsBody}
              action={
                <ButtonLink href="/search" size="sm">{t.dashboard.browseProfiles}</ButtonLink>
              }
            />
          ) : (
            <ul className="flex flex-col gap-1">
              {members.map((f, i) => (
                <Row
                  key={f.id}
                  i={i}
                  last={i === members.length - 1}
                  highlight={f.isNew}
                  href={`/friends?tab=${tab}&id=${encodeURIComponent(tab === "friends" ? friendProfileId(f) : f.id)}`}
                  linkLabel={`View ${f.name}’s profile`}
                >
                  <Avatar src={f.photo} hidden={f.photoHidden} online={f.online} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="flex flex-wrap items-center gap-1.5 text-label-lg text-ink">
                      {f.name}, {f.age} <Verify size={16} color="currentColor" variant="Bold" className="text-icon-brand" />
                      {f.isNew && (
                        <span className="animate-pop-in">
                          <Badge tone="success">{t.dashboard.newFriend}</Badge>
                        </span>
                      )}
                    </p>
                    <p className={cn("truncate text-caption", f.online || f.isNew ? "text-success-fg" : "text-ink-tertiary")}>
                      {f.online ? t.dashboard.onlineNow : f.lastSeen || f.location}
                    </p>
                  </div>
                  <div className="pointer-events-none relative z-20 flex gap-2 max-sm:w-full max-sm:pl-14">
                    <span className="flex h-10 items-center rounded-full px-4 text-button-sm text-ink ring-1 ring-inset ring-line-strong">
                      {t.dashboard.profile}
                    </span>
                    {tab === "friends" && (
                      <ButtonLink href={`/messages?c=${encodeURIComponent(f.id)}`} size="sm" className="pointer-events-auto">
                        {t.dashboard.message}
                      </ButtonLink>
                    )}
                  </div>
                </Row>
              ))}
            </ul>
          ))}

        {tab === "requests" &&
          (requests.length === 0 ? (
            <ConnectionEmptyState
              compact
              title={t.dashboard.noRequestsTitle}
              body={t.dashboard.noRequestsBody}
              action={
                <ButtonLink href="/search" size="sm">{t.dashboard.browseProfiles}</ButtonLink>
              }
            />
          ) : (
            <ul className="flex flex-col gap-1">
              {requests.map((r, i) => {
                const accepted = addedIds.has(r.id);
                return (
                  <Row
                    key={r.id}
                    i={i}
                    last={i === requests.length - 1}
                    highlight={accepted}
                    href={`/friends?tab=${accepted ? "friends" : "received"}&id=${encodeURIComponent(r.id)}`}
                    linkLabel={`View ${r.name}’s profile`}
                  >
                    <Avatar src={r.photo} hidden={r.photoHidden} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="flex items-center gap-1.5 text-label-lg text-ink">
                        {r.name}, {r.age} <Verify size={16} color="currentColor" variant="Bold" className="text-icon-brand" />
                      </p>
                      {accepted ? (
                        <p className="flex items-center gap-1 text-body-sm font-semibold text-success-fg">
                          <TickCircle size={14} color="currentColor" variant="Bold" /> {t.dashboard.acceptedAdded}
                        </p>
                      ) : (
                        <>
                          <p className="truncate text-body-sm text-ink-secondary">{r.meta}</p>
                          <p className="text-caption text-ink-tertiary">{r.time}</p>
                        </>
                      )}
                    </div>
                    <div className="pointer-events-none relative z-20 flex gap-2 max-sm:w-full max-sm:pl-14">
                      {accepted ? (
                        <ButtonLink href={`/messages?c=${encodeURIComponent(r.id)}`} size="sm" className="pointer-events-auto">
                          {t.dashboard.sayHello}
                        </ButtonLink>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="pointer-events-auto" onClick={() => decline(r.id, r.name)}>
                            {t.dashboard.decline}
                          </Button>
                          <Button size="sm" className="pointer-events-auto" onClick={() => accept(r.id)}>
                            {t.dashboard.accept}
                          </Button>
                        </>
                      )}
                    </div>
                  </Row>
                );
              })}
            </ul>
          ))}
      </div>
    </Card>
  );
}

/* ── Messages ───────────────────────────────────────────────────── */

type MTab = "all" | "unread";

function MessagesCard({ empty }: { empty: boolean }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<MTab>("all");
  const [read, setRead] = useState<string[]>([]);
  const all = empty ? [] : MESSAGES;
  const unreadOf = (id: string, n: number) => (read.includes(id) ? 0 : n);
  const unreadList = all.filter((m) => unreadOf(m.id, m.unread) > 0);
  const list = tab === "all" ? all : unreadList;

  return (
    <Card id="messages">
      <CardHeader
        tabs={
          <SegmentedTabs<MTab>
            label="Messages"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: t.dashboard.messagesTab, count: all.length },
              { id: "unread", label: t.dashboard.newMessages, count: unreadList.length },
            ]}
          />
        }
        link={t.dashboard.openInbox}
        href="/messages"
      />

      <div key={tab} className="animate-fade-up">
        {list.length === 0 ? (
          <EmptyState
            icon={<MessageText size={26} color="currentColor" />}
            title={t.dashboard.noMessagesTitle}
            body={t.dashboard.noMessagesBody}
            action={
              <Link href="/friends" className="flex h-10 items-center rounded-full bg-brand-gradient px-5 text-button-sm text-ink-on-brand">
                {t.dashboard.viewAllRequests}
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {list.map((m, i) => {
              const isUnread = unreadOf(m.id, m.unread) > 0;
              return (
                <Row key={m.id} i={i} last={i === list.length - 1}>
                  <Link
                    href={`/messages?c=${m.id}`}
                    onClick={() => setRead((r) => (r.includes(m.id) ? r : [...r, m.id]))}
                    className="flex w-full items-center gap-3 rounded-md p-1 transition-colors hover:bg-surface-subtle"
                  >
                    <Avatar src={m.photo} hidden={m.photoHidden} online={m.online} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="flex items-center gap-1.5 text-label-lg text-ink">
                        {m.name} <Verify size={16} color="currentColor" variant="Bold" className="text-icon-brand" />
                      </p>
                      <p className={cn("truncate text-body-sm", isUnread ? "font-semibold text-ink" : "text-ink-secondary")}>
                        {m.preview}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      <span className="text-caption text-ink-tertiary">{m.time}</span>
                      {isUnread && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-label-sm text-ink-on-brand">
                          {unreadOf(m.id, m.unread)}
                        </span>
                      )}
                    </div>
                  </Link>
                </Row>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
