import type { CountryCode } from "@/components/ui/Flag";
import type { ResultsView } from "@/components/ui/ViewToggle";
import type { SearchQuery } from "@/lib/matching";
import { toFeatured } from "@/lib/profiles";
import type { FeaturedProfile } from "@/content/home";
import { COUNTRY_OPTIONS, HEIGHT_MAX, HEIGHT_MIN, MORE_COUNTRIES, type MoreKey, type SortKey } from "@/content/search";
import type { Profile } from "@/types";
import { AGE_MAX, AGE_MIN, defaultFilters, type SearchFilters } from "./FiltersSidebar";

/* Search page helpers with no React in them (S05-T07: moved out of `app/search/page.tsx`). */

/** A search result: the card fields plus what the list card and the full profile need. */
export interface CandidateProposal extends FeaturedProfile {
  name?: string;
  education?: string;
  bio?: string;
  aboutFamily?: string;
  community?: string;
  professionCategory?: string;
  district?: string;
  countryName?: string;
  details?: Profile["details"];
  /** running boost (S04-T05) */
  promoted?: boolean;
}

export type AppliedSearch = { filters: SearchFilters; sort: SortKey };

export const COUNTRY_LABEL: Partial<Record<CountryCode, string>> = Object.fromEntries(
  [...COUNTRY_OPTIONS, ...MORE_COUNTRIES].map((c) => [c.code, c.label]),
);
export const PAGE_SIZE: Record<ResultsView, number> = { grid: 12, list: 6 };
/** Profiles per API page (GET /api/profiles/search, max 50) — "Load more" fetches the next one. */
export const SERVER_PAGE = 48;
const SORT_API: Record<SortKey, SearchQuery["sort"]> = { newest: undefined, best: undefined, "age-asc": "ageAsc", "age-desc": "ageDesc" };

/**
 * The filters the server applies (and counts as a search when any is set besides Bride / Groom).
 * Multi-selects, height, countries and the "More" sections are refined on the loaded results — `filtered`
 * tells the server, so they count as a search too (no free filtering past the monthly limit).
 */
export function toQuery(f: SearchFilters, sort: SortKey): SearchQuery {
  return {
    gender: f.lookingFor === "bride" ? "female" : "male",
    ageFrom: f.age[0] !== AGE_MIN ? f.age[0] : undefined,
    ageTo: f.age[1] !== AGE_MAX ? f.age[1] : undefined,
    religion: f.religions.length === 1 && f.religions[0] !== "Other" ? f.religions[0] : undefined,
    profession: f.professions.length === 1 ? f.professions[0] : undefined,
    location: f.district || undefined,
    horoscope: f.more.horoscope?.length ? true : undefined,
    sort: SORT_API[sort],
    filtered: hasClientOnlyFilters(f) ? true : undefined,
  };
}

/** True when some filters only narrow the loaded results (then the count is of what's loaded). */
export function hasClientOnlyFilters(f: SearchFilters) {
  return (
    f.religions.length > 1 ||
    f.religions.includes("Other") ||
    f.professions.length > 1 ||
    f.countries.length > 0 ||
    f.withPhoto ||
    f.verifiedOnly ||
    f.height[0] !== HEIGHT_MIN ||
    f.height[1] !== HEIGHT_MAX ||
    (Object.keys(f.more) as MoreKey[]).some((k) => k !== "horoscope" && (f.more[k]?.length ?? 0) > 0)
  );
}

/** A saved search (API filters) back into the sidebar's filters. */
export function fromQuery(q: SearchQuery): AppliedSearch {
  const f = defaultFilters(q.gender === "male" ? "groom" : "bride");
  if (q.ageFrom) f.age = [Math.max(AGE_MIN, q.ageFrom), f.age[1]];
  if (q.ageTo) f.age = [f.age[0], Math.min(AGE_MAX, q.ageTo)];
  if (q.religion) f.religions = [q.religion];
  if (q.profession) f.professions = [q.profession];
  if (q.location) f.district = q.location;
  if (q.horoscope) f.more = { horoscope: ["Horoscope available"] };
  const sort: SortKey = q.sort === "ageAsc" ? "age-asc" : q.sort === "ageDesc" ? "age-desc" : "newest";
  return { filters: f, sort };
}

/** First filters from the URL: ?for=bride|groom, ?min / ?max (age), ?category (Home page tiles). */
export function filtersFromParams(params: Pick<URLSearchParams, "get">): SearchFilters {
  const f = defaultFilters(params.get("for")?.toLowerCase() === "groom" ? "groom" : "bride");
  const category = (params.get("category") || "").toLowerCase();
  const min = Number(params.get("min"));
  const max = Number(params.get("max"));
  if (min) f.age = [Math.max(AGE_MIN, min), f.age[1]];
  if (max) f.age = [f.age[0], Math.min(AGE_MAX, max)];
  if (/doctor|health/.test(category)) f.professions = ["Doctor"];
  else if (/engineer/.test(category)) f.professions = ["Engineer"];
  else if (/teacher/.test(category)) f.professions = ["Teacher"];
  else if (/\bit\b|software/.test(category)) f.professions = ["IT"];
  else if (/overseas|expat/.test(category)) f.countries = ["au", "gb", "ca", "qa"];
  else if (/kandy|colombo|galle/.test(category)) f.district = category.replace(/^\w/, (c) => c.toUpperCase());
  return f;
}

/** Default name for a saved search, e.g. "Brides in Kandy, 25–32" (unique among the member's saved searches). */
export function savedSearchName(f: SearchFilters, taken: string[]) {
  const ages = f.age[0] !== AGE_MIN || f.age[1] !== AGE_MAX ? `, ${f.age[0]}–${f.age[1]}` : "";
  const base = `${f.lookingFor === "bride" ? "Brides" : "Grooms"}${f.district ? ` in ${f.district}` : ""}${ages}`;
  let name = base;
  for (let n = 2; taken.includes(name); n++) name = `${base} (${n})`;
  return name;
}

export const toProposal = (p: Profile): CandidateProposal => ({
  ...toFeatured(p),
  name: p.name,
  countryName: p.country,
  district: p.details?.district || undefined,
  details: p.details,
  bio: p.bio,
  education: p.education,
  community: p.community,
  aboutFamily: p.aboutFamily,
  professionCategory: p.professionCategory,
  promoted: p.promoted ?? false,
});
