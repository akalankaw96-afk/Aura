"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight2, AttachCircle, MoreCircle, SearchNormal1, Send2, ShieldTick, TickCircle, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";
import { MemberShell } from "@/components/layout/MemberShell";
import { CONVERSATIONS, DEMO_REPLIES, FRIENDS, SAFETY_NOTE, type ChatMessage, type Conversation, type Friend } from "@/content/dashboard";

/**
 * Figma: 📊 Member Dashboard → Messages — Desktop 1440.
 * Chat shell 1280 × 680, radius xl: Conversation list (360: search, Friends strip,
 * Messages header with All / Unread, conversations)
 * + Conversation (header, thread on bg-subtle with safety note + "Today", composer).
 * Mobile: list first; opening a chat shows it full width with a Back button.
 * Mock: sending a message gets a typed reply after a moment.
 */
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

export function MessagesScreen() {
  const toast = useToast();
  const [convos, setConvos] = useState<Conversation[]>(CONVERSATIONS);
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  // ?c=<id> opens a conversation (links from the dashboard)
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    const friend = FRIENDS.find((f) => f.id === c);
    if (c && CONVERSATIONS.some((x) => x.id === c)) open(c);
    else if (friend) openFriend(friend);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = convos.find((c) => c.id === activeId)!;
  const unreadTotal = convos.filter((c) => c.unread > 0).length;
  const list = useMemo(
    () => convos.filter((c) => (filter === "all" || c.unread > 0) && c.fullName.toLowerCase().includes(query.trim().toLowerCase())),
    [convos, filter, query],
  );

  // opening a chat marks it read
  useEffect(() => {
    setConvos((cs) => cs.map((c) => (c.id === activeId ? { ...c, unread: 0 } : c)));
  }, [activeId]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [active.messages.length, typing, activeId]);

  function open(id: string) {
    setActiveId(id);
    setMobileOpen(true);
  }

  /** Friend tapped: open their chat, or start a new (empty) one */
  function openFriend(f: Friend) {
    setConvos((cs) =>
      cs.some((c) => c.id === f.id)
        ? cs
        : [{ id: f.id, name: f.name, fullName: f.fullName, age: f.age, location: f.location, photo: f.photo, photoHidden: f.photoHidden, online: f.online, lastSeen: f.lastSeen, time: "", unread: 0, messages: [] }, ...cs],
    );
    open(f.id);
  }

  const push = (id: string, m: ChatMessage, preview?: boolean) =>
    setConvos((cs) => cs.map((c) => (c.id === id ? { ...c, messages: [...c.messages, m], time: m.time, unread: preview && id !== activeId ? c.unread + 1 : c.unread } : c)));

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (/\b(\d{9,}|\+?94\d{9}|[\w.+-]+@[\w-]+\.\w+)\b/.test(text)) {
      toast.warning("Keep contact details private", "Phone numbers and emails unlock after a family call. Please remove them.");
      return;
    }
    const id = activeId;
    push(id, { id: crypto.randomUUID(), from: "me", text, time: now() });
    setDraft("");
    // demo: the other person "types" and replies
    window.setTimeout(() => setTyping(id), 700);
    window.setTimeout(() => {
      setTyping(null);
      push(id, { id: crypto.randomUUID(), from: "them", text: DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)], time: now() }, true);
      setConvos((cs) => cs.map((c) => (c.id === id ? { ...c, messages: c.messages.map((m) => (m.from === "me" ? { ...m, seen: true } : m)) } : c)));
    }, 2200);
  };

  return (
    <MemberShell crumb="Messages" title="Messages" subtitle="Chat safely with members who accepted your interest.">
      {/* Figma: Chat — 1280 × 680, radius xl, border, Shadow/SM */}
      <div className="reveal flex h-[calc(100dvh-220px)] min-h-[520px] overflow-hidden rounded-xl border border-line bg-surface-card shadow-sm lg:h-[680px]">
        {/* Conversation list — 360, padding 16, gap 12 */}
        <aside aria-label="Conversations" className={cn("flex w-full shrink-0 flex-col gap-3 border-line p-4 lg:w-[360px] lg:border-r", mobileOpen && "max-lg:hidden")}>
          <label className="flex h-11 shrink-0 items-center gap-2 rounded-[12px] bg-surface-subtle px-3.5 text-ink-tertiary focus-within:ring-2 focus-within:ring-brand-focus">
            <SearchNormal1 size={18} color="currentColor" />
            <span className="sr-only">Search conversations</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations" className="w-full bg-transparent text-body-sm text-ink outline-none" />
          </label>
          {/* Figma: Friends header + Friends list (56px avatars, brand ring when online) */}
          <div className="flex items-center gap-2">
            <h2 className="text-label-lg text-ink">Friends</h2>
            <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-label-sm text-brand-text">{FRIENDS.length}</span>
            <Link href="/friends" className="ml-auto flex items-center gap-0.5 text-link-sm text-brand-link underline">
              See all <ArrowRight2 size={14} color="currentColor" />
            </Link>
          </div>
          <ul aria-label="Friends" className="-mx-1 flex shrink-0 gap-3 overflow-x-auto px-1 pb-1">
            {FRIENDS.map((f) => (
              <li key={f.id} className="w-14 shrink-0">
                <button type="button" onClick={() => openFriend(f)} aria-label={`Chat with ${f.name}${f.online ? ", online" : ""}`} className="group flex w-full flex-col items-center gap-1.5">
                  <span className={cn("relative flex h-14 w-14 items-center justify-center rounded-full border-2 transition-transform group-hover:scale-105", f.online ? "border-brand" : "border-line")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.photo} alt="" className={cn("h-12 w-12 rounded-full object-cover", f.photoHidden && "bg-gold-100")} />
                    {f.online && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface-card bg-success-fg" />}
                  </span>
                  <span className={cn("max-w-full truncate text-caption", f.id === activeId ? "font-semibold text-brand-text" : "text-ink-secondary")}>{f.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="h-px shrink-0 bg-line" />

          {/* Figma: Messages header — title + All / Unread */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-label-lg text-ink">Messages</h2>
            <div className="flex gap-2">
            {(
              [
                ["all", "All"],
                ["unread", `Unread · ${unreadTotal}`],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={filter === v}
                onClick={() => setFilter(v)}
                className={cn("rounded-full px-3.5 py-1.5 text-label-sm transition-colors", filter === v ? "bg-brand-gradient text-ink-on-brand" : "border border-line text-ink-secondary hover:bg-surface-subtle")}
              >
                {label}
              </button>
            ))}
            </div>
          </div>
          <ul className="-mx-1 flex flex-1 flex-col gap-1 overflow-y-auto px-1">
            {list.length === 0 && <li className="py-10 text-center text-body-sm text-ink-tertiary">No conversations.</li>}
            {list.map((c) => {
              const on = c.id === activeId;
              const last = c.messages[c.messages.length - 1] ?? { from: "them", text: "Say hello 👋" };
              const unread = c.unread > 0;
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => open(c.id)} aria-current={on} className={cn("flex w-full items-center gap-3 rounded-[12px] p-3 text-left transition-colors", on ? "bg-brand-subtle" : "hover:bg-surface-subtle")}>
                    <Photo c={c} size={48} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("text-label-lg", on ? "text-brand-text" : "text-ink")}>{c.name}</span>
                        <span className={cn("text-caption", unread ? "text-brand-text" : "text-ink-tertiary")}>{c.time}</span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-body-sm", unread ? "font-semibold text-ink" : "text-ink-secondary")}>
                          {last.from === "me" ? "You: " : ""}
                          {last.text}
                        </span>
                        {unread && <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-label-sm text-ink-on-brand">{c.unread}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Conversation */}
        <section aria-label={`Chat with ${active.fullName}`} className={cn("flex min-w-0 flex-1 flex-col", !mobileOpen && "max-lg:hidden")}>
          <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6 sm:py-4">
            <button type="button" aria-label="Back to conversations" onClick={() => setMobileOpen(false)} className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-surface-subtle lg:hidden">
              <ArrowLeft size={20} color="currentColor" />
            </button>
            <Photo c={active} size={44} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="flex items-center gap-1.5 truncate text-label-lg text-ink">
                {active.fullName}, {active.age} <Verify size={16} color="currentColor" variant="Bold" className="shrink-0 text-icon-brand" />
              </p>
              <p className={cn("truncate text-caption", active.online ? "text-success-fg" : "text-ink-tertiary")}>
                {typing === active.id ? "typing…" : active.online ? `Online now · ${active.location}` : `${active.lastSeen} · ${active.location}`}
              </p>
            </div>
            <Link href="/friends" className="hidden h-10 items-center rounded-full px-4 text-button-sm text-ink ring-1 ring-inset ring-line-strong hover:bg-surface-subtle sm:flex">
              View profile
            </Link>
            <button type="button" aria-label="More options" onClick={() => toast.info("Coming soon", "Block, report and mute will be here.")} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-subtle text-ink hover:bg-surface-muted">
              <MoreCircle size={20} color="currentColor" />
            </button>
          </header>

          <div ref={threadRef} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-surface-subtle p-4 sm:p-6" aria-live="polite">
            <p className="mx-auto flex max-w-full items-center gap-2 rounded-[12px] bg-info-bg px-3.5 py-2 text-body-xs font-semibold text-info-fg">
              <ShieldTick size={16} color="currentColor" className="shrink-0" /> {SAFETY_NOTE}
            </p>
            <span className="mx-auto rounded-full border border-line bg-surface-card px-3 py-1 text-label-sm text-ink-tertiary">Today</span>
            {active.messages.length === 0 && (
              <div className="m-auto flex flex-col items-center gap-2 py-8 text-center">
                <Photo c={active} size={64} />
                <p className="text-label-lg text-ink">You and {active.name} are connected</p>
                <p className="text-body-sm text-ink-tertiary">Start with a friendly hello, introduce yourself and your family.</p>
              </div>
            )}
            {active.messages.map((m) => (
              <Bubble key={m.id} m={m} />
            ))}
            {typing === active.id && (
              <div aria-label={`${active.name} is typing`} className="flex w-fit items-center gap-1 rounded-[18px] rounded-tl-[4px] border border-line bg-surface-card px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-tertiary" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            )}
          </div>

          {/* Composer — padding 16/24, gap 12 */}
          <form onSubmit={send} className="flex items-center gap-3 border-t border-line px-4 py-3 sm:px-6 sm:py-4">
            <button type="button" aria-label="Attach a photo" onClick={() => toast.info("Coming soon", "Photo sharing unlocks after a family call.")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-icon-brand hover:bg-rose-100">
              <AttachCircle size={20} color="currentColor" />
            </button>
            <label className="flex h-12 min-w-0 flex-1 items-center rounded-full border border-line bg-surface-subtle px-[18px] focus-within:border-brand-focus focus-within:shadow-ring-brand">
              <span className="sr-only">Message</span>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" className="w-full bg-transparent text-body-md text-ink outline-none" />
            </label>
            <button type="submit" aria-label="Send" disabled={!draft.trim()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-ink-on-brand transition-all hover:shadow-glow active:scale-95 disabled:opacity-50">
              <Send2 size={22} color="currentColor" />
            </button>
          </form>
        </section>
      </div>
    </MemberShell>
  );
}

function Photo({ c, size }: { c: Conversation; size: number }) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.photo} alt="" className={cn("h-full w-full rounded-full object-cover", c.photoHidden && "bg-gold-100")} />
      {c.online && <span aria-label="Online" className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-card bg-success-fg" />}
    </span>
  );
}

/** Figma: Message / in (card, top-left radius 4) · Message / out (brand gradient, top-right radius 4) */
function Bubble({ m }: { m: ChatMessage }) {
  const me = m.from === "me";
  return (
    <div className={cn("flex animate-fade-up flex-col gap-1", me ? "items-end" : "items-start")}>
      <p
        className={cn(
          "max-w-[85%] rounded-[18px] px-4 py-3 text-body-md sm:max-w-[420px]",
          me ? "rounded-tr-[4px] bg-brand-gradient text-ink-on-brand" : "rounded-tl-[4px] border border-line bg-surface-card text-ink",
        )}
      >
        {m.text}
      </p>
      <span className="flex items-center gap-1 text-caption text-ink-tertiary">
        {m.time}
        {me && m.seen && (
          <>
            · Seen <TickCircle size={12} color="currentColor" variant="Bold" className="text-brand" />
          </>
        )}
      </span>
    </div>
  );
}
