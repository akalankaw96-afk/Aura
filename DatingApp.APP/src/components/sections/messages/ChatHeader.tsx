"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, More, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { ChatActionMenu } from "@/components/sections/member/ChatSafety";
import { ContactShareHeaderAction, contactShareMenuLabel } from "@/components/sections/member/ContactShare";
import type { ConversationDto } from "@/services/signalrService";
import type { ChatState } from "./useChat";

/** Top bar of the open conversation: back (phones), partner, contact share, profile and the ⋯ menu (S05-T07). */
export function ChatHeader({ chat, conv }: Readonly<{ chat: ChatState; conv: ConversationDto }>) {
  const { t } = useLanguage();
  const router = useRouter();
  const { share, safety, activeBlocked } = chat;
  const { shareStatus, partnerPhone } = share;

  const contactAction =
    shareStatus === "accepted"
      ? () => window.open(`https://wa.me/${partnerPhone.replace(/\D/g, "")}`, "_blank")
      : shareStatus === "received"
        ? share.scrollToShareCard
        : shareStatus === "sent"
          ? () => undefined
          : share.request;

  return (
    <div className="flex h-[68px] items-center justify-between gap-2 border-b border-line px-2 sm:h-[76px] sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => chat.setMobileChatOpen(false)}
          aria-label="Back to conversations"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-tertiary hover:bg-surface-subtle lg:hidden"
        >
          <ArrowLeft size={20} color="currentColor" />
        </button>

        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={conv.partnerPhotoUrl} alt={conv.partnerName} className="h-11 w-11 rounded-full object-cover" />
          {conv.partnerOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-card bg-success-fg" />}
        </div>

        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-label-lg text-ink">
            <span className="truncate">{conv.partnerName}</span>
            <Verify size={16} color="currentColor" variant="Bold" className="shrink-0 text-icon-brand" />
          </h2>
          {activeBlocked ? (
            <p className="animate-fade-in truncate text-caption text-error-fg">{t.messages.blockedStatus}</p>
          ) : (
            <p className="truncate text-caption text-ink-tertiary">{conv.partnerProfession || "Verified Candidate"} • Active Now</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {activeBlocked ? (
          <Button variant="outline" size="sm" className="animate-pop-in rounded-full" onClick={() => safety.unblock(conv.conversationId)}>
            {t.messages.unblock}
          </Button>
        ) : (
          <>
            {/* Share contact details (mutual consent) */}
            <ContactShareHeaderAction status={shareStatus} phone={partnerPhone} onRequest={share.request} onRespond={share.scrollToShareCard} />
            <Link href="/friends" className="hidden md:block">
              <Button variant="outline" size="sm">
                {t.messages.viewProfile}
              </Button>
            </Link>
          </>
        )}

        {/* Figma: Action Menu (⋯) — Mute, Block, Report */}
        <ChatActionMenu
          muted={!!safety.muted[conv.conversationId]}
          onToggleMute={() => safety.toggleMute(conv.conversationId)}
          onBlock={() => (activeBlocked ? undefined : safety.askBlock(conv.conversationId))}
          onReport={safety.reportMember}
          compactItems={
            activeBlocked
              ? []
              : [
                  { key: "profile", label: t.messages.viewProfile, onClick: () => router.push("/friends") },
                  { key: "contact", label: contactShareMenuLabel(shareStatus, partnerPhone), onClick: contactAction },
                ]
          }
          trigger={({ open, toggle }) => (
            <button
              type="button"
              aria-label={t.messages.moreOptions}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={toggle}
              className={cn(
                // matches the outline sm buttons beside it (40px, same ring) so the row reads as one set
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-card text-ink-secondary ring-1 ring-inset ring-line-strong transition-all hover:bg-brand-subtle hover:text-brand hover:ring-brand focus-visible:outline-none focus-visible:shadow-ring-brand active:scale-95",
                open && "bg-brand-subtle text-brand ring-brand",
              )}
            >
              <More size={20} color="currentColor" />
            </button>
          )}
        />
      </div>
    </div>
  );
}
