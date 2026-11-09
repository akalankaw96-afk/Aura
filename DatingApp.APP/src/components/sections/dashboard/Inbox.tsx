"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight2, Heart, MessageText, TickCircle, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/context/LanguageContext";
import { FRIENDS, MESSAGES, REQUESTS, type Friend, type InterestRequest } from "@/content/dashboard";

/**
 * Figma: Dashboard — Version B (tabs) → Requests + Messages (two cards, gap 24).
 *  - Requests & friends card: Segmented Tabs [Friends · New requests]
 *      Friends tab → Friend Row (Profile + Message); a just-accepted friend is first, green, "New friend".
 *      New requests tab → Request Row (Decline / Accept). Accepting turns the row green
 *      ("Accepted · added to your friends" + Say hello) and adds the person to Friends.
 *  - Messages card: Segmented Tabs [Messages · New messages] → Conversation Row.
 *  - Empty State in each tab when the list is empty (try /dashboard?empty=1).
 * Motion: sliding tab pill, tab content fades up, rows stagger in, declined rows collapse,
 * accepted rows flash green, counts pop.
 */
export function Inbox() {
  // ?empty=1 → brand-new member: everything empty (Figma: empty-state version)
  const [empty, setEmpty] = useState(false);
  useEffect(() => setEmpty(new URLSearchParams(window.location.search).has("empty")), []);
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

/** Row wrapper: staggered entrance + collapse when leaving */
function Row({ i, leaving, last, highlight, children }: { i: number; leaving?: boolean; last?: boolean; highlight?: boolean; children: React.ReactNode }) {
  return (
    <li
      className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")}
      style={{ animation: `fade-up 450ms cubic-bezier(0.22,1,0.36,1) ${i * 60}ms backwards` }}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 transition-colors duration-500 sm:flex-nowrap",
            highlight ? "rounded-[12px] bg-success-bg p-3" : "py-3",
            !highlight && !last && "border-b border-line",
          )}
        >
          {children}
        </div>
      </div>
    </li>
  );
}

/* ── Requests & friends ─────────────────────────────────────────── */

type RFTab = "friends" | "requests";

function RequestsFriendsCard({ empty }: { empty: boolean }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [tab, setTab] = useState<RFTab>("friends");
  const [friends, setFriends] = useState<Friend[]>(empty ? [] : FRIENDS);
  const [requests, setRequests] = useState<InterestRequest[]>(empty ? [] : REQUESTS);
  const [status, setStatus] = useState<Record<string, "accepted" | "leaving">>({});
  const pending = requests.filter((r) => !status[r.id]).length;

  const accept = (r: InterestRequest) => {
    setStatus((s) => ({ ...s, [r.id]: "accepted" }));
    setFriends((f) => [
      { id: r.id, name: r.name, fullName: r.name, age: r.age, location: r.location, photo: r.photo, photoHidden: r.photoHidden, isNew: true, lastSeen: t.dashboard.connectedJustNow },
      ...f.map((x) => ({ ...x, isNew: false })),
    ]);
    toast.success(`${r.name} is now your friend`, "Photos and chat are unlocked — say hello!");
  };
  const decline = (r: InterestRequest) => {
    setStatus((s) => ({ ...s, [r.id]: "leaving" }));
    window.setTimeout(() => setRequests((list) => list.filter((x) => x.id !== r.id)), 320);
    toast.info("Request declined", `${r.name} won’t be notified.`);
  };

  return (
    <Card id="requests">
      <CardHeader
        tabs={
          <SegmentedTabs<RFTab>
            label="Requests and friends"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "friends", label: t.dashboard.friends, count: friends.length },
              { id: "requests", label: t.dashboard.newRequests, count: pending },
            ]}
          />
        }
        link={tab === "friends" ? t.dashboard.allFriends : t.dashboard.viewAllRequests}
        href="/requests"
      />

      <div key={tab} className="animate-fade-up">
        {tab === "friends" &&
          (friends.length === 0 ? (
            <EmptyState
              icon={<Heart size={26} color="currentColor" />}
              title={t.dashboard.noFriendsTitle}
              body={t.dashboard.noFriendsBody}
              action={
                <Link href="/register" className="flex h-10 items-center rounded-full bg-brand-gradient px-5 text-button-sm text-ink-on-brand">
                  {t.dashboard.addPhotos}
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-1">
              {friends.map((f, i) => (
                <Row key={f.id} i={i} last={i === friends.length - 1} highlight={f.isNew}>
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
                      {f.online ? t.dashboard.onlineNow : f.lastSeen}
                    </p>
                  </div>
                  <div className="flex gap-2 max-sm:w-full max-sm:pl-[60px]">
                    <Link href="/requests" className="flex h-[41px] items-center rounded-full px-4 text-button-sm text-ink ring-1 ring-inset ring-line-strong transition-colors hover:bg-surface-subtle">
                      {t.dashboard.profile}
                    </Link>
                    <Link
                      href={`/messages?c=${f.id}`}
                      className="flex h-[41px] items-center gap-1.5 rounded-full bg-brand-gradient px-4 text-button-sm text-ink-on-brand transition-shadow hover:shadow-glow"
                    >
                      {t.dashboard.message}
                    </Link>
                  </div>
                </Row>
              ))}
            </ul>
          ))}

        {tab === "requests" &&
          (requests.length === 0 ? (
            <EmptyState
              icon={<Heart size={26} color="currentColor" />}
              title={t.dashboard.noRequestsTitle}
              body={t.dashboard.noRequestsBody}
              action={
                <Link href="/register" className="flex h-10 items-center rounded-full bg-brand-gradient px-5 text-button-sm text-ink-on-brand">
                  {t.dashboard.addPhotos}
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-1">
              {requests.map((r, i) => {
                const accepted = status[r.id] === "accepted";
                return (
                  <Row key={r.id} i={i} last={i === requests.length - 1} leaving={status[r.id] === "leaving"} highlight={accepted}>
                    <Avatar src={r.photo} hidden={r.photoHidden} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="flex items-center gap-1.5 text-label-lg text-ink">
                        {r.name}, {r.age} <Verify size={16} color="currentColor" variant="Bold" className="text-icon-brand" />
                      </p>
                      {accepted ? (
                        <p className="flex animate-fade-up items-center gap-1 text-body-sm font-semibold text-success-fg">
                          <TickCircle size={14} color="currentColor" variant="Bold" /> {t.dashboard.acceptedAdded}
                        </p>
                      ) : (
                        <>
                          <p className="truncate text-body-sm text-ink-secondary">{r.meta}</p>
                          <p className="text-caption text-ink-tertiary">{r.time}</p>
                        </>
                      )}
                    </div>
                    {accepted ? (
                      <Link href="/messages" className="flex h-[41px] animate-pop-in items-center rounded-full bg-brand-gradient px-4 text-button-sm text-ink-on-brand transition-shadow hover:shadow-glow">
                        {t.dashboard.sayHello}
                      </Link>
                    ) : (
                      <div className="flex gap-2 max-sm:w-full max-sm:pl-[60px]">
                        <Button size="sm" variant="outline" onClick={() => decline(r)}>
                          {t.dashboard.decline}
                        </Button>
                        <Button size="sm" onClick={() => accept(r)}>
                          {t.dashboard.accept}
                        </Button>
                      </div>
                    )}
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
              <Link href="/requests" className="flex h-10 items-center rounded-full bg-brand-gradient px-5 text-button-sm text-ink-on-brand">
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
