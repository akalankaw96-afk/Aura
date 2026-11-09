/**
 * Offline / demo data for the Messages page. Used only when the chat API
 * returns nothing (backend not running), so the Figma flows — including
 * blocked members — can be reviewed without the server.
 */
import type { ChatMessageDto, ConversationDto } from "@/services/signalrService";
import { CONVERSATIONS, type Conversation } from "./dashboard";

export interface BlockInfo {
  date: string;
  reason: string;
}

const EXTRA: Conversation[] = [
  {
    id: "dinesh", name: "Dinesh", fullName: "Dinesh Perera", age: 32, location: "Negombo, Sri Lanka", photo: "/brand/groom.png", time: "2 Nov", unread: 0,
    messages: [
      { id: "1", from: "them", text: "Hi Nethmi! Thank you so much for accepting my interest 😊", time: "10:12" },
      { id: "2", from: "me", text: "Hi Kavindu, happy to connect. My parents liked your profile too.", time: "10:15", seen: true },
      { id: "3", from: "them", text: "Can you send me some money for an urgent visa fee? I'll repay soon.", time: "10:31" },
    ],
  },
  {
    id: "chamath", name: "Chamath", fullName: "Chamath Silva", age: 29, location: "Matara, Sri Lanka", photo: "/brand/groom.png", time: "28 Oct", unread: 0,
    messages: [{ id: "1", from: "them", text: "Why won't you reply?? Answer me now.", time: "28 Oct" }],
  },
];

const ALL = [...CONVERSATIONS, ...EXTRA];

/** Members already blocked in the demo (Figma: Messages — Blocked list). */
export const DEMO_BLOCKED: Record<string, BlockInfo> = {
  dinesh: { date: "2 Nov", reason: "Asked for money or bank details" },
  chamath: { date: "28 Oct", reason: "Rude or inappropriate messages" },
};

const toIso = (time: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  const d = new Date();
  if (m) d.setHours(+m[1], +m[2], 0, 0);
  else d.setDate(d.getDate() - 2);
  return d.toISOString();
};

export const DEMO_CONVERSATIONS: ConversationDto[] = ALL.map((c) => ({
  conversationId: `demo-${c.id}`,
  partnerProfileId: c.id,
  partnerName: c.name,
  partnerPhotoUrl: c.photo,
  partnerProfession: `${c.age} · ${c.location}`,
  partnerVerified: true,
  partnerOnline: !!c.online,
  lastMessageText: c.messages[c.messages.length - 1]?.text ?? "",
  lastMessageTime: toIso(c.time),
  unreadCount: c.unread,
  isContactShared: false,
}));

export const DEMO_BLOCKED_CONV: Record<string, BlockInfo> = Object.fromEntries(
  Object.entries(DEMO_BLOCKED).map(([id, v]) => [`demo-${id}`, v])
);

export function demoHistory(conversationId: string): ChatMessageDto[] {
  const c = ALL.find((x) => `demo-${x.id}` === conversationId);
  if (!c) return [];
  return c.messages.map((m) => ({
    id: `${conversationId}-${m.id}`,
    senderProfileId: m.from === "me" ? "me" : c.id,
    senderName: m.from === "me" ? "Nethmi" : c.name,
    senderPhotoUrl: m.from === "me" ? "" : c.photo,
    receiverProfileId: m.from === "me" ? c.id : "me",
    receiverName: m.from === "me" ? c.name : "Nethmi",
    conversationId,
    messageText: m.text,
    sentAt: toIso(m.time),
    isRead: !!m.seen,
    isMe: m.from === "me",
    isFlaggedBySafety: false,
    safetyFlagReason: null,
    isContactShareRequest: false,
    isContactShareAccepted: false,
  }));
}
