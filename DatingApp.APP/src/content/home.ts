/**
 * Home page content — copied word-for-word from Figma
 * ("🏠 Home Page" → "Home — Desktop 1442" / "Home — Mobile 390").
 *
 * Keep copy here (not inside components) so content changes never touch
 * layout code, and so the API can replace this file later.
 */
import type { CountryCode } from "@/components/ui/Flag";

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Brides", href: "/search?for=bride" },
  { label: "Grooms", href: "/search?for=groom" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
] as const;

/* ── 01 Hero ─────────────────────────────────────────────────────────── */
export const HERO = {
  title: "Find a life partner your whole family can trust",
  description:
    "Real, photo-verified marriage proposals from across Sri Lanka and Sri Lankans overseas. Your contact details stay private until you say yes.",
  image: "/images/hero/hero-couple.jpg",
};

export interface MarqueeProfile {
  id: string;
  city: string;
  country: CountryCode;
  age: number;
  height: string;
  profession: string;
  religion: string;
  avatar: string;
  gender: "bride" | "groom";
  /** Profile Photo Card (hero marquee) — first name, full location, mother tongue, main photo */
  name: string;
  location: string;
  language: string;
  photo: string;
}

/** Figma: Profile Marquee (auto-scroll) — Profile Photo Card 1…7 (the track repeats them) */
export const MARQUEE_PROFILES: MarqueeProfile[] = [
  { id: "MP-24817", city: "Kandy", country: "lk", age: 28, height: "5′ 4″", profession: "Doctor", religion: "Buddhist", avatar: "/images/profiles/avatar-mp-24817.jpg", gender: "groom", name: "Kavindu", location: "Kandy, Sri Lanka", language: "Sinhala", photo: "/images/profiles/mp-24817.jpg" },
  { id: "MP-24790", city: "Melbourne", country: "au", age: 32, height: "5′ 9″", profession: "Engineer", religion: "Catholic", avatar: "/images/profiles/avatar-mp-24790.jpg", gender: "bride", name: "Nethmi", location: "Melbourne, Australia", language: "Sinhala", photo: "/images/profiles/mp-24790.jpg" },
  { id: "MP-24766", city: "Toronto", country: "ca", age: 29, height: "5′ 3″", profession: "Nurse", religion: "Hindu", avatar: "/images/profiles/avatar-mp-24766.jpg", gender: "bride", name: "Tharshini", location: "Toronto, Canada", language: "Tamil", photo: "/images/profiles/mp-24766.jpg" },
  { id: "MP-24751", city: "Colombo", country: "lk", age: 30, height: "5′ 8″", profession: "Accountant", religion: "Muslim", avatar: "/images/profiles/avatar-mp-24751.jpg", gender: "groom", name: "Rizwan", location: "Colombo, Sri Lanka", language: "Tamil", photo: "/images/profiles/mp-24751.jpg" },
  { id: "MP-24733", city: "Galle", country: "lk", age: 26, height: "5′ 2″", profession: "Teacher", religion: "Buddhist", avatar: "/images/profiles/avatar-mp-24733.jpg", gender: "bride", name: "Sachini", location: "Galle, Sri Lanka", language: "Sinhala", photo: "/images/profiles/mp-24733.jpg" },
  { id: "MP-24702", city: "Doha", country: "qa", age: 34, height: "5′ 10″", profession: "Civil Eng.", religion: "Buddhist", avatar: "/images/profiles/avatar-mp-24702.jpg", gender: "bride", name: "Dilini", location: "Doha, Qatar", language: "Sinhala", photo: "/images/profiles/mp-24702.jpg" },
  { id: "MP-24688", city: "Kurunegala", country: "lk", age: 27, height: "5′ 5″", profession: "Pharmacist", religion: "Buddhist", avatar: "/images/profiles/avatar-mp-24688.jpg", gender: "bride", name: "Hiruni", location: "Kurunegala, Sri Lanka", language: "Sinhala", photo: "/images/profiles/mp-24688.jpg" },
];

