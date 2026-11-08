/**
 * Member Dashboard copy + MOCK data (no API yet).
 * Figma: 📊 Member Dashboard → "Dashboard — Desktop 1440".
 * Replace these with API responses when the backend is ready.
 */

export const MEMBER_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Matches", href: "/dashboard#matches" },
  { label: "Requests", href: "/dashboard#requests" },
  { label: "Messages", href: "/dashboard#messages" },
  { label: "Plans", href: "/plans" },
] as const;

export const MEMBER = {
  firstName: "Nethmi",
  fullName: "Nethmi Perera",
  id: "MP-24790",
  photo: "/images/profiles/mp-24790.jpg",
  strength: 80,
  todos: [
    { done: true, label: "Photos verified" },
    { done: false, label: "Add 2 more photos" },
    { done: false, label: "Add your horoscope" },
  ],
};

export const DASH_HERO = {
  eyebrow: "Welcome back",
  /** {name} is replaced with the member's first name; greeting follows the time of day */
  subtitle: "8 new matches and 3 interest requests are waiting for you today.",
  primary: { label: "See new matches", href: "#matches" },
  secondary: { label: "Complete profile", href: "/register" },
};

export const SEARCH_CARD = {
  title: "Find your match",
  subtitle: "Search 12,000+ verified profiles from Sri Lanka and abroad",
  advanced: "Advanced search",
  quickTitle: "Quick filters",
  quick: ["New this week", "Verified only", "With horoscope", "Near Colombo", "Living abroad"],
};

export type StatIcon = "eye" | "heart" | "star" | "message";
export const STATS: { icon: StatIcon; value: string; label: string; meta: string; delta: string; tone: "success" | "brand" }[] = [
  { icon: "eye", value: "128", label: "Profile views", meta: "Last 7 days", delta: "+12%", tone: "success" },
  { icon: "heart", value: "24", label: "Interests received", meta: "6 new this week", delta: "+6", tone: "success" },
  { icon: "star", value: "9", label: "Shortlisted you", meta: "2 new this week", delta: "+2", tone: "success" },
  { icon: "message", value: "5", label: "Unread messages", meta: "From 3 members", delta: "New", tone: "brand" },
];

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
}
export const REQUESTS: InterestRequest[] = [
  { id: "MP-24817", name: "Kavindu", age: 28, meta: "Kandy · Buddhist · Doctor", time: "2h ago", photo: "/images/profiles/mp-24817.jpg" },
  { id: "MP-24751", name: "Rizwan", age: 30, meta: "Colombo · Muslim · Accountant", time: "5h ago", photo: "/images/profiles/mp-24751.jpg" },
  { id: "MP-24671", name: "Pradeep", age: 34, meta: "Galle · Buddhist · Engineer", time: "Yesterday", photo: "/images/profiles/mp-24671.jpg" },
];

export interface InboxMessage {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  online?: boolean;
  photo: string;
}
export const MESSAGES: InboxMessage[] = [
  { id: "m1", name: "Kavindu", preview: "Thank you for accepting! My parents would like to speak with yours this weekend.", time: "10:24", unread: 2, online: true, photo: "/images/profiles/mp-24817.jpg" },
  { id: "m2", name: "Rizwan", preview: "Hi Nethmi, I saw that you also studied in Kandy — which school?", time: "09:02", unread: 1, photo: "/images/profiles/mp-24751.jpg" },
  { id: "m3", name: "Pradeep", preview: "Shall we arrange a family call this Sunday?", time: "Mon", unread: 2, photo: "/images/profiles/mp-24671.jpg" },
];
