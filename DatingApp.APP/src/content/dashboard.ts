/**
 * Member Dashboard copy and the shapes of its data.
 * Figma: 📊 Member Dashboard → "Dashboard — Desktop 1440".
 * The lists below are empty until their APIs exist (Sprint 03): interests, inbox, friends, conversations, stats.
 * Nothing here is demo data — screens show their empty states.
 */

export const MEMBER_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Matches", href: "/dashboard#matches" },
  { label: "Friends", href: "/friends" },
  { label: "Messages", href: "/messages" },
  { label: "Plans", href: "/plans" },
] as const;

/** Profile-completion checklist on the dashboard hero (strength comes from GET /profiles/me later). */
export const MEMBER = {
  strength: 0,
  todos: [] as { done: boolean; label: string }[],
};

export const DASH_HERO = {
  eyebrow: "Welcome back",
  /** {name} is replaced with the member's first name; greeting follows the time of day */
  subtitle: "Find your partner among ID-verified members from Sri Lanka and abroad.",
  primary: { label: "See new matches", href: "/search?for=groom" },
  secondary: { label: "Complete profile", href: "/register" },
};

export const SEARCH_CARD = {
  title: "Find your match",
  subtitle: "Search verified profiles from Sri Lanka and abroad",
  advanced: "Advanced search",
  quickTitle: "Quick filters",
  quick: ["New this week", "Verified only", "With horoscope", "Near Colombo", "Living abroad"],
};

export type StatIcon = "eye" | "heart" | "star" | "message";
export const STATS: { icon: StatIcon; value: string; label: string; meta: string; delta: string; tone: "success" | "brand" }[] = [];

export const BEST_MATCHES = {
  eyebrow: "Best matches",
  title: "Your best matches today",
  description: "Based on your age, religion and location preferences — updated daily.",
};

export interface InterestRequest {
  id: string;
  name: string;
  age: number;
  meta: string;
  time: string;
  photo: string;
  photoHidden?: boolean;
  location: string;
  country: RequestProfile["country"];
}
/** Pending requests on the dashboard. Photos stay hidden until you accept. */
export const REQUESTS: InterestRequest[] = [];

export interface InboxMessage {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  online?: boolean;
  photo: string;
  photoHidden?: boolean;
  /** just connected — row gets the light-green "new friend" highlight */
  isNew?: boolean;
}
export const MESSAGES: InboxMessage[] = [];

/* ── Requests screen (Figma: Requests — Desktop 1440) ─────────────────── */
export type RequestTab = "received" | "sent" | "accepted";
export type ConnectionTab = "friends" | "favourites" | Exclude<RequestTab, "accepted">;

export interface RequestProfile {
  id: string;
  tab: RequestTab;
  name: string;
  fullName: string;
  age: number;
  meta: string;
  time: string;
  isNew?: boolean;
  photo: string;
  /** true → show the illustrated avatar: photos unlock after both accept */
  photoHidden?: boolean;
  location: string;
  country: "lk" | "au" | "ca" | "qa" | "gb";
  horoscope?: boolean;
  note: string;
  about: string;
  details: { icon: "calendar" | "ruler" | "book" | "people" | "briefcase" | "teacher" | "heart" | "location"; label: string; value: string }[];
}


export const REQUEST_TABS: { id: ConnectionTab; label: string }[] = [
  { id: "friends", label: "Friends" },
  { id: "favourites", label: "Favourites" },
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" },
];

export const REQUEST_PROFILES: RequestProfile[] = [];

/* ── Messages screen (Figma: Messages — Desktop 1440) ─────────────────── */
export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  seen?: boolean;
}
export interface Conversation {
  id: string;
  name: string;
  fullName: string;
  age: number;
  location: string;
  photo: string;
  photoHidden?: boolean;
  online?: boolean;
  lastSeen?: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
}

export const SAFETY_NOTE = "Keep chats on Vikasitha. Never share bank details or send money.";

export const CONVERSATIONS: Conversation[] = [];


/** Friends = members you're connected with (both accepted). Figma: Messages → Friends list */
export interface Friend {
  id: string;
  name: string;
  fullName: string;
  age: number;
  location: string;
  photo: string;
  photoHidden?: boolean;
  online?: boolean;
  lastSeen?: string;
  /** just accepted — shown first with a "New friend" badge */
  isNew?: boolean;
}
export const FRIENDS: Friend[] = [];

export function friendProfileId(friend: Friend) {
  return REQUEST_PROFILES.find((profile) => profile.fullName === friend.fullName)?.id ?? friend.id;
}
