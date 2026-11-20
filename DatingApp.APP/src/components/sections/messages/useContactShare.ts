"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markContactAccepted } from "@/lib/feedback";
import { canUse, handleHubLimitError } from "@/lib/usage";
import { useToast } from "@/components/ui/Toast";
import type { ContactShareStatus } from "@/components/sections/member/ContactShare";
import { signalrService, type ChatMessageDto, type ConversationDto } from "@/services/signalrService";

/** Hub errors arrive as "CODE: message" — show only the message. */
export const hubMessage = (error: string) => error.replace(/^[A-Z_]+:\s*/, "");

/** Contact-share state of a conversation, worked out from its history (shared once = shared; else the latest request / answer). */
export function shareStateFromHistory(history: ChatMessageDto[]): ContactShareStatus | null {
  const events = history.filter((m) => m.isContactShareRequest || m.isContactShareAccepted || m.isContactShareDeclined || m.isContactShareCancelled);
  const last = events[events.length - 1];
  if (events.some((m) => m.isContactShareAccepted)) return "accepted";
  if (!last) return null;
  if (last.isContactShareRequest) return last.isMe ? "sent" : "received";
  if (last.isContactShareDeclined) return last.isMe ? "declined-by-me" : "declined-by-them";
  return "none";
}

/**
 * Share contact details (mutual consent), per conversation (S05-T07: moved out of the Messages page).
 * State comes from the server (contactShareState); "declined" is kept for the rest of the visit after a "not now".
 * Asking is a Gold feature (the server checks too); answering is free on every plan.
 */
export function useContactShare(activeConv: ConversationDto | undefined, currentProfileId: string) {
  const toast = useToast();
  const [shareByConv, setShareByConv] = useState<Record<string, ContactShareStatus>>({});
  const [partnerPhones, setPartnerPhones] = useState<Record<string, string>>({});
  const shareCardRef = useRef<HTMLDivElement>(null);

  const setShare = useCallback((convId: string, status: ContactShareStatus) => {
    if (status === "accepted") markContactAccepted(); // feedback popup: happy moment
    setShareByConv((s) => ({ ...s, [convId]: status }));
  }, []);

  /** After the chat list loads: take the server state, but keep a "declined" note shown this visit. */
  const syncFromConversations = useCallback((list: ConversationDto[]) => {
    setShareByConv((s) => {
      const next = { ...s };
      for (const c of list) {
        const server = (c.contactShareState ?? (c.isContactShared ? "accepted" : "none")) as ContactShareStatus;
        next[c.conversationId] = server === "none" && s[c.conversationId]?.startsWith("declined") ? s[c.conversationId] : server;
      }
      return next;
    });
  }, []);

  /** After a conversation's history loads (no feedback popup: nothing new happened). */
  const syncFromHistory = useCallback((convId: string, history: ChatMessageDto[]) => {
    const state = shareStateFromHistory(history);
    if (state) setShareByConv((s) => ({ ...s, [convId]: state }));
  }, []);

  const setPartnerPhone = useCallback((convId: string, phone: string) => {
    setPartnerPhones((p) => ({ ...p, [convId]: phone }));
  }, []);

  const shareStatus: ContactShareStatus = activeConv
    ? shareByConv[activeConv.conversationId] ?? (activeConv.isContactShared ? "accepted" : "none")
    : "none";
  const partnerPhone = activeConv ? partnerPhones[activeConv.conversationId] || activeConv.partnerPhoneNumber || "" : "";
  const activeConvId = activeConv?.conversationId ?? "";

  // bring the contact card into view whenever its state changes (request sent, accepted, declined…)
  useEffect(() => {
    if (shareStatus !== "none") {
      const id = window.setTimeout(() => shareCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
      return () => window.clearTimeout(id);
    }
  }, [shareStatus, activeConvId]);

  const scrollToShareCard = () => shareCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const request = async () => {
    if (!activeConv) return;
    if (!canUse("contactShare")) return;
    const convId = activeConv.conversationId;
    const before = shareByConv[convId] ?? "none";
    setShare(convId, "sent");
    const r = await signalrService.requestContactShare(convId, currentProfileId, activeConv.partnerProfileId);
    if (r.ok) {
      toast.success("Request sent", `We’ll let you know when ${activeConv.partnerName.split(" ")[0]} accepts.`);
      return;
    }
    setShare(convId, before);
    if (!handleHubLimitError(r.error)) toast.error("Request not sent", hubMessage(r.error));
  };

  const accept = async () => {
    if (!activeConv) return;
    const convId = activeConv.conversationId;
    setShare(convId, "accepted");
    const r = await signalrService.acceptContactShare(convId, currentProfileId, activeConv.partnerProfileId);
    if (r.ok) {
      toast.success("Contact details shared", `You can now call or WhatsApp ${activeConv.partnerName.split(" ")[0]}.`);
      return;
    }
    setShare(convId, "received");
    toast.error("Couldn’t share", hubMessage(r.error));
  };

  const decline = async () => {
    if (!activeConv) return;
    const convId = activeConv.conversationId;
    setShare(convId, "declined-by-me");
    const r = await signalrService.declineContactShare(activeConv.partnerProfileId);
    if (r.ok) {
      toast.info("Not shared", "Your number stays private. You can share later.");
      return;
    }
    setShare(convId, "received");
    toast.error("Couldn’t answer", hubMessage(r.error));
  };

  const cancel = async () => {
    if (!activeConv) return;
    const convId = activeConv.conversationId;
    setShare(convId, "none");
    const r = await signalrService.cancelContactShare(activeConv.partnerProfileId);
    if (r.ok) {
      toast.info("Request cancelled");
      return;
    }
    setShare(convId, "sent");
    toast.error("Couldn’t cancel", hubMessage(r.error));
  };

  return {
    shareCardRef,
    shareStatus,
    partnerPhone,
    setShare,
    setPartnerPhone,
    syncFromConversations,
    syncFromHistory,
    scrollToShareCard,
    request,
    accept,
    decline,
    cancel,
  };
}
