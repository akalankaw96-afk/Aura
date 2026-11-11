/**
 * Member Dashboard copy + MOCK data (no API yet).
 * Figma: 📊 Member Dashboard → "Dashboard — Desktop 1440".
 * Replace these with API responses when the backend is ready.
 */

export const MEMBER_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Matches", href: "/dashboard#matches" },
  { label: "Friends", href: "/friends" },
  { label: "Messages", href: "/messages" },
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
  primary: { label: "See new matches", href: "/search?for=groom" },
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
  photoHidden?: boolean;
  location: string;
  country: RequestProfile["country"];
}
/** Pending requests on the dashboard. Photos stay hidden until you accept. */
export const REQUESTS: InterestRequest[] = [
  { id: "MP-24855", name: "Nuwan", age: 30, meta: "Matara · Buddhist · Banker", time: "2h ago", photo: "/brand/groom.png", photoHidden: true, location: "Matara, Sri Lanka", country: "lk" },
  { id: "MP-24861", name: "Dinesh", age: 32, meta: "Melbourne · Buddhist · Software Engineer", time: "5h ago", photo: "/brand/groom.png", photoHidden: true, location: "Melbourne, Australia", country: "au" },
  { id: "MP-24872", name: "Chamath", age: 29, meta: "Toronto · Catholic · Nurse", time: "Yesterday", photo: "/brand/groom.png", photoHidden: true, location: "Toronto, Canada", country: "ca" },
];

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
export const MESSAGES: InboxMessage[] = [
  { id: "kavindu", name: "Kavindu", preview: "Thank you for accepting! My parents would like to speak with yours this weekend.", time: "10:24", unread: 2, online: true, photo: "/images/profiles/mp-24817.jpg" },
  { id: "rizwan", name: "Rizwan", preview: "Hi Nethmi, I saw that you also studied in Kandy — which school?", time: "09:02", unread: 1, photo: "/images/profiles/mp-24751.jpg" },
  { id: "pradeep", name: "Pradeep", preview: "Shall we arrange a family call this Sunday?", time: "Mon", unread: 2, photo: "/images/profiles/mp-24671.jpg" },
  { id: "sahan", name: "Sahan", preview: "You: That sounds lovely, thank you!", time: "Sat", unread: 0, online: true, photo: "/brand/groom.png", photoHidden: true },
  { id: "kasun", name: "Kasun", preview: "New friend · Say hello 👋", time: "Now", unread: 0, photo: "/brand/groom.png", photoHidden: true, isNew: true },
];

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

const details = (age: number, height: string, religion: string, ethnicity: string, profession: string, education: string, living: string) =>
  [
    { icon: "calendar", label: "Age", value: `${age} years` },
    { icon: "ruler", label: "Height", value: height },
    { icon: "book", label: "Religion", value: religion },
    { icon: "people", label: "Ethnicity", value: ethnicity },
    { icon: "briefcase", label: "Profession", value: profession },
    { icon: "teacher", label: "Education", value: education },
    { icon: "heart", label: "Civil status", value: "Never married" },
    { icon: "location", label: "Living in", value: living },
  ] as RequestProfile["details"];

export const REQUEST_TABS: { id: ConnectionTab; label: string }[] = [
  { id: "friends", label: "Friends" },
  { id: "favourites", label: "Favourites" },
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" },
];

