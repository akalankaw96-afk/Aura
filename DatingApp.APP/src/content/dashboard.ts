/**
 * Member Dashboard copy + MOCK data (no API yet).
 * Figma: 📊 Member Dashboard → "Dashboard — Desktop 1440", "Requests — Desktop 1440", "Messages — Desktop 1440".
 * Replace these with API responses when the backend is ready.
 */

import type { CountryCode } from "@/components/ui/Flag";

export const MEMBER_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Matches", href: "/dashboard#matches" },
  { label: "Requests", href: "/requests" },
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
  { icon: "eye", value: "142", label: "Profile views", meta: "Last 7 days", delta: "+18%", tone: "success" },
  { icon: "heart", value: "24", label: "Interests received", meta: "4 new this week", delta: "+4", tone: "brand" },
  { icon: "star", value: "38", label: "Shortlisted you", meta: "2 new this week", delta: "+2", tone: "success" },
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
  height: string;
  location: string;
  country: CountryCode;
  religion: string;
  ethnicity: string;
  profession: string;
  education: string;
  civilStatus: string;
  livingIn: string;
  badges: string[];
  meta: string;
  time: string;
  photo: string;
  isNew?: boolean;
  tab: "received" | "sent" | "accepted";
  note: string;
  about: string;
}

export const REQUESTS: InterestRequest[] = [
  {
    id: "MP-24817",
    name: "Kavindu Shanaka",
    age: 28,
    height: "5' 9\" (175 cm)",
    location: "Kandy, Sri Lanka",
    country: "lk",
    religion: "Buddhist",
    ethnicity: "Sinhalese",
    profession: "Medical Doctor",
    education: "MBBS, Faculty of Medicine, University of Peradeniya",
    civilStatus: "Never married",
    livingIn: "Kandy, Sri Lanka",
    badges: ["Verified photo", "Horoscope matching"],
    meta: "28 · Kandy · Buddhist · Doctor",
    time: "2h ago",
    photo: "/images/profiles/mp-24817.jpg",
    isNew: true,
    tab: "received",
    note: "“Hi Nethmi, I came across your profile and was very impressed by your background. My family and I would love to connect and learn more about you.”",
    about: "I am a medical officer currently working at the Teaching Hospital, Kandy. Looking for an educated, caring partner who shares Buddhist values and family traditions.",
  },
  {
    id: "MP-24751",
    name: "Rizwan Ahmed",
    age: 30,
    height: "5' 10\" (178 cm)",
    location: "Colombo, Sri Lanka",
    country: "lk",
    religion: "Islam",
    ethnicity: "Moor",
    profession: "Chartered Accountant",
    education: "B.Sc Accounting, CIMA Passed Finalist",
    civilStatus: "Never married",
    livingIn: "Colombo 03, Sri Lanka",
    badges: ["Verified photo"],
    meta: "30 · Colombo · Muslim · Accountant",
    time: "5h ago",
    photo: "/images/profiles/mp-24751.jpg",
    isNew: true,
    tab: "received",
    note: "“Salam Nethmi, wishing you and your family the best. I would be pleased to speak if your preferences align with mine.”",
    about: "Senior financial consultant at a leading firm in Colombo. Family oriented with modern outlook.",
  },
  {
    id: "MP-24671",
    name: "Pradeep Jayawardena",
    age: 34,
    height: "5' 8\" (173 cm)",
    location: "Galle, Sri Lanka",
    country: "lk",
    religion: "Buddhist",
    ethnicity: "Sinhalese",
    profession: "Civil Engineer",
    education: "B.Sc Engineering (Hons), University of Moratuwa",
    civilStatus: "Never married",
    livingIn: "Galle, Sri Lanka",
    badges: ["Verified photo", "Horoscope matching"],
    meta: "34 · Galle · Buddhist · Engineer",
    time: "Yesterday",
    photo: "/images/profiles/mp-24671.jpg",
    isNew: true,
    tab: "received",
    note: "“Hello Nethmi, our family respects your background and would like to propose an initial conversation.”",
    about: "Working as a lead project engineer for infrastructure developments in the Southern province.",
  },
  {
    id: "MP-24733",
    name: "Nuwan Bandara",
    age: 29,
    height: "5' 11\" (180 cm)",
    location: "Melbourne, Australia",
    country: "au",
    religion: "Buddhist",
    ethnicity: "Sinhalese",
    profession: "Software Architect",
    education: "Master of IT, University of Melbourne",
    civilStatus: "Never married",
    livingIn: "Melbourne, Australia (PR holder)",
    badges: ["Verified photo", "Horoscope matching"],
    meta: "29 · Melbourne · Buddhist · Software Architect",
    time: "2 days ago",
    photo: "/images/profiles/mp-24733.jpg",
    isNew: false,
    tab: "received",
    note: "“Hi Nethmi, looking for a companion to build a life together with family values.”",
    about: "Born and raised in Sri Lanka, now working as a software architect in Australia. Frequent visits home.",
  },
  {
    id: "MP-24688",
    name: "Dinuk Weerakkody",
    age: 31,
    height: "5' 10\" (178 cm)",
    location: "London, United Kingdom",
    country: "gb",
    religion: "Christian",
    ethnicity: "Sinhalese",
    profession: "Data Scientist",
    education: "M.Sc Data Science, Imperial College London",
    civilStatus: "Never married",
    livingIn: "London, UK",
    badges: ["Verified photo"],
    meta: "31 · London · Christian · Data Scientist",
    time: "3 days ago",
    photo: "/images/profiles/mp-24688.jpg",
    tab: "sent",
    note: "“Sent interest on Thursday. Awaiting reply.”",
    about: "Working in London fintech. Seeking someone with genuine values and interest in travel.",
  },
  {
    id: "MP-24702",
    name: "Charith Fonseka",
    age: 32,
    height: "5' 9\" (175 cm)",
    location: "Kurunegala, Sri Lanka",
    country: "lk",
    religion: "Buddhist",
    ethnicity: "Sinhalese",
    profession: "Attorney at Law",
    education: "LL.B, Sri Lanka Law College",
    civilStatus: "Never married",
    livingIn: "Kurunegala, Sri Lanka",
    badges: ["Verified photo"],
    meta: "32 · Kurunegala · Buddhist · Lawyer",
    time: "1 week ago",
    photo: "/images/profiles/mp-24702.jpg",
    tab: "accepted",
    note: "“Connected on Nov 2. Phone contacts and messaging are unlocked.”",
    about: "Practicing attorney in the Court of Appeal. Warm, family-loving and passionate about community service.",
  },
];

