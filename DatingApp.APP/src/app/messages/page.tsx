"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { BackButton } from "@/components/ui/BackButton";
import { KycGuard } from "@/components/auth/KycGuard";
import { RequireMember } from "@/components/auth/RequireMember";
import { BlockConfirmDialog } from "@/components/sections/member/ChatSafety";
import { useChat } from "@/components/sections/messages/useChat";
import { ConversationList } from "@/components/sections/messages/ConversationList";
import { ChatHeader } from "@/components/sections/messages/ChatHeader";
import { MessageThread } from "@/components/sections/messages/MessageThread";
import { ChatComposer } from "@/components/sections/messages/ChatComposer";

/**
 * Messages — chat list on the left, the open conversation on the right (one at a time on phones).
 * The logic lives in `useChat` (+ `useContactShare`, `useChatSafety`); the pieces in `components/sections/messages` (S05-T07).
 */
export default function MessagesPage() {
  const { t, lang } = useLanguage();
  const chat = useChat();
  const { activeConv, safety } = chat;

  return (
    <div className="min-h-screen bg-page-gradient">
      <Navbar variant="member" />
      {/* Messages need an approved profile */}
      <RequireMember />
      <KycGuard />

      <main className="container-page pb-20 pt-6 lg:pt-8">
        {/* Page header — Figma: Back Button left of the title */}
        <div className="mb-6">
          <div className="enter grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-4 gap-y-1">
            <nav aria-label="Breadcrumb" className="col-start-2 flex items-center gap-2 text-body-sm text-ink-tertiary">
              <Link href="/dashboard" className="transition-colors hover:text-brand">
                {t.nav.dashboard}
              </Link>
              <span>/</span>
              <span className="font-semibold text-brand-text">{t.nav.messages}</span>
            </nav>
            <BackButton label={t.messages.back} />
            <h1 className="text-h3 text-ink md:text-h2">{t.messages.title}</h1>
            <p className="col-start-2 text-body-md text-ink-secondary">{t.messages.subtitle}</p>
          </div>
        </div>

        {/* Chat Split Window — on phones it fills the screen between the top bar and the floating tab bar */}
        <div className="flex h-[calc(100dvh-200px)] min-h-[460px] overflow-hidden rounded-xl border border-line bg-surface-card shadow-sm lg:h-[720px]">
          <ConversationList chat={chat} />

          {activeConv ? (
            <section className={cn("flex min-w-0 flex-1 flex-col bg-surface-card", !chat.mobileChatOpen ? "hidden lg:flex" : "flex")}>
              <ChatHeader chat={chat} conv={activeConv} />
              <MessageThread chat={chat} conv={activeConv} />
              <ChatComposer chat={chat} />
            </section>
          ) : (
            <div className="flex flex-1 items-center justify-center text-body-md text-ink-tertiary">
              {lang === "si" ? "කතාබස් කිරීමට සංවාදයක් තෝරන්න" : "Select a conversation to start chatting"}
            </div>
          )}
        </div>
      </main>

      <BlockConfirmDialog
        open={!!safety.blockTarget}
        name={safety.blockTarget?.partnerName ?? ""}
        onCancel={safety.cancelBlock}
        onConfirm={safety.confirmBlock}
      />

      <Footer />
    </div>
  );
}