export const REQUEST_PROFILES: RequestProfile[] = [
  ...REQUESTS.map((request): RequestProfile => {
    const [, religion, profession] = request.meta.split(" · ");
    return {
      ...request,
      tab: "received",
      fullName: request.name,
      isNew: true,
      note: "",
      about: "",
      details: [
        { icon: "calendar", label: "Age", value: `${request.age} years` },
        { icon: "book", label: "Religion", value: religion },
        { icon: "briefcase", label: "Profession", value: profession },
        { icon: "location", label: "Living in", value: request.location },
      ],
    };
  }),
  {
    id: "MP-24817", tab: "received", name: "Kavindu", fullName: "Kavindu Jayasinghe", age: 28, meta: "Kandy · Buddhist · Doctor", time: "2h ago", isNew: true,
    photo: "/images/profiles/mp-24817.jpg", location: "Kandy, Sri Lanka", country: "lk", horoscope: true,
    note: "Hi Nethmi, our families are both from Kandy and I think we share a lot of values. My parents would love to connect with yours.",
    about: "I’m a doctor at Kandy General Hospital. I enjoy hiking, cricket and spending time with my family. Looking for a kind, educated partner who values family and faith.",
    details: details(28, "5′ 8″", "Buddhist", "Sinhalese", "Doctor (MBBS)", "University of Peradeniya", "Kandy, Sri Lanka"),
  },
  {
    id: "MP-24751", tab: "received", name: "Rizwan", fullName: "Rizwan Mohamed", age: 30, meta: "Colombo · Muslim · Accountant", time: "5h ago", isNew: true,
    photo: "/images/profiles/mp-24751.jpg", location: "Colombo, Sri Lanka", country: "lk",
    note: "Assalamu alaikum Nethmi. I liked how you described your family. Would you be open to talking?",
    about: "Chartered accountant working in Colombo. I love reading, travelling and cooking for my family on weekends.",
    details: details(30, "5′ 10″", "Islam", "Muslim", "Chartered Accountant", "CA Sri Lanka", "Colombo, Sri Lanka"),
  },
  {
    id: "MP-24671", tab: "received", name: "Pradeep", fullName: "Pradeep Fernando", age: 34, meta: "Galle · Buddhist · Engineer", time: "Yesterday", isNew: true,
    photo: "/images/profiles/mp-24671.jpg", location: "Galle, Sri Lanka", country: "lk", horoscope: true,
    note: "Hello! I’m a civil engineer from Galle. Your profile felt very genuine — I’d be happy to share horoscopes.",
    about: "Civil engineer who loves the sea, music and gardening. Close to my parents and two sisters.",
    details: details(34, "5′ 9″", "Buddhist", "Sinhalese", "Civil Engineer", "University of Moratuwa", "Galle, Sri Lanka"),
  },
  {
    id: "MP-24702", tab: "received", name: "Sahan", fullName: "Sahan Wickramasinghe", age: 31, meta: "Kurunegala · Buddhist · Teacher", time: "2 days ago",
    photo: "/brand/groom.png", photoHidden: true, location: "Kurunegala, Sri Lanka", country: "lk",
    note: "Hi Nethmi, I’m a teacher in Kurunegala. I’d love to know more about you.",
    about: "Science teacher who enjoys cricket, reading and temple activities with my family.",
    details: details(31, "5′ 7″", "Buddhist", "Sinhalese", "Teacher", "University of Kelaniya", "Kurunegala, Sri Lanka"),
  },
  {
    id: "MP-24688", tab: "sent", name: "Dinesh", fullName: "Dinesh Perera", age: 32, meta: "Melbourne · Buddhist · Software Engineer", time: "3 days ago",
    photo: "/brand/groom.png", photoHidden: true, location: "Melbourne, Australia", country: "au",
    note: "You sent an interest. Waiting for Dinesh to reply.",
    about: "Software engineer in Melbourne, planning to settle in Sri Lanka in a few years. Loves hiking and photography.",
    details: details(32, "5′ 9″", "Buddhist", "Sinhalese", "Software Engineer", "Monash University", "Melbourne, Australia"),
  },
  {
    id: "MP-24733", tab: "sent", name: "Chamath", fullName: "Chamath Silva", age: 29, meta: "Toronto · Catholic · Nurse", time: "1 week ago",
    photo: "/brand/groom.png", photoHidden: true, location: "Toronto, Canada", country: "ca",
    note: "You sent an interest. Waiting for Chamath to reply.",
    about: "Registered nurse in Toronto. Family-oriented, loves cooking Sri Lankan food and football.",
    details: details(29, "5′ 8″", "Catholic", "Sinhalese", "Registered Nurse", "Humber College", "Toronto, Canada"),
  },
  {
    id: "MP-24790", tab: "accepted", name: "Kasun", fullName: "Kasun Bandara", age: 31, meta: "Doha · Buddhist · Civil Engineer", time: "Last week",
    photo: "/brand/groom.png", photoHidden: true, location: "Doha, Qatar", country: "qa", horoscope: true,
    note: "You accepted each other’s interest. Photos and contacts are unlocked.",
    about: "Civil engineer in Doha. Enjoys badminton, travel and visiting home every December.",
    details: details(31, "5′ 10″", "Buddhist", "Sinhalese", "Civil Engineer", "University of Moratuwa", "Doha, Qatar"),
  },
];

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