/* ── 02 How it works ─────────────────────────────────────────────────── */
export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  title: "Four steps to your forever",
  description: "Simple, safe and family-friendly from first profile to the poruwa.",
  steps: [
    { n: "01", title: "Create your profile", text: "Post for yourself or for your son, daughter or sibling.", pill: "About 2 minutes", tone: "rose", icon: "user-add" },
    { n: "02", title: "Get verified", text: "We check ID and phone, so every profile you see is genuine.", pill: "ID + phone check", tone: "gold", icon: "verify" },
    { n: "03", title: "Find & send interest", text: "Filter by religion, district and profession, then send interest.", pill: "Free to send", tone: "rose", icon: "search" },
    { n: "04", title: "Families connect", text: "Once both sides accept, photos and contacts unlock.", pill: "Plan the poruwa", tone: "gold", icon: "lovely" },
  ] as const,
};

/* ── 04 Featured profiles ────────────────────────────────────────────── */
export interface FeaturedProfile {
  id: string;
  location: string;
  country: CountryCode;
  age: number;
  height: string;
  profession: string;
  religion: string;
  photo: string;
  horoscope: boolean;
  gender: "bride" | "groom";
}

export const FEATURED = {
  eyebrow: "Featured profiles",
  title: "Recently verified proposals",
  description: "Every photo is checked by our team before it goes live. Send interest to start the conversation.",
  cta: "View all proposals",
  profiles: [
    { id: "MP-24817", location: "Kandy, Sri Lanka", country: "lk", age: 28, height: "5′ 4″", profession: "Doctor (MBBS)", religion: "Buddhist", photo: "/images/profiles/mp-24817.jpg", horoscope: true, gender: "groom" },
    { id: "MP-24790", location: "Melbourne, Australia", country: "au", age: 32, height: "5′ 9″", profession: "Software Engineer", religion: "Catholic", photo: "/images/profiles/mp-24790.jpg", horoscope: false, gender: "bride" },
    { id: "MP-24766", location: "Toronto, Canada", country: "ca", age: 29, height: "5′ 3″", profession: "Registered Nurse", religion: "Hindu", photo: "/images/profiles/mp-24766.jpg", horoscope: true, gender: "bride" },
    { id: "MP-24751", location: "Colombo, Sri Lanka", country: "lk", age: 30, height: "5′ 8″", profession: "Chartered Accountant", religion: "Muslim", photo: "/images/profiles/mp-24751.jpg", horoscope: false, gender: "groom" },
    { id: "MP-24733", location: "Galle, Sri Lanka", country: "lk", age: 26, height: "5′ 2″", profession: "Teacher (BEd)", religion: "Buddhist", photo: "/images/profiles/mp-24733.jpg", horoscope: true, gender: "bride" },
    { id: "MP-24702", location: "Doha, Qatar", country: "qa", age: 34, height: "5′ 10″", profession: "Civil Engineer", religion: "Buddhist", photo: "/images/profiles/mp-24702.jpg", horoscope: false, gender: "bride" },
    { id: "MP-24688", location: "Kurunegala, Sri Lanka", country: "lk", age: 27, height: "5′ 5″", profession: "Pharmacist", religion: "Buddhist", photo: "/images/profiles/mp-24688.jpg", horoscope: true, gender: "bride" },
    { id: "MP-24671", location: "London, UK", country: "gb", age: 31, height: "5′ 7″", profession: "Bank Officer", religion: "Christian", photo: "/images/profiles/mp-24671.jpg", horoscope: false, gender: "groom" },
  ] satisfies FeaturedProfile[],
};

