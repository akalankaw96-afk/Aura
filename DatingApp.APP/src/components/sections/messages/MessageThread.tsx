"use client";

import React from "react";
import { Danger, Message, ShieldTick, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/context/LanguageContext";
import { BlockedNotice } from "@/components/sections/member/ChatSafety";
import { ContactShareCard } from "@/components/sections/member/ContactShare";
import type { ChatMessageDto, ConversationDto } from "@/services/signalrService";
import type { ChatState } from "./useChat";

/** The open conversation: safety note, bubbles, contact-share card, typing dots and the blocked notice (S05-T07). */
export function MessageThread({ chat, conv }: Readonly<{ chat: ChatState; conv: ConversationDto }>) {
  const { t, lang } = useLanguage();
  const { share, safety, activeBlocked } = chat;
  // contact-share requests / answers are shown by the card, not as bubbles
  const bubbles = chat.messages.filter((m) => !m.isContactShareRequest && !m.isContactShareAccepted);

  return (
    <div className={cn("relative flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 transition-colors duration-300 sm:p-6", activeBlocked && "bg-surface-subtle")}>
      <div className={cn("space-y-4 transition-opacity duration-500", activeBlocked && "pointer-events-none select-none opacity-40 grayscale")}>
        {/* Figma: Safety note */}
        <p className="mx-auto flex w-fit max-w-full items-center gap-2 rounded-[12px] bg-info-bg px-3.5 py-2 text-body-xs font-semibold text-info-fg">
          <ShieldTick size={16} color="currentColor" className="shrink-0" /> {t.messages.safetyNote}
        </p>

        {/* Day Divider */}
        <div className="flex items-center justify-center">
          <span className="rounded-full bg-surface-subtle px-3 py-1 text-caption text-ink-tertiary">{lang === "si" ? "අද" : "Today"}</span>
        </div>

        {bubbles.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {/* Share contact details — request / response / result card */}
        <ContactShareCard
          ref={share.shareCardRef}
          status={share.shareStatus}
          name={conv.partnerName}
          partnerPhone={share.partnerPhone}
          myPhone={chat.myPhone}
          onAccept={share.accept}
          onDecline={share.decline}
          onCancel={share.cancel}
          onRequest={share.request}
        />

        {chat.partnerTyping && <TypingIndicator name={chat.partnerTyping} />}
      </div>

      {activeBlocked && (
        <BlockedNotice name={conv.partnerName} onReport={safety.reportMember} onUnblock={() => safety.unblock(conv.conversationId)} />
      )}

      <div ref={chat.messagesEndRef} />
    </div>
  );
}

function MessageBubble({ message: m }: Readonly<{ message: ChatMessageDto }>) {
  const time = m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now";
  return (
    <div className={cn("group flex flex-col", m.isMe ? "items-end" : "items-start")}>
      <div
        className={cn(
          "relative max-w-[85%] break-words p-3.5 text-body-md shadow-xs transition-all sm:max-w-[500px]",
          m.isFlaggedBySafety
            ? "rounded-2xl border-2 border-warning-line bg-warning-bg text-ink"
            : m.isMe
              ? "rounded-2xl rounded-tr-xs bg-brand-gradient text-ink-on-brand"
              : "rounded-2xl rounded-tl-xs border border-line bg-surface-subtle text-ink",
        )}
      >
        {/* Anti-Scam Alert Banner */}
        {m.isFlaggedBySafety && (
          <div className="mb-2 flex items-center gap-1.5 rounded bg-surface-card/70 px-2 py-1 text-caption font-bold text-warning-fg">
            <Danger size={16} color="currentColor" className="shrink-0 text-warning-fg" />
            <span>{m.safetyFlagReason || "Safety Warning: Potential risk detected."}</span>
          </div>
        )}
        <p className={cn(m.isFlaggedBySafety && "italic opacity-90")}>{m.messageText}</p>
      </div>

      <div className="mt-1 flex items-center gap-1 px-1 text-caption text-ink-tertiary">
        <span>{time}</span>
        {m.isMe && (
          <span>
            {/* read: filled tick in brand colour · sent: outline tick */}
            {m.isRead ? (
              <TickCircle size={14} color="currentColor" variant="Bold" aria-label="Read" className="ml-0.5 inline text-brand" />
            ) : (
              <TickCircle size={14} color="currentColor" aria-label="Sent" className="ml-0.5 inline text-ink-tertiary" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ name }: Readonly<{ name: string }>) {
  return (
    <div className="flex w-fit animate-pulse items-center gap-2 rounded-full bg-surface-subtle px-3 py-1.5 text-caption text-ink-tertiary">
      <Message size={14} color="currentColor" className="text-brand" />
      <span>{name} is typing...</span>
      <span className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </span>
    </div>
  );
}
