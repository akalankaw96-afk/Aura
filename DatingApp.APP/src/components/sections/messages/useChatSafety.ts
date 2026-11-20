"use client";

import { useCallback, useState } from "react";
import { markSafetyEvent } from "@/lib/feedback";
import { blockMember, getBlocked, reportMember as reportMemberApi, reportReasonFor, unblockMember } from "@/lib/matching";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import type { ConversationDto } from "@/services/signalrService";

/** Why / when a member was blocked (Figma: Messages — Blocked list). */
export interface BlockInfo {
  date: string;
  reason: string;
}

export type ChatFilter = "all" | "unread" | "blocked";

interface Options {
  conversations: ConversationDto[];
  activeConv: ConversationDto | undefined;
  filter: ChatFilter;
  /** Open this conversation (after blocking, the blocked chat stays open with its notice). */
  openConversation: (id: string) => void;
}

/**
 * Block / unblock / report / mute in chat (S05-T07: moved out of the Messages page).
 * Blocks live on the server (S03-T07): conversations carry isBlocked, GET /api/blocks gives the reason + date.
 * Mute is for this visit only.
 */
export function useChatSafety({ conversations, activeConv, filter, openConversation }: Options) {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [blocked, setBlocked] = useState<Record<string, BlockInfo>>({});
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [blockTargetId, setBlockTargetId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const shortDate = useCallback(
    (d: Date) => d.toLocaleDateString(lang === "si" ? "si-LK" : "en-GB", { day: "numeric", month: "short" }),
    [lang],
  );

  /** After the chat list loads: chats I blocked, with the reason and date from GET /api/blocks. */
  const syncBlocked = useCallback(
    async (list: ConversationDto[]) => {
      const blockedConvs = list.filter((c) => c.isBlocked);
      if (blockedConvs.length === 0) {
        setBlocked({});
        return;
      }
      const details = await getBlocked().catch(() => []);
      setBlocked(
        Object.fromEntries(
          blockedConvs.map((c) => {
            const b = details.find((d) => d.profileId === c.partnerProfileId);
            const date = b ? shortDate(new Date(`${b.blockedAt}Z`)) : "";
            return [c.conversationId, { date, reason: b?.reason ?? "" }];
          }),
        ),
      );
    },
    [shortDate],
  );

  const blockTarget = conversations.find((c) => c.conversationId === blockTargetId);

  // PUT /api/blocks/{profileId} (+ POST /api/reports when "also report" is ticked)
  const confirmBlock = async (opts: { reason: string; report: boolean }) => {
    const target = blockTarget;
    setBlockTargetId(null);
    if (!target) return;
    try {
      await blockMember(target.partnerProfileId, opts.reason);
    } catch (err) {
      toast.error("Couldn’t block", err instanceof Error ? err.message : "Please try again.");
      return;
    }
    markSafetyEvent(); // no feedback popup for 7 days
    setBlocked((b) => ({ ...b, [target.conversationId]: { date: shortDate(new Date()), reason: opts.reason } }));
    openConversation(target.conversationId);
    let reported = false;
    if (opts.report) {
      try {
        await reportMemberApi(target.partnerProfileId, reportReasonFor(opts.reason), opts.reason || "Reported from chat", target.conversationId);
        reported = true;
      } catch {
        reported = false; // already reported, or the report failed — the block still stands
      }
    }
    toast.success(t.messages.blockedToast(target.partnerName), reported ? t.messages.reportedToast : undefined);
  };

  const unblock = async (id: string) => {
    const conv = conversations.find((c) => c.conversationId === id);
    if (conv) {
      try {
        await unblockMember(conv.partnerProfileId);
      } catch (err) {
        toast.error("Couldn’t unblock", err instanceof Error ? err.message : "Please try again.");
        return;
      }
    }
    const done = () => {
      setBlocked((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
      setLeavingId(null);
      if (conv) toast.success(t.messages.unblockedToast(conv.partnerName));
    };
    if (filter === "blocked") {
      setLeavingId(id); // collapse the row first (Blocked Row → leaving)
      window.setTimeout(done, 320);
    } else done();
  };

  // Report without blocking (chat menu) — POST /api/reports, reaches the staff area
  const reportMember = async () => {
    if (!activeConv) return;
    try {
      await reportMemberApi(activeConv.partnerProfileId, "Other", "Reported from chat", activeConv.conversationId);
      markSafetyEvent();
      toast.info(t.messages.reportedToast);
    } catch (err) {
      toast.error("Report not sent", err instanceof Error ? err.message : "Please try again.");
    }
  };

  const toggleMute = (id: string) => {
    const next = !muted[id];
    setMuted((m) => ({ ...m, [id]: next }));
    toast.info(next ? t.messages.mutedToast : t.messages.unmutedToast);
  };

  return {
    blocked,
    muted,
    leavingId,
    blockTarget,
    askBlock: setBlockTargetId,
    cancelBlock: () => setBlockTargetId(null),
    syncBlocked,
    confirmBlock,
    unblock,
    reportMember,
    toggleMute,
  };
}
