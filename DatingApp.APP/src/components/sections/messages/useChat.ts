"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canUse, handleHubLimitError, refreshUsage } from "@/lib/usage";
import { useAuthSession } from "@/lib/session";
import { useToast } from "@/components/ui/Toast";
import {
  signalrService,
  getConversations,
  getChatHistory,
  type ChatMessageDto,
  type ConversationDto,
  type TypingIndicatorDto,
  type ContactUnlockedDto,
} from "@/services/signalrService";
import { hubMessage, useContactShare } from "./useContactShare";
import { useChatSafety, type ChatFilter } from "./useChatSafety";

/** Flow 3 anti-scam check, run on the client for instant feedback (the server flags too). */
const SCAM_PATTERN = /\b(money|transfer|bank\s*account|cash|rupees|rs\.?|lkr|emergency\s*fund|crypto|usdt|bitcoin)\b/i;
const SCAM_WARNING =
  "Safety Alert: Potential financial solicitation detected. Never transfer money or disclose banking details online.";

/**
 * Everything the Messages page does (S05-T07: moved out of `app/messages/page.tsx`): the chat list, the open
 * conversation, SignalR (messages, typing, read receipts, contact share), sending, and — through
 * `useContactShare` / `useChatSafety` — contact sharing and block / report / mute.
 */