export interface ChatMessage {
  id: string;
  sender: "them" | "me";
  text: string;
  time: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  memberId: string;
  name: string;
  photo: string;
  online: boolean;
  status: string;
  verified: boolean;
  time: string;
  unread: number;
  messages: ChatMessage[];
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    memberId: "MP-24817",
    name: "Kavindu Shanaka",
    photo: "/images/profiles/mp-24817.jpg",
    online: true,
    status: "Active now",
    verified: true,
    time: "10:31",
    unread: 2,
    messages: [
      { id: "1", sender: "them", text: "Hi Nethmi! Thank you so much for accepting my interest 😊", time: "10:24" },
      { id: "2", sender: "me", text: "Hi Kavindu, happy to connect. My parents liked your profile too.", time: "10:26", read: true },
      { id: "3", sender: "them", text: "That’s wonderful. My parents would like to speak with yours this weekend — would Saturday evening work?", time: "10:30" },
      { id: "4", sender: "them", text: "Thank you for accepting! We can share horoscopes before the call.", time: "10:31" },
    ],
  },
  {
    id: "c2",
    memberId: "MP-24751",
    name: "Rizwan Ahmed",
    photo: "/images/profiles/mp-24751.jpg",
    online: false,
    status: "Active 2h ago",
    verified: true,
    time: "09:02",
    unread: 1,
    messages: [
      { id: "1", sender: "them", text: "Hi Nethmi, I saw that you also studied in Kandy — which school was that?", time: "09:02" },
    ],
  },
  {
    id: "c3",
    memberId: "MP-24671",
    name: "Pradeep Jayawardena",
    photo: "/images/profiles/mp-24671.jpg",
    online: false,
    status: "Active yesterday",
    verified: true,
    time: "Yesterday",
    unread: 2,
    messages: [
      { id: "1", sender: "them", text: "Good evening Nethmi. Shall we arrange an introductory family call this Sunday?", time: "18:40" },
    ],
  },
  {
    id: "c4",
    memberId: "MP-24702",
    name: "Charith Fonseka",
    photo: "/images/profiles/mp-24702.jpg",
    online: true,
    status: "Active now",
    verified: true,
    time: "Nov 5",
    unread: 0,
    messages: [
      { id: "1", sender: "them", text: "Hello Nethmi, nice to connect with you. Have a great week!", time: "Nov 5" },
      { id: "2", sender: "me", text: "Hello Charith, thank you! Hope you are having a productive week as well.", time: "Nov 5", read: true },
    ],
  },
];

export const MESSAGES = CONVERSATIONS.map((c) => ({
  id: c.id,
  name: c.name.split(" ")[0],
  preview: c.messages[c.messages.length - 1].text,
  time: c.time,
  unread: c.unread,
  online: c.online,
  photo: c.photo,
}));
