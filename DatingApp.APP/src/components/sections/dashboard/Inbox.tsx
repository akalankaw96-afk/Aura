"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight2, TickCircle, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/context/LanguageContext";
import { MESSAGES, REQUESTS } from "@/content/dashboard";

/**
 * Figma: Dashboard → Bottom — two panels, gap 24. Panel: padding 24, radius xl,
 * border default, Shadow/SM. Header: H5 + brand badge + View all link.
 * Rows: padding 12/0, divider between rows.
 */
export function Inbox() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Requests />
      <Messages />
    </div>
  );
}

function Panel({ id, title, count, link, href, children }: { id: string; title: string; count: string; link: string; href: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-label={title} className="reveal flex min-w-0 scroll-mt-28 flex-col gap-2 rounded-xl border border-line bg-surface-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <h2 className="text-h5 text-ink">{title}</h2>
        <Badge tone="brand">{count}</Badge>
        <Link href={href} className="ml-auto flex items-center gap-1 whitespace-nowrap text-link-sm text-brand-link hover:underline">
          {link} <ArrowRight2 size={16} color="currentColor" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function Requests() {
  const toast = useToast();
  const { t, lang } = useLanguage();
  const [state, setState] = useState<Record<string, "accepted" | "declined">>({});
  const list = REQUESTS.filter((r) => r.tab === "received" && state[r.id] !== "declined");
  const pending = list.filter((r) => !state[r.id]).length;

  return (
    <Panel id="requests" title={t.dashboard.newRequests} count={`${pending} ${lang === "si" ? "නව" : "new"}`} link={t.dashboard.viewAllRequests} href="/requests">
      {list.length === 0 && <p className="py-6 text-center text-body-sm text-ink-tertiary">{lang === "si" ? "සියලු යෝජනා පරීක්ෂා කර ඇත." : "You’re all caught up."}</p>}
      <ul className="flex flex-col">
        {list.map((r, i) => (
          <li key={r.id} className={cn("flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap", i < list.length - 1 && "border-b border-line")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.photo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="flex items-center gap-1.5 text-label-lg text-ink">
                {r.name}, {r.age} <Verify size={16} color="currentColor" variant="Bold" className="text-icon-brand" />
              </p>
              <p className="truncate text-body-sm text-ink-secondary">{r.meta}</p>
              <p className="text-caption text-ink-tertiary">{r.time}</p>
            </div>
            {state[r.id] === "accepted" ? (
              <span className="flex items-center gap-1 text-label-md text-success-fg">
                <TickCircle size={18} color="currentColor" variant="Bold" /> {lang === "si" ? "පිළිගන්නා ලදී" : "Accepted"}
              </span>
            ) : (
              <div className="flex gap-2 max-sm:w-full max-sm:pl-[60px]">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setState((s) => ({ ...s, [r.id]: "declined" }));
                    toast.info(lang === "si" ? "යෝජනාව ප්‍රතික්ෂේප විය" : "Request declined", lang === "si" ? `${r.name} වෙත දැනුම් නොදේ.` : `${r.name} won’t be notified.`);
                  }}
                >
                  {t.dashboard.decline}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setState((s) => ({ ...s, [r.id]: "accepted" }));
                    toast.success(lang === "si" ? "කැමැත්ත පිළිගන්නා ලදී" : "Interest accepted", lang === "si" ? `දැන් ඔබට ${r.name} සමඟ කතාබස් කළ හැක.` : `You can now message ${r.name}. Photos and contacts are unlocked.`);
                  }}
                >
                  {t.dashboard.accept}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Messages() {
  const { t, lang } = useLanguage();
  const [read, setRead] = useState<string[]>([]);
  const unread = MESSAGES.reduce((n, m) => n + (read.includes(m.id) ? 0 : m.unread), 0);

  return (
    <Panel id="messages" title={t.dashboard.newMessages} count={`${unread} ${lang === "si" ? "නොකියවූ" : "unread"}`} link={t.dashboard.openInbox} href="/messages">
      <ul className="flex flex-col">
        {MESSAGES.map((m, i) => {
          const isUnread = !read.includes(m.id) && m.unread > 0;
          return (
            <li key={m.id} className={cn(i < MESSAGES.length - 1 && "border-b border-line")}>
              <Link href="/messages" className="flex w-full items-center gap-3 rounded-md py-3 text-left transition-colors hover:bg-surface-subtle">
                <span className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                  {m.online && <span aria-label="Online" className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-card bg-success-fg" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-label-lg text-ink">{m.name}</span>
                  <span className={cn("truncate text-body-sm", isUnread ? "font-semibold text-ink" : "text-ink-secondary")}>{m.preview}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-caption text-ink-tertiary">{m.time}</span>
                  {isUnread && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-label-sm text-ink-on-brand">{m.unread}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
