"use client";

import React from "react";
import { SearchNormal1, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/FilterChip";
import { useLanguage } from "@/context/LanguageContext";
import { BlockedEmpty, BlockedRow } from "@/components/sections/member/ChatSafety";
import type { ConversationDto } from "@/services/signalrService";
import type { ChatState } from "./useChat";

/** Left panel of Messages: search, All / Unread / Blocked filters and the chat list (S05-T07). */
export function ConversationList({ chat }: Readonly<{ chat: ChatState }>) {
  const { t } = useLanguage();
  const { filter, setFilter, filteredConversations, activeConv, safety, loadError, conversations } = chat;

  return (
    <aside
      className={cn(
        "flex w-full flex-col border-r border-line bg-surface-card lg:w-[360px] lg:shrink-0",
        chat.mobileChatOpen ? "hidden lg:flex" : "flex",
      )}
    >
      {/* Search Header */}
      <div className="border-b border-line p-4">
        <div className="flex h-11 items-center gap-2 rounded-md border border-line bg-surface-subtle px-3 transition-colors focus-within:border-brand-focus">
          <SearchNormal1 size={18} color="currentColor" className="shrink-0 text-icon-muted" />
          <input
            type="text"
            value={chat.search}
            onChange={(e) => chat.setSearch(e.target.value)}
            placeholder={t.messages.searchPlaceholder}
            className="h-full w-full min-w-0 bg-transparent text-body-md text-ink placeholder:text-ink-disabled outline-none"
          />
        </div>

        {/* Filter Pills — Figma: Filter Chip / Size = Wide (16px sides) */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
          <FilterChip selected={filter === "all"} onClick={() => setFilter("all")}>
            {t.messages.all}
          </FilterChip>
          <FilterChip selected={filter === "unread"} count={chat.unreadChats} onClick={() => setFilter("unread")}>
            {t.messages.unread}
          </FilterChip>
          <FilterChip
            selected={filter === "blocked"}
            count={chat.blockedCount}
            onClick={() => setFilter("blocked")}
            className={filter === "blocked" ? "!bg-none bg-error-fg" : undefined}
          >
            {t.messages.blocked}
          </FilterChip>
        </div>
      </div>

      {/* Conversation Items List */}
      <div key={filter} className="flex-1 overflow-y-auto p-2">
        {filter === "blocked" ? (
          <div className="flex flex-col">
            <div className="animate-fade-up px-2 pb-3 pt-1">
              <p className="text-label-lg text-ink">{t.messages.blockedMembers}</p>
              <p className="mt-1 text-body-xs text-ink-secondary">{t.messages.blockedHelp}</p>
            </div>
            {filteredConversations.length === 0 ? (
              <BlockedEmpty />
            ) : (
              filteredConversations.map((c, i) => {
                const info = safety.blocked[c.conversationId];
                return (
                  <BlockedRow
                    key={c.conversationId}
                    index={i}
                    name={c.partnerName}
                    photo={c.partnerPhotoUrl}
                    meta={[t.messages.blockedOn(info?.date ?? ""), info?.reason].filter(Boolean).join(" · ")}
                    selected={activeConv?.conversationId === c.conversationId}
                    leaving={safety.leavingId === c.conversationId}
                    onSelect={() => chat.selectConversation(c.conversationId)}
                    onUnblock={() => safety.unblock(c.conversationId)}
                  />
                );
              })
            )}
          </div>
        ) : loadError && conversations.length === 0 ? (
          <div role="alert" className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <p className="text-body-sm text-error-fg">{loadError}</p>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => void chat.loadData()}>
              Try again
            </Button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-12 text-center text-body-sm text-ink-tertiary">No accepted match conversations found.</div>
        ) : (
          filteredConversations.map((c, i) => (
            <ConversationRow
              key={c.conversationId}
              conversation={c}
              index={i}
              selected={activeConv?.conversationId === c.conversationId}
              onSelect={() => chat.selectConversation(c.conversationId)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function ConversationRow({
  conversation: c,
  index,
  selected,
  onSelect,
}: Readonly<{ conversation: ConversationDto; index: number; selected: boolean; onSelect: () => void }>) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ animation: `fade-up 450ms cubic-bezier(0.22,1,0.36,1) ${index * 60}ms backwards` }}
      className={cn("flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all", selected ? "bg-brand-subtle shadow-xs" : "hover:bg-surface-subtle")}
    >
      {/* Avatar with Online indicator */}
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.partnerPhotoUrl} alt={c.partnerName} className="h-12 w-12 rounded-full object-cover" />
        {c.partnerOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-card bg-success-fg" />}
      </div>

      {/* Snippet */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 truncate text-label-md text-ink">
            {c.partnerName}
            {c.partnerVerified && <Verify size={14} color="currentColor" variant="Bold" className="text-icon-brand" />}
          </span>
          <span className="text-caption text-ink-tertiary">
            {new Date(c.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className={cn("truncate text-body-sm", c.unreadCount > 0 ? "font-semibold text-ink" : "text-ink-secondary")}>{c.lastMessageText}</p>
      </div>

      {/* Unread Pill */}
      {c.unreadCount > 0 && (
        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-label-sm text-ink-on-brand">
          {c.unreadCount}
        </span>
      )}
    </button>
  );
}