export const CONVERSATIONS: Conversation[] = [
  {
    id: "kavindu", name: "Kavindu", fullName: "Kavindu Jayasinghe", age: 28, location: "Kandy, Sri Lanka", photo: "/images/profiles/mp-24817.jpg", online: true, time: "10:24", unread: 2,
    messages: [
      { id: "1", from: "them", text: "Hi Nethmi! Thank you so much for accepting my interest 😊", time: "10:12" },
      { id: "2", from: "me", text: "Hi Kavindu, happy to connect. My parents liked your profile too.", time: "10:15", seen: true },
      { id: "3", from: "them", text: "That’s wonderful. My parents would like to speak with yours this weekend — would Saturday evening work?", time: "10:22" },
      { id: "4", from: "them", text: "Thank you for accepting! We can share horoscopes before the call.", time: "10:24" },
    ],
  },
  {
    id: "rizwan", name: "Rizwan", fullName: "Rizwan Mohamed", age: 30, location: "Colombo, Sri Lanka", photo: "/images/profiles/mp-24751.jpg", lastSeen: "Last seen 1h ago", time: "09:02", unread: 1,
    messages: [
      { id: "1", from: "me", text: "Hi Rizwan, thank you for your interest.", time: "Yesterday", seen: true },
      { id: "2", from: "them", text: "Hi Nethmi, I saw that you also studied in Kandy — which school?", time: "09:02" },
    ],
  },
  {
    id: "pradeep", name: "Pradeep", fullName: "Pradeep Fernando", age: 34, location: "Galle, Sri Lanka", photo: "/images/profiles/mp-24671.jpg", lastSeen: "Last seen yesterday", time: "Mon", unread: 2,
    messages: [
      { id: "1", from: "them", text: "Hello Nethmi, nice to meet you here.", time: "Mon" },
      { id: "2", from: "them", text: "Shall we arrange a family call this Sunday?", time: "Mon" },
    ],
  },
  {
    id: "sahan", name: "Sahan", fullName: "Sahan Wickramasinghe", age: 31, location: "Kurunegala, Sri Lanka", photo: "/brand/groom.png", photoHidden: true, online: true, time: "Sat", unread: 0,
    messages: [
      { id: "1", from: "them", text: "My mother would love to visit your family next month.", time: "Sat" },
      { id: "2", from: "me", text: "That sounds lovely, thank you!", time: "Sat", seen: true },
    ],
  },
];

/** Auto-replies for the demo chat (no API) */
export const DEMO_REPLIES = [
  "That sounds great! 😊",
  "Thank you for letting me know. I’ll tell my parents.",
  "Sure — what time suits your family?",
  "I’d like that very much.",
];

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
export const FRIENDS: Friend[] = [
  { id: "kasun", name: "Kasun", fullName: "Kasun Bandara", age: 31, location: "Doha, Qatar", photo: "/brand/groom.png", photoHidden: true, isNew: true, lastSeen: "Connected just now" },
  { id: "kavindu", name: "Kavindu", fullName: "Kavindu Jayasinghe", age: 28, location: "Kandy, Sri Lanka", photo: "/images/profiles/mp-24817.jpg", online: true },
  { id: "sahan", name: "Sahan", fullName: "Sahan Wickramasinghe", age: 31, location: "Kurunegala, Sri Lanka", photo: "/brand/groom.png", photoHidden: true, online: true },
  { id: "rizwan", name: "Rizwan", fullName: "Rizwan Mohamed", age: 30, location: "Colombo, Sri Lanka", photo: "/images/profiles/mp-24751.jpg", lastSeen: "Last seen 1h ago" },
  { id: "pradeep", name: "Pradeep", fullName: "Pradeep Fernando", age: 34, location: "Galle, Sri Lanka", photo: "/images/profiles/mp-24671.jpg", lastSeen: "Last seen yesterday" },
];

export function friendProfileId(friend: Friend) {
  return REQUEST_PROFILES.find((profile) => profile.fullName === friend.fullName)?.id ?? friend.id;
}