/* ── 05 Success stories ──────────────────────────────────────────────── */
export const STORIES = {
  eyebrow: "Success stories",
  title: "Trusted by 100+ happy couples",
  description: "Real families, real weddings, from Colombo to Melbourne.",
  /**
   * Item 1 is the story shown in Figma. Items 2–7 are PLACEHOLDER copy so the
   * carousel arrows have something to show — replace with real stories.
   */
  items: [
    {
      badge: "Married 2025",
      headline: "Our families clicked first",
      quote: "Amma found his profile, we spoke for a month, and the horoscopes matched perfectly.",
      initials: "KS",
      names: "Kasun & Sachini",
      meta: "Colombo · Buddhist",
      photo: "/images/stories/story-main.jpg",
      caption: "Watch their story",
      captionMeta: "Poruwa ceremony · March 2025",
    },
    {
      badge: "Married 2024",
      headline: "Across two continents",
      quote: "I was in Melbourne, she was in Kandy. Video calls with both families made it feel easy.",
      initials: "RN",
      names: "Ravindu & Nadeesha",
      meta: "Melbourne · Buddhist",
      photo: "/images/stories/story-2.jpg",
      caption: "Watch their story",
      captionMeta: "Kandyan wedding · June 2024",
    },
    {
      badge: "Married 2024",
      headline: "Verified made us brave",
      quote: "Knowing every profile was checked gave my parents the confidence to say yes.",
      initials: "AT",
      names: "Arun & Tharshini",
      meta: "Jaffna · Hindu",
      photo: "/images/stories/story-3.jpg",
      caption: "Watch their story",
      captionMeta: "Temple wedding · August 2024",
    },
    {
      badge: "Married 2023",
      headline: "A match at the first call",
      quote: "We talked for three hours on our first call. Six months later we were on the poruwa.",
      initials: "DM",
      names: "Dilan & Malsha",
      meta: "Galle · Buddhist",
      photo: "/images/stories/story-4.jpg",
      caption: "Watch their story",
      captionMeta: "Poruwa ceremony · December 2023",
    },
    {
      badge: "Married 2023",
      headline: "Our parents became friends",
      quote: "Both mothers chatted on the app before we did. By the time we met, the families were already close.",
      initials: "SH",
      names: "Sahan & Hiruni",
      meta: "Kurunegala · Buddhist",
      photo: "/images/stories/story-1.jpg",
      caption: "Watch their story",
      captionMeta: "Poruwa ceremony · May 2023",
    },
    {
      badge: "Married 2025",
      headline: "Home, even from Dubai",
      quote: "Working abroad I worried I'd miss out. Vikasitha brought a match from my own hometown.",
      initials: "MF",
      names: "Mohamed & Fathima",
      meta: "Dubai · Islam",
      photo: "/images/stories/story-5.jpg",
      caption: "Watch their story",
      captionMeta: "Nikah ceremony · January 2025",
    },
    {
      badge: "Married 2024",
      headline: "Same values, same dreams",
      quote: "We both wanted a simple wedding and a big family. The filters found exactly that.",
      initials: "JP",
      names: "Janith & Piumi",
      meta: "Negombo · Catholic",
      photo: "/images/stories/story-6.jpg",
      caption: "Watch their story",
      captionMeta: "Church wedding · October 2024",
    },
  ],
};

/* ── Category Brick Wall ─────────────────────────────────────────────── */
export type CategoryIcon =
  | "teacher" | "people" | "verify" | "book" | "health" | "cpu" | "global" | "location" | "briefcase"
  | "monitor" | "star" | "crown" | "house" | "map" | "lovely" | "hospital" | "building" | "profile-2user";

export const CATEGORIES = {
  eyebrow: "Top categories",
  title: "Browse proposals your way",
  description: "Jump straight to the profiles that matter to your family.",
  cta: "Explore all categories",
  rows: [
    [
      { label: "Female teachers", count: "1,820", icon: "teacher" },
      { label: "Parent-posted ads", count: "4,310", icon: "people" },
      { label: "ID-verified ads", count: "6,950", icon: "verify" },
      { label: "Degree holders", count: "5,140", icon: "book" },
      { label: "Female doctors", count: "960", icon: "health" },
      { label: "Male engineers", count: "2,280", icon: "cpu" },
    ],
    [
      { label: "Overseas grooms", count: "1,470", icon: "global" },
      { label: "Brides in Sri Lanka", count: "7,860", icon: "location" },
      { label: "Diploma holders", count: "2,030", icon: "briefcase" },
      { label: "Male IT experts", count: "3,120", icon: "monitor" },
      { label: "With horoscope", count: "5,610", icon: "star" },
      { label: "Premium members", count: "1,150", icon: "crown" },
    ],
    [
      { label: "Kandyan", count: "2,640", icon: "house" },
      { label: "Low-country", count: "3,380", icon: "map" },
      { label: "Second marriage", count: "890", icon: "lovely" },
      { label: "Nurses", count: "1,560", icon: "hospital" },
      { label: "Government sector", count: "2,950", icon: "building" },
      { label: "Business owners", count: "1,240", icon: "profile-2user" },
    ],
  ] as { label: string; count: string; icon: CategoryIcon }[][],
};

