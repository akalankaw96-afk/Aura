"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AttachCircle,
  More,
  SearchNormal1,
  Send2,
  ShieldTick,
  Verify,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { CONVERSATIONS, type Conversation, type ChatMessage } from "@/content/dashboard";

/**
 * Figma: 📊 Member Dashboard → Messages — Desktop 1440 (172:15691)
 *
 * Dedicated chat interface: conversation sidebar with live search & filters,
 * active thread with safety notice, bubbles, and interactive composer.
 */
export default function MessagesPage() {
  const { t, lang } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>("c1");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = useMemo(() => {
    return conversations.find((c) => c.id === activeId) ?? conversations[0];
  }, [conversations, activeId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === "unread" && c.unread === 0) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.messages.some((m) => m.text.toLowerCase().includes(q))
      );
    });
  }, [conversations, filter, search]);

  const unreadTotal = useMemo(() => {
    return conversations.reduce((acc, c) => acc + c.unread, 0);
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || !activeConv) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "me",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            time: newMsg.time,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setText("");
  };

  const handleSelectConv = (id: string) => {
    setActiveId(id);
    setMobileChatOpen(true);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  };

  return (
    <div className="min-h-screen bg-page-gradient">
      <Navbar variant="member" />

      <main className="container-page pb-20 pt-6 lg:pt-8">
        {/* Header & Breadcrumb */}
        <div className="mb-8">
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 text-body-sm text-ink-tertiary">
            <Link href="/dashboard" className="transition-colors hover:text-brand">
              {t.nav.dashboard}
            </Link>
            <span>/</span>
            <span className="font-semibold text-ink">{t.nav.messages}</span>
          </nav>
          <h1 className="text-h2 text-ink">{t.messages.title}</h1>
          <p className="mt-1 text-body-md text-ink-secondary">
            {t.messages.subtitle}
          </p>
        </div>

        {/* Chat Split Window (Figma: 1280 × 680) */}
        <div className="flex h-[720px] overflow-hidden rounded-xl border border-line bg-surface-card shadow-sm">
          {/* Left Panel: Conversation List */}
          <aside
            className={cn(
              "flex w-full flex-col border-r border-line bg-surface-card lg:w-[360px] lg:shrink-0",
              mobileChatOpen ? "hidden lg:flex" : "flex"
            )}
          >
            {/* Search Header */}
            <div className="border-b border-line p-4">
              <div className="flex h-11 items-center gap-2 rounded-md border border-line bg-surface-subtle px-3 transition-colors focus-within:border-brand-focus">
                <SearchNormal1 size={18} color="currentColor" className="shrink-0 text-icon-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.messages.searchPlaceholder}
                  className="h-full w-full min-w-0 bg-transparent text-body-md text-ink placeholder:text-ink-disabled outline-none"
                />
              </div>

              {/* Filter Pills */}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={cn(
                    "rounded-full px-3 py-1 text-label-sm transition-all",
                    filter === "all"
                      ? "bg-brand-gradient text-ink-on-brand shadow-xs"
                      : "bg-surface-subtle text-ink-secondary hover:text-ink"
                  )}
                >
                  {t.messages.all}
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("unread")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm transition-all",
                    filter === "unread"
                      ? "bg-brand-gradient text-ink-on-brand shadow-xs"
                      : "bg-surface-subtle text-ink-secondary hover:text-ink"
                  )}
                >
                  <span>{t.messages.unread}</span>
                  {unreadTotal > 0 && (
                    <span
                      className={cn(
                        "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                        filter === "unread" ? "bg-white/20 text-white" : "bg-brand text-ink-on-brand"
                      )}
                    >
                      {unreadTotal}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredConversations.length === 0 ? (
                <div className="py-12 text-center text-body-sm text-ink-tertiary">
                  No conversations found.
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = activeConv?.id === c.id;
                  const lastMsg = c.messages[c.messages.length - 1];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectConv(c.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all",
                        isSelected
                          ? "bg-brand-subtle shadow-xs"
                          : "hover:bg-surface-subtle"
                      )}
                    >
                      {/* Avatar with Online indicator */}
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.photo}
                          alt={c.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        {c.online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-card bg-success-fg" />
                        )}
                      </div>

                      {/* Snippet */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 truncate text-label-md text-ink">
                            {c.name}
                            {c.verified && (
                              <Verify size={14} color="currentColor" variant="Bold" className="text-icon-brand" />
                            )}
                          </span>
                          <span className="text-caption text-ink-tertiary">{c.time}</span>
                        </div>
                        <p
                          className={cn(
                            "truncate text-body-sm",
                            c.unread > 0 ? "font-semibold text-ink" : "text-ink-secondary"
                          )}
                        >
                          {lastMsg ? lastMsg.text : "No messages yet"}
                        </p>
                      </div>

                      {/* Unread Pill */}
                      {c.unread > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-label-sm text-ink-on-brand shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Panel: Active Chat Room */}
          {activeConv ? (
            <section
              className={cn(
                "flex flex-1 flex-col bg-surface-card",
                !mobileChatOpen ? "hidden lg:flex" : "flex"
              )}
            >
              {/* Chat Header */}
              <div className="flex h-[76px] items-center justify-between border-b border-line px-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileChatOpen(false)}
                    aria-label="Back to conversations"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink-tertiary hover:bg-surface-subtle lg:hidden"
                  >
                    <ArrowLeft size={20} color="currentColor" />
                  </button>

                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeConv.photo}
                      alt={activeConv.name}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    {activeConv.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-card bg-success-fg" />
                    )}
                  </div>

                  <div>
                    <h2 className="flex items-center gap-1.5 text-label-lg text-ink">
                      {activeConv.name}
                      <Verify size={16} color="currentColor" variant="Bold" className="text-icon-brand" />
                    </h2>
                    <p className="text-caption text-ink-tertiary">{activeConv.status}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/requests">
                    <Button variant="outline" size="sm">
                      {t.messages.viewProfile}
                    </Button>
                  </Link>
                  <button
                    type="button"
                    aria-label="Conversation options"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink-tertiary hover:bg-surface-subtle"
                  >
                    <More size={20} color="currentColor" />
                  </button>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Safety Note */}
                <div className="mx-auto flex max-w-lg items-center gap-2 rounded-full border border-warning-line/30 bg-warning-bg/50 px-4 py-2 text-center text-body-xs text-warning-fg">
                  <ShieldTick size={16} color="currentColor" className="shrink-0" />
                  <span>{t.messages.safetyNote}</span>
                </div>

                {/* Day Divider */}
                <div className="flex items-center justify-center">
                  <span className="rounded-full bg-surface-subtle px-3 py-1 text-caption text-ink-tertiary">
                    {lang === "si" ? "අද" : "Today"}
                  </span>
                </div>

                {/* Bubbles */}
                {activeConv.messages.map((m) => {
                  const isMe = m.sender === "me";
                  return (
                    <div
                      key={m.id}
                      className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[480px] p-3.5 text-body-md transition-all shadow-xs",
                          isMe
                            ? "rounded-2xl rounded-tr-xs bg-brand-gradient text-ink-on-brand"
                            : "rounded-2xl rounded-tl-xs border border-line bg-surface-subtle text-ink"
                        )}
                      >
                        {m.text}
                      </div>
                      <span className="mt-1 px-1 text-caption text-ink-tertiary">
                        {m.time} {isMe && m.read && (lang === "si" ? "· කියවන ලදී" : "· Read")}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-line p-4">
                <button
                  type="button"
                  aria-label="Attach document or photo"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-surface-subtle hover:text-brand"
                >
                  <AttachCircle size={24} color="currentColor" />
                </button>

                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.messages.typeMessage}
                  className="h-11 flex-1 min-w-0 rounded-md border border-line bg-surface-subtle px-4 text-body-md text-ink placeholder:text-ink-disabled outline-none transition-colors focus:border-brand-focus"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!text.trim()}
                  rightIcon={<Send2 size={18} color="currentColor" />}
                >
                  {t.messages.send}
                </Button>
              </form>
            </section>
          ) : (
            <div className="flex flex-1 items-center justify-center text-body-md text-ink-tertiary">
              {lang === "si" ? "කතාබස් කිරීමට සංවාදයක් තෝරන්න" : "Select a conversation to start chatting"}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
