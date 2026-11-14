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
  /** False for members still waiting for review (no "Verified" badge). */
  verified?: boolean;
}

/** Figma: Profile Marquee (auto-scroll) — Profile Photo Card 1…7 (the track repeats them) */
/** Hero marquee: filled from GET /api/profiles (lib/profiles.ts). No sample members. */
export const MARQUEE_PROFILES: MarqueeProfile[] = [];

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
  /** Shown on cards and used in links (profile code, e.g. LK-1234). */
  id: string;
  /** Database id — needed to send an interest. */
  profileId?: string;
  /** False for members still waiting for review (no "Verified" badge). */
  verified?: boolean;
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
  description: "Every photo is checked by our team before it goes live — send interest to start the conversation.",
  cta: "View all proposals",
  profiles: [] as FeaturedProfile[], // filled from GET /api/profiles (lib/profiles.ts)
};

/* ── 05 Success stories ──────────────────────────────────────────────── */
export const STORIES = {
  eyebrow: "Success stories",
  title: "Real couples, real weddings",
  description: "Real families, real weddings — from Colombo to Melbourne.",
  /** Stories come from GET /api/content/stories (shared by real couples). */
  items: [] as { initials: string; photo: string }[],
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
  /** `count` stays empty until the API returns real numbers per category. */
  rows: [
    [
      { label: "Female teachers", count: "", icon: "teacher" },
      { label: "Parent-posted ads", count: "", icon: "people" },
      { label: "ID-verified ads", count: "", icon: "verify" },
      { label: "Degree holders", count: "", icon: "book" },
      { label: "Female doctors", count: "", icon: "health" },
      { label: "Male engineers", count: "", icon: "cpu" },
    ],
    [
      { label: "Overseas grooms", count: "", icon: "global" },
      { label: "Brides in Sri Lanka", count: "", icon: "location" },
      { label: "Diploma holders", count: "", icon: "briefcase" },
      { label: "Male IT experts", count: "", icon: "monitor" },
      { label: "With horoscope", count: "", icon: "star" },
      { label: "Premium members", count: "", icon: "crown" },
    ],
    [
      { label: "Kandyan", count: "", icon: "house" },
      { label: "Low-country", count: "", icon: "map" },
      { label: "Second marriage", count: "", icon: "lovely" },
      { label: "Nurses", count: "", icon: "hospital" },
      { label: "Government sector", count: "", icon: "building" },
      { label: "Business owners", count: "", icon: "profile-2user" },
    ],
  ] as { label: string; count: string; icon: CategoryIcon }[][],
};

/* ── 06 Pricing ──────────────────────────────────────────────────────── */
export const PRICING = {
  eyebrow: "Pricing",
  title: "Plans for every family",
  description: "Start free. Upgrade when you are ready to connect. Prices in LKR — overseas members can pay by card.",
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
      q: "I live overseas — can I join?",
      a: "Absolutely. Sri Lankans in Australia, the UK, Canada, the Middle East and beyond can register and pay by card.",
    },
  ],
};

/* ── 08 Sign up ──────────────────────────────────────────────────────── */
export const SIGN_UP = {
  eyebrow: "Join free today",
  title: "Ready to meet your life partner?",
  body: "Create your profile in two minutes — for yourself or for your family. Your details stay private until you choose to share them.",
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
  brand: "Sri Lanka’s trusted home for verified marriage proposals — for you and your family.",
  columns: [
    { title: "Browse", links: [["Brides", "/search?for=bride"], ["Grooms", "/search?for=groom"], ["Overseas proposals", "/search?overseas=1"], ["Success stories", "/#stories"]] },
    { title: "Company", links: [["About us", "/about"], ["How it works", "/#how-it-works"], ["Pricing", "/#pricing"], ["Contact", "/contact"]] },
    { title: "Support", links: [["Safety tips", "/safety"], ["Report a profile", "/report"], ["Privacy policy", "/privacy"], ["Terms of use", "/terms"]] },
  ] as { title: string; links: [string, string][] }[],
  copyright: "© 2026 Vikasitha. All rights reserved.",
};