export function useChat() {
  const toast = useToast();
  // The signed-in member (from the login session — no demo identity)
  const { session, fullName } = useAuthSession();
  const currentProfileId = session?.profileId ?? "";
  const currentUserName = fullName;
  const myPhone = session?.phoneNumber ?? "";

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [filter, setFilter] = useState<ChatFilter>("all");
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  // the chat list couldn't be loaded (API down / offline) — shown instead of "no conversations" (S05-T06)
  const [loadError, setLoadError] = useState<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTypingDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const activeConv = useMemo(() => conversations.find((c) => c.conversationId === activeConvId), [conversations, activeConvId]);

  const share = useContactShare(activeConv, currentProfileId);
  const safety = useChatSafety({ conversations, activeConv, filter, openConversation: setActiveConvId });
  const { setShare, setPartnerPhone, syncFromConversations, syncFromHistory } = share;
  const { syncBlocked } = safety;

  // Scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping, scrollToBottom]);

  // Load conversations from backend
  const loadData = useCallback(async () => {
    // No profile yet → no conversations. The server works out whose chats these are from the token.
    let list: ConversationDto[] = [];
    try {
      list = currentProfileId ? await getConversations() : [];
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "We couldn’t load your chats.");
      return; // keep what is on screen
    }
    setConversations(list);
    syncFromConversations(list);
    await syncBlocked(list);
    if (list.length > 0) {
      // ?c= from the dashboard / Friends: a conversation id or the partner's profile id (first load only)
      const wanted = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("c") : null;
      const target = wanted && !activeConvId ? list.find((c) => c.conversationId === wanted || c.partnerProfileId === wanted) : undefined;
      if (target) {
        setActiveConvId(target.conversationId);
        setMobileChatOpen(true);
      } else if (!list.some((c) => c.conversationId === activeConvId)) {
        setActiveConvId(list[0].conversationId);
      }
    } else {
      setActiveConvId("");
      setMessages([]);
    }
  }, [currentProfileId, activeConvId, syncFromConversations, syncBlocked]);

  // Load chat history when active conversation changes
  const loadActiveHistory = useCallback(
    async (convId: string) => {
      if (!convId) {
        setMessages([]);
        return;
      }
      let history: ChatMessageDto[];
      try {
        history = await getChatHistory(convId);
      } catch (err) {
        toast.error("Couldn’t load the conversation", err instanceof Error ? err.message : "Please try again.");
        return; // keep what is on screen
      }
      setMessages(history);
      syncFromHistory(convId, history);
    },
    [toast, syncFromHistory],
  );

  // Initialize SignalR Hub connection and subscriptions
  useEffect(() => {
    let mounted = true;

    async function initSignalR() {
      await loadData();
      const connected = await signalrService.startConnection();
      if (!mounted) return;
      if (connected && activeConvId) await signalrService.joinConversation(activeConvId);
    }

    void initSignalR();

    const unsubMsg = signalrService.onMessageReceived((newMsg: ChatMessageDto) => {
      if (!mounted) return;
      const isFromMe = newMsg.senderProfileId === currentProfileId;

      // Only messages for the open conversation belong in the thread
      if (newMsg.conversationId === activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          // Replace the optimistic copy of my own message with the saved one (real id, safety flags)
          const tempIndex = isFromMe ? prev.findIndex((m) => m.id.startsWith("temp_") && m.messageText === newMsg.messageText) : -1;
          if (tempIndex >= 0) {
            const next = [...prev];
            next[tempIndex] = { ...newMsg, isMe: true };
            return next;
          }
          return [...prev, { ...newMsg, isMe: isFromMe }];
        });
      }

      // Last message in the chat list
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === newMsg.conversationId ? { ...c, lastMessageText: newMsg.messageText, lastMessageTime: newMsg.sentAt } : c,
        ),
      );

      // Contact-share events carried as messages
      if (newMsg.isContactShareRequest && !isFromMe) setShare(newMsg.conversationId, "received");
      if (newMsg.isContactShareAccepted) setShare(newMsg.conversationId, "accepted");
      if (newMsg.isContactShareDeclined) setShare(newMsg.conversationId, isFromMe ? "declined-by-me" : "declined-by-them");
      if (newMsg.isContactShareCancelled) setShare(newMsg.conversationId, "none");
    });

    const unsubShareClosed = signalrService.onContactShareClosed((convId, byProfileId, how) => {
      if (!mounted) return;
      if (how === "cancelled") setShare(convId, "none");
      else setShare(convId, byProfileId === currentProfileId ? "declined-by-me" : "declined-by-them");
    });

    const unsubTyping = signalrService.onUserTyping((indicator: TypingIndicatorDto) => {
      if (!mounted) return;
      if (indicator.conversationId !== activeConvId || indicator.userName === currentUserName) return;
      if (indicator.isTyping) {
        setPartnerTyping(indicator.userName);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          if (mounted) setPartnerTyping(null);
        }, 3500);
      } else {
        setPartnerTyping(null);
      }
    });

    const unsubRead = signalrService.onMessageRead((_convId, messageId) => {
      if (!mounted) return;
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m)));
    });

    const unsubContactReq = signalrService.onContactShareRequested((convId, requesterId) => {
      if (!mounted) return;
      if (requesterId !== currentProfileId) setShare(convId, "received");
    });

    const unsubContactUnlocked = signalrService.onContactUnlocked((payload: ContactUnlockedDto) => {
      if (!mounted) return;
      setShare(payload.conversationId, "accepted");
      if (payload.phoneNumber) setPartnerPhone(payload.conversationId, payload.phoneNumber);
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === payload.conversationId ? { ...c, isContactShared: true, partnerPhoneNumber: payload.phoneNumber } : c,
        ),
      );
    });

    return () => {
      mounted = false;
      unsubMsg();
      unsubTyping();
      unsubRead();
      unsubContactReq();
      unsubContactUnlocked();
      unsubShareClosed();
      signalrService.leaveConversation(activeConvId);
    };
  }, [loadData, activeConvId, currentProfileId, currentUserName, setShare, setPartnerPhone]);

  // Whenever active conversation changes, load its history & join its group
  useEffect(() => {
    if (activeConvId) {
      void loadActiveHistory(activeConvId);
      signalrService.joinConversation(activeConvId);
      setPartnerTyping(null);
    }
  }, [activeConvId, loadActiveHistory]);

  // Typing: "typing" once, then "stopped" 2 s after the last key
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeConvId) return;
    if (!sendTypingDebounceRef.current) signalrService.sendTyping(activeConvId, currentUserName, true);
    else clearTimeout(sendTypingDebounceRef.current);
    sendTypingDebounceRef.current = setTimeout(() => {
      signalrService.sendTyping(activeConvId, currentUserName, false);
      sendTypingDebounceRef.current = null;
    }, 2000);
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    const textToSend = customText ?? inputText;
    if (!textToSend.trim() || !activeConv) return;
    // The first message of a conversation counts as a new chat on the server (402-style LIMIT_REACHED at the limit)
    const startsChat = messages.length === 0;
    if (startsChat && !canUse("chats")) return;

    if (!customText) setInputText("");
    signalrService.sendTyping(activeConv.conversationId, currentUserName, false);

    const isScamMatch = SCAM_PATTERN.test(textToSend);
    const tempId = "temp_" + Date.now();
    const optimisticMsg: ChatMessageDto = {
      id: tempId,
      senderProfileId: currentProfileId,
      senderName: currentUserName,
      senderPhotoUrl: "",
      receiverProfileId: activeConv.partnerProfileId,
      receiverName: activeConv.partnerName,
      conversationId: activeConv.conversationId,
      messageText: textToSend.trim(),
      sentAt: new Date().toISOString(),
      isRead: false,
      isMe: true,
      isFlaggedBySafety: isScamMatch,
      safetyFlagReason: isScamMatch ? SCAM_WARNING : null,
      isContactShareRequest: false,
      isContactShareAccepted: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const sent = await signalrService.sendMessage(currentProfileId, activeConv.partnerProfileId, textToSend.trim(), activeConv.conversationId);
    if (sent.ok) {
      if (startsChat) void refreshUsage();
      return;
    }
    // not delivered → take the optimistic copy back and say why
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
    if (!customText) setInputText(textToSend);
    if (handleHubLimitError(sent.error)) return;
    toast.error("Message not sent", hubMessage(sent.error));
  };

  const selectConversation = (id: string) => {
    setActiveConvId(id);
    setMobileChatOpen(true);
  };

  const { blocked } = safety;
  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      const isBlocked = !!blocked[c.conversationId];
      if (filter === "blocked" ? !isBlocked : isBlocked) return false;
      if (filter === "unread" && c.unreadCount === 0) return false;
      if (!q) return true;
      return c.partnerName.toLowerCase().includes(q) || c.lastMessageText.toLowerCase().includes(q);
    });
  }, [conversations, filter, search, blocked]);
  const unreadChats = useMemo(() => conversations.filter((c) => !blocked[c.conversationId] && c.unreadCount > 0).length, [conversations, blocked]);
  const blockedCount = useMemo(() => conversations.filter((c) => blocked[c.conversationId]).length, [conversations, blocked]);
  const activeBlocked = activeConv ? blocked[activeConv.conversationId] : undefined;

  // Bring the Blocked Notice into view when a chat is blocked
  useEffect(() => {
    if (activeBlocked) window.setTimeout(scrollToBottom, 60);
  }, [activeBlocked, scrollToBottom]);

  return {
    myPhone,
    conversations,
    filteredConversations,
    activeConv,
    activeBlocked,
    messages,
    filter,
    setFilter,
    search,
    setSearch,
    inputText,
    handleInputChange,
    handleSend,
    mobileChatOpen,
    setMobileChatOpen,
    loadError,
    loadData,
    partnerTyping,
    messagesEndRef,
    unreadChats,
    blockedCount,
    selectConversation,
    share,
    safety,
  };
}

export type ChatState = ReturnType<typeof useChat>;
