"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AttachCircle,
  More,
  SearchNormal1,
  Send2,
  ShieldTick,
  Verify,
} from "iconsax-react";
import {
  Phone,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCheck,
  Check,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { BackButton } from "@/components/ui/BackButton";
import { FilterChip } from "@/components/ui/FilterChip";
import { useToast } from "@/components/ui/Toast";
import {
  BlockConfirmDialog,
  BlockedComposer,
  BlockedEmpty,
  BlockedNotice,
  BlockedRow,
  ChatActionMenu,
} from "@/components/sections/member/ChatSafety";
import { DEMO_BLOCKED_CONV, DEMO_CONVERSATIONS, demoHistory, type BlockInfo } from "@/content/demoChat";
import {
  signalrService,
  getConversations,
  getChatHistory,
  type ChatMessageDto,
  type ConversationDto,
  type TypingIndicatorDto,
  type ContactUnlockedDto,
  type ConnectionStatus,
} from "@/services/signalrService";

export default function MessagesPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  // Current logged in user context
  const currentProfileId = "5272b78c-df15-4c1e-9fa0-c3b9e6ed9fc2";
  const currentProfileCode = "LK-9021";
  const currentUserName = "Dr. Kavinda Perera";

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "blocked">("all");
  const toast = useToast();
  // Block / mute state (Figma: Messages — Blocked list / Block confirm).
  // TODO(api): persist via the backend once block/report endpoints exist.
  const [blocked, setBlocked] = useState<Record<string, BlockInfo>>({});
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [blockTargetId, setBlockTargetId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const demoModeRef = useRef(false);
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [partnerTyping, setPartnerTyping] = useState<string | null>(null);
  const [contactRequestPending, setContactRequestPending] = useState(false);
  const [unlockedPhone, setUnlockedPhone] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTypingDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const activeConv = useMemo(() => {
    return conversations.find((c) => c.conversationId === activeConvId);
  }, [conversations, activeConvId]);

  // Scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping, scrollToBottom]);

  // Load conversations from backend
  const loadData = useCallback(async () => {
    let list = await getConversations(currentProfileCode);
    // Offline / no backend → demo conversations so the UI flows can be reviewed.
    if (!list || list.length === 0) {
      if (!demoModeRef.current) {
        demoModeRef.current = true;
        setBlocked((b) => ({ ...DEMO_BLOCKED_CONV, ...b }));
      }
      list = DEMO_CONVERSATIONS;
    }
    setConversations(list || []);
    if (list && list.length > 0) {
      if (!list.some((c) => c.conversationId === activeConvId)) {
        setActiveConvId(list[0].conversationId);
      }
    } else {
      setActiveConvId("");
      setMessages([]);
    }
  }, [currentProfileCode, activeConvId]);

  // Load chat history when active conversation changes
  const loadActiveHistory = useCallback(async (convId: string) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    const history = demoModeRef.current ? demoHistory(convId) : await getChatHistory(convId, currentProfileId);
    if (history && history.length > 0) {
      setMessages(history);

      const unlockedMsg = history.find((m) => m.isContactShareAccepted);
      if (unlockedMsg) {
        setUnlockedPhone("+94 77 123 4567");
      }

      const shareReq = history.find((m) => m.isContactShareRequest && !m.isContactShareAccepted);
      if (shareReq && !shareReq.isMe) {
        setContactRequestPending(true);
      }
    } else {
      setMessages([]);
    }
  }, [currentProfileId]);

  // Initialize SignalR Hub connection and subscriptions
  useEffect(() => {
    let mounted = true;

    async function initSignalR() {
      await loadData();
      const connected = await signalrService.startConnection();
      if (!mounted) return;

      setConnectionStatus(signalrService.getStatus());

      if (connected && activeConvId) {
        await signalrService.joinConversation(activeConvId);
      }
    }

    initSignalR();

    // Event listeners
    const unsubStatus = signalrService.onConnectionStatusChange((status) => {
      if (mounted) setConnectionStatus(status);
    });

    const unsubMsg = signalrService.onMessageReceived((newMsg: ChatMessageDto) => {
      if (!mounted) return;

      // Update message list if relevant to active conversation
      setMessages((prev) => {
        // Prevent duplicate appending if caller already added
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const isFromMe = newMsg.senderProfileId === currentProfileId || newMsg.senderName === currentUserName;
        return [...prev, { ...newMsg, isMe: isFromMe }];
      });

      // Update conversation list item last message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.conversationId === newMsg.conversationId) {
            return {
              ...c,
              lastMessageText: newMsg.messageText,
              lastMessageTime: newMsg.sentAt,
            };
          }
          return c;
        })
      );

      // Check if message is a contact request
      if (newMsg.isContactShareRequest && newMsg.senderProfileId !== currentProfileId) {
        setContactRequestPending(true);
      }
      if (newMsg.isContactShareAccepted) {
        setContactRequestPending(false);
        setUnlockedPhone("+94 77 123 4567");
      }
    });

    const unsubTyping = signalrService.onUserTyping((indicator: TypingIndicatorDto) => {
      if (!mounted) return;
      if (indicator.conversationId === activeConvId && indicator.userName !== currentUserName) {
        if (indicator.isTyping) {
          setPartnerTyping(indicator.userName);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            if (mounted) setPartnerTyping(null);
          }, 3500);
        } else {
          setPartnerTyping(null);
        }
      }
    });

    const unsubRead = signalrService.onMessageRead((_convId, messageId) => {
      if (!mounted) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
      );
    });

    const unsubContactReq = signalrService.onContactShareRequested((_convId, requesterId) => {
      if (!mounted) return;
      if (requesterId !== currentProfileId) {
        setContactRequestPending(true);
      }
    });

    const unsubContactUnlocked = signalrService.onContactUnlocked((payload: ContactUnlockedDto) => {
      if (!mounted) return;
      setContactRequestPending(false);
      setUnlockedPhone(payload.phoneNumber || "+94 77 123 4567");
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === payload.conversationId
            ? { ...c, isContactShared: true, partnerPhoneNumber: payload.phoneNumber }
            : c
        )
      );
    });

    return () => {
      mounted = false;
      unsubStatus();
      unsubMsg();
      unsubTyping();
      unsubRead();
      unsubContactReq();
      unsubContactUnlocked();
      signalrService.leaveConversation(activeConvId);
    };
  }, [loadData, activeConvId, currentProfileId]);

  // Whenever active conversation changes, load its history & join its group
  useEffect(() => {
    if (activeConvId) {
      loadActiveHistory(activeConvId);
      signalrService.joinConversation(activeConvId);
      setPartnerTyping(null);
    }
  }, [activeConvId, loadActiveHistory]);

  // Handle typing input debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (activeConvId) {
      if (!sendTypingDebounceRef.current) {
        signalrService.sendTyping(activeConvId, currentUserName, true);
      } else {
        clearTimeout(sendTypingDebounceRef.current);
      }

      sendTypingDebounceRef.current = setTimeout(() => {
        signalrService.sendTyping(activeConvId, currentUserName, false);
        sendTypingDebounceRef.current = null;
      }, 2000);
    }
  };

  // Send message handler
  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    const textToSend = customText ?? inputText;
    if (!textToSend.trim() || !activeConv) return;

    if (!customText) setInputText("");

    // Notify typing stopped
    signalrService.sendTyping(activeConv.conversationId, currentUserName, false);

    // Flow 3 Anti-Scam client check preview for instantaneous feedback
    const scamRegex = /\b(money|transfer|bank\s*account|cash|rupees|rs\.?|lkr|emergency\s*fund|crypto|usdt|bitcoin)\b/i;
    const isScamMatch = scamRegex.test(textToSend);

    const tempId = "temp_" + Date.now();
    const optimisticMsg: ChatMessageDto = {
      id: tempId,
      senderProfileId: currentProfileId,
      senderName: currentUserName,
      senderPhotoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop",
      receiverProfileId: activeConv.partnerProfileId,
      receiverName: activeConv.partnerName,
      conversationId: activeConv.conversationId,
      messageText: textToSend.trim(),
      sentAt: new Date().toISOString(),
      isRead: false,
      isMe: true,
      isFlaggedBySafety: isScamMatch,
      safetyFlagReason: isScamMatch
        ? "Safety Alert: Potential financial solicitation detected. Never transfer money or disclose banking details online."
        : null,
      isContactShareRequest: false,
      isContactShareAccepted: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // Send through SignalR WebSocket
    const sent = await signalrService.sendMessage(
      currentProfileId,
      activeConv.partnerProfileId,
      textToSend.trim(),
      activeConv.conversationId
    );

    // If SignalR was offline or failed, the optimistic message remains visible
    if (!sent) {
      console.log("Sent optimistically in offline mode");
    }
  };

  // Flow 3: Request mutual contact exchange
  const handleRequestContact = async () => {
    if (!activeConv) return;
    const sent = await signalrService.requestContactShare(
      activeConv.conversationId,
      currentProfileId,
      activeConv.partnerProfileId
    );

    // Optimistic insert
    const requestMsg: ChatMessageDto = {
      id: "req_" + Date.now(),
      senderProfileId: currentProfileId,
      senderName: currentUserName,
      senderPhotoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop",
      receiverProfileId: activeConv.partnerProfileId,
      receiverName: activeConv.partnerName,
      conversationId: activeConv.conversationId,
      messageText: "📱 I requested mutual contact exchange. Once accepted, verified phone numbers will unlock.",
      sentAt: new Date().toISOString(),
      isRead: true,
      isMe: true,
      isFlaggedBySafety: false,
      isContactShareRequest: true,
      isContactShareAccepted: false,
    };
    setMessages((prev) => [...prev, requestMsg]);
    if (!sent) {
      console.log("Contact share request sent optimistically");
    }
  };

  // Flow 3: Accept mutual contact exchange
  const handleAcceptContact = async () => {
    if (!activeConv) return;
    await signalrService.acceptContactShare(
      activeConv.conversationId,
      currentProfileId,
      activeConv.partnerProfileId
    );

    setContactRequestPending(false);
    setUnlockedPhone("+94 77 123 4567");

    const acceptMsg: ChatMessageDto = {
      id: "acc_" + Date.now(),
      senderProfileId: currentProfileId,
      senderName: currentUserName,
      senderPhotoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop",
      receiverProfileId: activeConv.partnerProfileId,
      receiverName: activeConv.partnerName,
      conversationId: activeConv.conversationId,
      messageText: "🎉 Mutual contact details unlocked! Both parties can now speak directly on WhatsApp or phone.",
      sentAt: new Date().toISOString(),
      isRead: true,
      isMe: true,
      isFlaggedBySafety: false,
      isContactShareRequest: false,
      isContactShareAccepted: true,
    };
    setMessages((prev) => [...prev, acceptMsg]);
  };

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    setMobileChatOpen(true);
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const isBlocked = !!blocked[c.conversationId];
      if (filter === "blocked" ? !isBlocked : isBlocked) return false;
      if (filter === "unread" && c.unreadCount === 0) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.partnerName.toLowerCase().includes(q) ||
        c.lastMessageText.toLowerCase().includes(q)
      );
    });
  }, [conversations, filter, search, blocked]);

  const unreadTotal = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (blocked[c.conversationId] ? 0 : c.unreadCount || 0), 0);
  }, [conversations, blocked]);
  const unreadChats = useMemo(
    () => conversations.filter((c) => !blocked[c.conversationId] && c.unreadCount > 0).length,
    [conversations, blocked]
  );
  const blockedCount = useMemo(
    () => conversations.filter((c) => blocked[c.conversationId]).length,
    [conversations, blocked]
  );
  const activeBlocked = activeConv ? blocked[activeConv.conversationId] : undefined;
  // Bring the Blocked Notice into view when a chat is blocked
  useEffect(() => {
    if (activeBlocked) window.setTimeout(scrollToBottom, 60);
  }, [activeBlocked, scrollToBottom]);
  const blockTarget = conversations.find((c) => c.conversationId === blockTargetId);

  const todayLabel = () =>
    new Date().toLocaleDateString(lang === "si" ? "si-LK" : "en-GB", { day: "numeric", month: "short" });

  const confirmBlock = (opts: { reason: string; report: boolean }) => {
    const target = blockTarget;
    setBlockTargetId(null);
    if (!target) return;
    setBlocked((b) => ({ ...b, [target.conversationId]: { date: todayLabel(), reason: opts.reason } }));
    setActiveConvId(target.conversationId);
    toast.success(t.messages.blockedToast(target.partnerName), opts.report ? t.messages.reportedToast : undefined);
  };

  const unblock = (id: string) => {
    const conv = conversations.find((c) => c.conversationId === id);
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

  const reportMember = () => toast.info(t.messages.reportedToast);

  const toggleMute = (id: string) => {
    const next = !muted[id];
    setMuted((m) => ({ ...m, [id]: next }));
    toast.info(next ? t.messages.mutedToast : t.messages.unmutedToast);
  };

  return (
    <div className="min-h-screen bg-page-gradient">
      <Navbar variant="member" />

      <main className="container-page pb-20 pt-6 lg:pt-8">
        {/* Page header */}
        <div className="mb-6">
          {/* Figma: Page header — Back Button left of the title */}
          <div className="enter grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-4 gap-y-1">
            <nav aria-label="Breadcrumb" className="col-start-2 flex items-center gap-2 text-body-sm text-ink-tertiary">
              <Link href="/dashboard" className="transition-colors hover:text-brand">
                {t.nav.dashboard}
              </Link>
              <span>/</span>
              <span className="font-semibold text-brand-text">{t.nav.messages}</span>
            </nav>
            <BackButton label={t.messages.back} />
            <h1 className="text-h3 text-ink md:text-h2">
              {t.messages.title}
            </h1>
            <p className="col-start-2 text-body-md text-ink-secondary">
              {t.messages.subtitle}
            </p>
          </div>

        </div>

        {/* Chat Split Window */}
        {/* mobile: fills the screen between the top bar and the floating tab bar */}
        <div className="flex h-[calc(100dvh-200px)] min-h-[460px] overflow-hidden rounded-xl border border-line bg-surface-card shadow-sm lg:h-[720px]">
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

              {/* Filter Pills — Figma: Filter Chip / Size = Wide (16px sides) */}
              <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
                <FilterChip selected={filter === "all"} onClick={() => setFilter("all")}>
                  {t.messages.all}
                </FilterChip>
                <FilterChip selected={filter === "unread"} count={unreadChats} onClick={() => setFilter("unread")}>
                  {t.messages.unread}
                </FilterChip>
                <FilterChip
                  selected={filter === "blocked"}
                  count={blockedCount}
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
                      const info = blocked[c.conversationId];
                      return (
                        <BlockedRow
                          key={c.conversationId}
                          index={i}
                          name={c.partnerName}
                          photo={c.partnerPhotoUrl}
                          meta={[t.messages.blockedOn(info?.date ?? ""), info?.reason].filter(Boolean).join(" · ")}
                          selected={activeConv?.conversationId === c.conversationId}
                          leaving={leavingId === c.conversationId}
                          onSelect={() => handleSelectConv(c.conversationId)}
                          onUnblock={() => unblock(c.conversationId)}
                        />
                      );
                    })
                  )}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-12 text-center text-body-sm text-ink-tertiary">
                  No accepted match conversations found.
                </div>
              ) : (
                filteredConversations.map((c, i) => {
                  const isSelected = activeConv?.conversationId === c.conversationId;
                  return (
                    <button
                      key={c.conversationId}
                      type="button"
                      onClick={() => handleSelectConv(c.conversationId)}
                      style={{ animation: `fade-up 450ms cubic-bezier(0.22,1,0.36,1) ${i * 60}ms backwards` }}
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
                          src={c.partnerPhotoUrl}
                          alt={c.partnerName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        {c.partnerOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-card bg-success-fg" />
                        )}
                      </div>

                      {/* Snippet */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 truncate text-label-md text-ink">
                            {c.partnerName}
                            {c.partnerVerified && (
                              <Verify size={14} color="currentColor" variant="Bold" className="text-icon-brand" />
                            )}
                          </span>
                          <span className="text-caption text-ink-tertiary">
                            {new Date(c.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "truncate text-body-sm",
                            c.unreadCount > 0 ? "font-semibold text-ink" : "text-ink-secondary"
                          )}
                        >
                          {c.lastMessageText}
                        </p>
                      </div>

                      {/* Unread Pill */}
                      {c.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-label-sm text-ink-on-brand shrink-0">
                          {c.unreadCount}
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
                "flex min-w-0 flex-1 flex-col bg-surface-card",
                !mobileChatOpen ? "hidden lg:flex" : "flex"
              )}
            >
              {/* Chat Header */}
              <div className="flex h-[68px] items-center justify-between gap-2 border-b border-line px-2 sm:h-[76px] sm:px-6">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileChatOpen(false)}
                    aria-label="Back to conversations"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-tertiary hover:bg-surface-subtle lg:hidden"
                  >
                    <ArrowLeft size={20} color="currentColor" />
                  </button>

                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeConv.partnerPhotoUrl}
                      alt={activeConv.partnerName}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    {activeConv.partnerOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-card bg-success-fg" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="flex items-center gap-1.5 text-label-lg text-ink">
                      <span className="truncate">{activeConv.partnerName}</span>
                      <Verify size={16} color="currentColor" variant="Bold" className="shrink-0 text-icon-brand" />
                    </h2>
                    {activeBlocked ? (
                      <p className="animate-fade-in truncate text-caption text-error-fg">{t.messages.blockedStatus}</p>
                    ) : (
                      <p className="truncate text-caption text-ink-tertiary">
                        {activeConv.partnerProfession || "Verified Candidate"} • Active Now
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                  {activeBlocked ? (
                    <Button variant="outline" size="sm" className="animate-pop-in rounded-full" onClick={() => unblock(activeConv.conversationId)}>
                      {t.messages.unblock}
                    </Button>
                  ) : (
                  <>
                  {/* Flow 3 Mutual Contact Unlock Action */}
                  {unlockedPhone || activeConv.isContactShared ? (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-caption font-medium">
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{unlockedPhone || activeConv.partnerPhoneNumber || "+94 77 123 4567"}</span>
                      <a
                        href={`https://wa.me/${(unlockedPhone || activeConv.partnerPhoneNumber || "94771234567").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 px-2 py-0.5 rounded bg-emerald-600 text-white text-caption font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        WhatsApp
                      </a>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestContact}
                      className="hidden md:inline-flex text-caption items-center gap-1.5 border-brand/30 text-brand hover:bg-brand/5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Request Contact Exchange</span>
                    </Button>
                  )}

                  <Link href="/requests" className="hidden md:block">
                    <Button variant="outline" size="sm">
                      {t.messages.viewProfile}
                    </Button>
                  </Link>
                  </>
                  )}

                  {/* Figma: Action Menu (⋯) — Mute, Block, Report */}
                  <ChatActionMenu
                    muted={!!muted[activeConv.conversationId]}
                    onToggleMute={() => toggleMute(activeConv.conversationId)}
                    onBlock={() => (activeBlocked ? undefined : setBlockTargetId(activeConv.conversationId))}
                    onReport={reportMember}
                    compactItems={
                      activeBlocked
                        ? []
                        : [
                            { key: "profile", label: t.messages.viewProfile, onClick: () => router.push("/requests") },
                            unlockedPhone || activeConv.isContactShared
                              ? { key: "whatsapp", label: `WhatsApp ${unlockedPhone || activeConv.partnerPhoneNumber || ""}`.trim(), onClick: () => window.open(`https://wa.me/${(unlockedPhone || activeConv.partnerPhoneNumber || "94771234567").replace(/\D/g, "")}`, "_blank") }
                              : { key: "contact", label: "Request contact exchange", onClick: handleRequestContact },
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
                          "flex h-9 w-9 items-center justify-center rounded-full text-ink-tertiary transition-all hover:bg-surface-subtle",
                          open && "bg-brand-subtle text-brand rotate-90"
                        )}
                      >
                        <More size={20} color="currentColor" />
                      </button>
                    )}
                  />
                </div>
              </div>

              {/* Messages Thread */}
              <div className={cn("relative flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 sm:p-6 transition-colors duration-300", activeBlocked && "bg-surface-subtle")}>
                <div className={cn("space-y-4 transition-opacity duration-500", activeBlocked && "pointer-events-none select-none opacity-40 grayscale")}>
                {/* Figma: Safety note */}
                <p className="mx-auto flex w-fit max-w-full items-center gap-2 rounded-[12px] bg-info-bg px-3.5 py-2 text-body-xs font-semibold text-info-fg">
                  <ShieldTick size={16} color="currentColor" className="shrink-0" /> {t.messages.safetyNote}
                </p>

                {/* Contact Request Pending Banner if partner requested contact */}
                {contactRequestPending && (
                  <div className="mx-auto flex max-w-xl items-center justify-between rounded-xl border border-brand/30 bg-brand-subtle p-3.5 text-body-sm shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-full bg-brand/10 text-brand">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-ink block">Contact Exchange Requested</span>
                        <span className="text-ink-secondary text-caption">
                          {activeConv.partnerName} requested to unlock direct WhatsApp and phone numbers.
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="primary" onClick={handleAcceptContact}>
                      Accept & Share
                    </Button>
                  </div>
                )}

                {/* Day Divider */}
                <div className="flex items-center justify-center">
                  <span className="rounded-full bg-surface-subtle px-3 py-1 text-caption text-ink-tertiary">
                    {lang === "si" ? "අද" : "Today"}
                  </span>
                </div>

                {/* Message Bubbles */}
                {messages.map((m) => {
                  const isMe = m.isMe;
                  const timeFormatted = m.sentAt
                    ? new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Now";

                  return (
                    <div
                      key={m.id}
                      className={cn("flex flex-col group", isMe ? "items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] break-words p-3.5 text-body-md transition-all shadow-xs relative sm:max-w-[500px]",
                          m.isFlaggedBySafety
                            ? "rounded-2xl border-2 border-amber-400 bg-amber-50/90 text-amber-950"
                            : isMe
                            ? "rounded-2xl rounded-tr-xs bg-brand-gradient text-ink-on-brand"
                            : "rounded-2xl rounded-tl-xs border border-line bg-surface-subtle text-ink"
                        )}
                      >
                        {/* Anti-Scam Alert Banner */}
                        {m.isFlaggedBySafety && (
                          <div className="mb-2 flex items-center gap-1.5 text-caption font-bold text-amber-800 bg-amber-200/70 px-2 py-1 rounded">
                            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>{m.safetyFlagReason || "Safety Warning: Potential risk detected."}</span>
                          </div>
                        )}

                        <p className={cn(m.isFlaggedBySafety && "opacity-90 italic")}>{m.messageText}</p>
                      </div>

                      <div className="mt-1 flex items-center gap-1 px-1 text-caption text-ink-tertiary">
                        <span>{timeFormatted}</span>
                        {isMe && (
                          <span>
                            {m.isRead ? (
                              <CheckCheck className="inline w-3.5 h-3.5 text-brand ml-0.5" />
                            ) : (
                              <Check className="inline w-3.5 h-3.5 text-ink-tertiary ml-0.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator Bubble */}
                {partnerTyping && (
                  <div className="flex items-center gap-2 text-ink-tertiary text-caption bg-surface-subtle px-3 py-1.5 rounded-full w-fit animate-pulse">
                    <MessageSquare className="w-3.5 h-3.5 text-brand" />
                    <span>{partnerTyping} is typing...</span>
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </span>
                  </div>
                )}

                </div>

                {activeBlocked && (
                  <BlockedNotice
                    name={activeConv.partnerName}
                    onReport={reportMember}
                    onUnblock={() => unblock(activeConv.conversationId)}
                  />
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Composer — read-only when blocked */}
              {activeBlocked ? (
                <BlockedComposer />
              ) : (
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line p-2.5 sm:gap-3 sm:p-4">
                <button
                  type="button"
                  aria-label="Attach document or photo"
                  className="flex h-10 w-10 shrink-0 sm:h-11 sm:w-11 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-surface-subtle hover:text-brand"
                >
                  <AttachCircle size={24} color="currentColor" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={t.messages.typeMessage}
                  className="h-11 flex-1 min-w-0 rounded-md border border-line bg-surface-subtle px-4 text-body-md text-ink placeholder:text-ink-disabled outline-none transition-colors focus:border-brand-focus"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputText.trim()}
                  aria-label={t.messages.send}
                  className="shrink-0 max-sm:h-11 max-sm:w-11 max-sm:rounded-full max-sm:px-0"
                  rightIcon={<Send2 size={18} color="currentColor" />}
                >
                  <span className="hidden sm:inline">{t.messages.send}</span>
                </Button>
              </form>
              )}
            </section>
          ) : (
            <div className="flex flex-1 items-center justify-center text-body-md text-ink-tertiary">
              {lang === "si" ? "කතාබස් කිරීමට සංවාදයක් තෝරන්න" : "Select a conversation to start chatting"}
            </div>
          )}
        </div>
      </main>

      <BlockConfirmDialog
        open={!!blockTarget}
        name={blockTarget?.partnerName ?? ""}
        onCancel={() => setBlockTargetId(null)}
        onConfirm={confirmBlock}
      />

      <Footer />
    </div>
  );
}
