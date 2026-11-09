/**
 * Search proposals — Figma "🔍 Search Results" (87:15052).
 * Filter options for the sidebar plus small helpers that fill in the extra
 * list-card details (education, ethnicity…) for demo profiles that don't
 * carry them yet. Replace the helpers with API fields when available.
 */
import type { CountryCode } from "@/components/ui/Flag";

export const RELIGION_OPTIONS = ["Buddhist", "Catholic", "Christian", "Hindu", "Muslim", "Other"];

export const COUNTRY_OPTIONS: { code: CountryCode; label: string }[] = [
  { code: "lk", label: "Sri Lanka" },
  { code: "au", label: "Australia" },
  { code: "gb", label: "United Kingdom" },
  { code: "ca", label: "Canada" },
  { code: "qa", label: "Middle East" },
];
export const MORE_COUNTRIES: { code: CountryCode; label: string }[] = [
  { code: "ae", label: "UAE" },
  { code: "nz", label: "New Zealand" },
  { code: "us", label: "USA" },
  { code: "it", label: "Italy" },
];

export const DISTRICT_OPTIONS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota",
  "Jaffna", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Ratnapura", "Kegalle", "Trincomalee", "Batticaloa",
];

export const PROFESSION_OPTIONS = ["Doctor", "Engineer", "Teacher", "Nurse", "IT", "Accountant", "Lawyer"];
const PROFESSION_MATCH: Record<string, RegExp> = {
  Doctor: /doctor|physician|surgeon|dental|mbbs/i,
  Engineer: /engineer/i,
  Teacher: /teacher|lecturer|academ/i,
  Nurse: /nurse/i,
  IT: /software|developer|\bit\b|data|tech|analyst/i,
  Accountant: /account|finance|bank/i,
  Lawyer: /lawyer|attorney|legal|law/i,
};
export const matchesProfession = (profession: string, picked: string) => PROFESSION_MATCH[picked]?.test(profession) ?? false;

export const MORE_SECTIONS = {
  ethnicity: { title: "Ethnicity", options: ["Sinhala", "Tamil", "Muslim", "Burgher", "Other"] },
  civil: { title: "Civil status", options: ["Never married", "Divorced", "Widowed"] },
  education: { title: "Education", options: ["Postgraduate", "Graduate", "Diploma", "A/L"] },
  horoscope: { title: "Horoscope", options: ["Horoscope available"] },
  lifestyle: { title: "Lifestyle (drinking, smoking)", options: ["Non-drinker", "Non-smoker"] },
  postedBy: { title: "Posted by (self / parents)", options: ["Self", "Mother", "Father", "Relative"] },
  caste: { title: "Caste (optional)", options: ["Govigama", "Karava", "Salagama", "Durava", "Other"] },
} as const;
export type MoreKey = keyof typeof MORE_SECTIONS;

export type SortKey = "newest" | "best" | "age-asc" | "age-desc";
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "best", label: "Best match" },
  { value: "age-asc", label: "Age: youngest" },
  { value: "age-desc", label: "Age: oldest" },
];

/** 4′6″ … 6′6″ in inches */
export const HEIGHT_MIN = 54;
export const HEIGHT_MAX = 78;
export const fmtHeight = (inches: number) => `${Math.floor(inches / 12)}'${inches % 12}"`;
export function parseHeight(h: string): number | null {
  const m = /(\d)\D+(\d{1,2})/.exec(h);
  return m ? Number(m[1]) * 12 + Number(m[2]) : null;
}

/* ---------- demo details for list cards ---------- */
function hash(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
const pick = <T,>(arr: readonly T[], id: string, salt = 0) => arr[(hash(id) + salt) % arr.length];

export interface ProfileExtras {
  education: string;
  ethnicity: string;
  civil: string;
  postedBy: string;
  match: number;
  active: string;
  posted: string;
  photos: number;
  district: string;
}

export function profileExtras(id: string, location: string, religion: string): ProfileExtras {
  const h = hash(id);
  const district = DISTRICT_OPTIONS.find((d) => location.toLowerCase().includes(d.toLowerCase())) ?? "";
  return {
    education: pick(["Postgraduate", "Graduate", "Postgraduate", "Diploma"], id),
    ethnicity: /hindu/i.test(religion) ? "Tamil" : /muslim|islam/i.test(religion) ? "Muslim" : pick(["Sinhala", "Sinhala", "Sinhala", "Burgher"], id, 1),
    civil: pick(["Never married", "Never married", "Never married", "Divorced"], id, 2),
    postedBy: pick(["Mother", "Self", "Father", "Mother"], id, 3),
    match: 72 + (h % 27),
    active: pick(["Active now", "Active today", "Active 2h ago", "Active yesterday", "Active 3 days ago"], id, 4),
    posted: pick(["Posted today", "Posted 2 days ago", "Posted 5 days ago", "Posted last week"], id, 5),
    photos: 2 + (h % 5),
    district,
  };
}

export const matchLabel = (pct: number) => (pct >= 90 ? "Excellent match" : pct >= 80 ? "Great match" : "Good match");
