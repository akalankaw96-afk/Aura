"use client";

import React from "react";
import { AttachCircle, Send2 } from "iconsax-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { BlockedComposer } from "@/components/sections/member/ChatSafety";
import type { ChatState } from "./useChat";

/** Message box under the thread — read-only when the chat is blocked (S05-T07). */
export function ChatComposer({ chat }: Readonly<{ chat: ChatState }>) {
  const { t } = useLanguage();
  if (chat.activeBlocked) return <BlockedComposer />;

  return (
    <form onSubmit={chat.handleSend} className="flex items-center gap-2 border-t border-line p-2.5 sm:gap-3 sm:p-4">
      <button
        type="button"
        aria-label="Attach document or photo"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-surface-subtle hover:text-brand sm:h-11 sm:w-11"
      >
        <AttachCircle size={24} color="currentColor" />
      </button>

      <input
        type="text"
        value={chat.inputText}
        onChange={chat.handleInputChange}
        placeholder={t.messages.typeMessage}
        className="h-11 min-w-0 flex-1 rounded-md border border-line bg-surface-subtle px-4 text-body-md text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-brand-focus"
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={!chat.inputText.trim()}
        aria-label={t.messages.send}
        className="shrink-0 max-sm:h-11 max-sm:w-11 max-sm:rounded-full max-sm:px-0"
        rightIcon={<Send2 size={18} color="currentColor" />}
      >
        <span className="hidden sm:inline">{t.messages.send}</span>
      </Button>
    </form>
  );
}
