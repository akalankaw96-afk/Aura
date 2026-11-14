/**
 * Search proposals — Figma "🔍 Search Results" (87:15052).
 * Filter options for the sidebar plus helpers that build the list-card details
 * (education, ethnicity…) from each member's real profile.
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
  "Ampara", "Kilinochchi", "Mannar", "Monaragala", "Mullaitivu", "Vavuniya",
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

/* ---------- details for list cards ---------- */
export interface ProfileExtras {
  education: string;
  ethnicity: string;
  civil: string;
  postedBy: string;
  /** Match score — null until there is a matching engine (no made-up numbers). */
  match: number | null;
  /** "Active now" etc. — empty until the API reports activity. */
  active: string;
  /** "Posted today" etc. — empty until the API returns the posting date. */
  posted: string;
  postedAt: string;
  photos: number;
  district: string;
}

const ETHNICITY: Record<string, string> = { sinhalese: "Sinhala", sinhala: "Sinhala", tamil: "Tamil", muslim: "Muslim", burgher: "Burgher", malay: "Malay" };

/** List-card details taken from the member's real profile (nothing generated). */
export function profileExtras(p: {
  location: string;
  education?: string;
  community?: string;
  district?: string | null;
  civil?: string | null;
  postedBy?: string | null;
  photo?: string;
}): ProfileExtras {
  const district = p.district || DISTRICT_OPTIONS.find((d) => p.location.toLowerCase().includes(d.toLowerCase())) || "";
  return {
    education: p.education || "",
    ethnicity: ETHNICITY[(p.community || "").toLowerCase()] ?? (p.community || ""),
    civil: p.civil || "",
    postedBy: p.postedBy || "",
    match: null,
    active: "",
    posted: "",
    postedAt: "",
    photos: p.photo ? 1 : 0,
    district,
  };
}

export const matchLabel = (pct: number) => (pct >= 90 ? "Excellent match" : pct >= 80 ? "Great match" : "Good match");