/* ── 06 Pricing ──────────────────────────────────────────────────────── */
export const PRICING = {
  eyebrow: "Pricing",
  title: "Plans for every family",
  description: "Start free. Upgrade when you are ready to connect. Prices in LKR. Overseas members can pay by card.",
  plans: [
    {
      id: "free",
      name: "Free",
      description: "Create your profile and start browsing",
      features: ["Create & post your profile", "Browse all proposals", "Send 5 interests a month", "Safety & privacy controls"],
      price: "LKR 0",
      period: "/ forever",
      cta: "Get started free",
      href: "/register",
    },
    {
      id: "gold",
      name: "Gold",
      description: "For serious seekers and families",
      features: ["Unlimited interests", "See contacts after acceptance", "View horoscopes", "Profile highlighted in search"],
      price: "LKR 2,500",
      period: "/ month",
      cta: "Choose Gold",
      href: "/plans",
      popular: true,
    },
    {
      id: "platinum",
      name: "Platinum",
      description: "Personal help from our matchmakers",
      features: ["Everything in Gold", "Dedicated matchmaker", "Hand-picked weekly matches", "Priority verification"],
      price: "LKR 6,500",
      period: "/ month",
      cta: "Choose Platinum",
      href: "/plans",
    },
  ],
};

/* ── 07 FAQ ──────────────────────────────────────────────────────────── */
export const FAQ = {
  eyebrow: "FAQ",
  title: "Questions families ask",
  description: "Everything you need to know about safety, privacy and how matching works.",
  help: {
    title: "Still have questions?",
    text: "Call or WhatsApp our Colombo team, 9am–6pm every day.",
    cta: "Contact support",
    href: "tel:+94112345678",
  },
  items: [
    {
      q: "How do you verify profiles?",
      a: "Every member confirms their phone number, and we check a national ID or passport before the Verified badge appears. Report any suspicious profile and our team reviews it within 24 hours.",
    },
    {
      q: "Can parents create a profile for their son or daughter?",
      a: "Yes. Choose “Son”, “Daughter” or another relative when you register. The profile clearly shows it was posted by family.",
    },
    {
      q: "Who can see my photos and phone number?",
      a: "Your phone number is never shown publicly. Photos can be blurred until you accept an interest, and contact details unlock only when both sides accept.",
    },
    {
      q: "Is horoscope matching available?",
      a: "Yes. Upload your horoscope and Gold members can view and compare horoscopes before sending interest.",
    },
    {
      q: "I live overseas, can I join?",
      a: "Absolutely. Sri Lankans in Australia, the UK, Canada, the Middle East and beyond can register and pay by card.",
    },
  ],
};

/* ── 08 Sign up ──────────────────────────────────────────────────────── */
export const SIGN_UP = {
  eyebrow: "Join free today",
  title: "Ready to meet your life partner?",
  body: "Create your profile in two minutes, for yourself or for your family. Your details stay private until you choose to share them.",
  benefits: ["Verified, genuine members only", "Photo-verified profiles you can trust", "Sinhala, Tamil & English support"],
  form: {
    title: "Create your free profile",
    subtitle: "It takes 2 minutes. Your details stay private until you choose to share them.",
    cta: "Register now",
    legal: "By registering you agree to our Terms and Privacy Policy.",
  },
};

/* ── 09 Footer ───────────────────────────────────────────────────────── */
export const FOOTER = {
  brand: "Sri Lanka’s trusted home for verified marriage proposals, for you and your family.",
  columns: [
    { title: "Browse", links: [["Brides", "/search?for=bride"], ["Grooms", "/search?for=groom"], ["Overseas proposals", "/search?overseas=1"], ["Success stories", "/#stories"]] },
    { title: "Company", links: [["About us", "/about"], ["How it works", "/#how-it-works"], ["Pricing", "/#pricing"], ["Contact", "/contact"]] },
    { title: "Support", links: [["Safety tips", "/safety"], ["Report a profile", "/report"], ["Privacy policy", "/privacy"], ["Terms of use", "/terms"]] },
  ] as { title: string; links: [string, string][] }[],
  copyright: "© 2026 Vikasitha. All rights reserved.",
};
