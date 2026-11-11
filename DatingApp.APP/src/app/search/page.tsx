"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight2, Crown1, Eye, SearchNormal1, Setting4, TextalignLeft, CloseCircle } from "iconsax-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeartPattern } from "@/components/ui/Decor";
import { Button } from "@/components/ui/Button";
import { Flag, type CountryCode } from "@/components/ui/Flag";
import { Pagination } from "@/components/ui/Pagination";
import { RemovableFilterChip } from "@/components/ui/RemovableFilterChip";
import { SortDropdown } from "@/components/ui/SortDropdown";
import { ViewToggle, type ResultsView } from "@/components/ui/ViewToggle";
import { useToast } from "@/components/ui/Toast";
import { hasSession, requireMember, useSignedIn } from "@/lib/session";
import { favouriteProfile, useSentInterests } from "@/lib/connections";
import { cn } from "@/lib/cn";
import { consumeProfileView, consume, allSearchLimitsExhausted, useUsage } from "@/lib/usage";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { ProfileCardList } from "@/components/cards/ProfileCardList";
import { ProfileView } from "@/components/sections/search/ProfileView";
import {
  AGE_MAX,
  AGE_MIN,
  FiltersSidebar,
  defaultFilters,
  type SearchFilters,
} from "@/components/sections/search/FiltersSidebar";
import { FEATURED, MARQUEE_PROFILES, type FeaturedProfile } from "@/content/home";
import {
  COUNTRY_OPTIONS,
  HEIGHT_MAX,
  HEIGHT_MIN,
  MORE_COUNTRIES,
  MORE_SECTIONS,
  SORT_OPTIONS,
  fmtHeight,
  matchesProfession,
  parseHeight,
  profileExtras,
  type MoreKey,
  type SortKey,
} from "@/content/search";
import { mockProfiles } from "@/data/mockData";
import { apiService } from "@/services/api";
import type { Profile } from "@/types";

// Unified Candidate Proposal Interface
interface CandidateProposal extends FeaturedProfile {
  name?: string;
  education?: string;
  bio?: string;
  aboutFamily?: string;
  rasi?: string;
  nakshatra?: string;
  professionCategory?: string;
  district?: string;
  countryName?: string;
  details?: Profile["details"];
}

const COUNTRY_LABEL: Partial<Record<CountryCode, string>> = Object.fromEntries(
  [...COUNTRY_OPTIONS, ...MORE_COUNTRIES].map((c) => [c.code, c.label])
);
const PAGE_SIZE: Record<ResultsView, number> = { grid: 12, list: 6 };

/**
 * Search proposals — Figma "🔍 Search Results" (87:15052):
 * "Search — Desktop 1440" (grid) and "(List view)". Breadcrumb band, then
 * Filters sidebar (296) + Results (952): header (title, count, view toggle, sort),
 * Active filters, Promoted profiles (grid view), results, pagination row.
 * Query params: ?for=bride|groom, ?min/max (age), ?category, ?id (opens a profile), ?view=list.
 */
function SearchPageContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const signedIn = useSignedIn();
  const { save: saveInterest } = useSentInterests();
  const topRef = useRef<HTMLDivElement>(null);

  const initialFor = searchParams.get("for")?.toLowerCase() === "groom" ? "groom" : "bride";
  const initialId = searchParams.get("id") || "";
  // opened from the Home page (hero marquee / featured profiles) → Back returns Home
  // Where the member opened a profile from: Home marquee or Dashboard "Best matches" → Back returns there
  const openedFrom = searchParams.get("from");
  const fromHome = openedFrom === "home";
  const fromDashboard = openedFrom === "dashboard";
  const initialCategory = (searchParams.get("category") || "").toLowerCase();

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const f = defaultFilters(initialFor);
    const min = Number(searchParams.get("min"));
    const max = Number(searchParams.get("max"));
    if (min) f.age = [Math.max(AGE_MIN, min), f.age[1]];
    if (max) f.age = [f.age[0], Math.min(AGE_MAX, max)];
    if (/doctor|health/.test(initialCategory)) f.professions = ["Doctor"];
    else if (/engineer/.test(initialCategory)) f.professions = ["Engineer"];
    else if (/teacher/.test(initialCategory)) f.professions = ["Teacher"];
    else if (/\bit\b|software/.test(initialCategory)) f.professions = ["IT"];
    else if (/overseas|expat/.test(initialCategory)) f.countries = ["au", "gb", "ca", "qa"];
    else if (/kandy|colombo|galle/.test(initialCategory)) f.district = initialCategory.replace(/^\w/, (c) => c.toUpperCase());
    return f;
  });
  const [view, setView] = useState<ResultsView>(searchParams.get("view") === "list" ? "list" : "grid");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Full-page profile view (?id=) — results list on the left, profile on the right
  const [viewId, setViewId] = useState<string | null>(null);
  const pushedRef = useRef(false);

  // Live Database Connectivity State
  const [liveDbProfiles, setLiveDbProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    let isMounted = true;
    apiService.getProfiles().then((profiles) => {
      if (isMounted) setLiveDbProfiles(profiles);
    });
    return () => {
      isMounted = false;
    };
  }, [signedIn]);

  // Master Pool of Candidates combining Live SQL Server DB, Featured, Mock, and Marquee data
  const candidatePool: CandidateProposal[] = useMemo(() => {
    const list: CandidateProposal[] = [];
    const seenIds = new Set<string>();

    // 0. If Live SQL Server profiles are returned from the API, add them first!
    if (liveDbProfiles && liveDbProfiles.length > 0) {
      for (const p of liveDbProfiles) {
        const code = p.code || p.id;
        if (!seenIds.has(code)) {
          seenIds.add(code);
          const isBride = p.gender === "female";
          const cCode = [...COUNTRY_OPTIONS, ...MORE_COUNTRIES].find((country) => country.label.toLowerCase() === p.country?.toLowerCase())?.code ?? "lk";
          list.push({
            id: code,
            name: p.name,
            gender: isBride ? "bride" : "groom",
            age: p.age,
            height: p.height,
            profession: p.profession,
            religion: p.religion,
            location: [p.location, p.country].filter(Boolean).join(", "),
            country: cCode,
            countryName: p.country,
            district: p.details?.district || undefined,
            details: p.details,
            photo: p.photoUrl,
            horoscope: p.horoscopeAvailable,
            bio: p.bio,
            education: p.education,
            aboutFamily: p.aboutFamily,
            professionCategory: p.professionCategory,
            rasi: p.horoscopeAvailable ? "Simha" : undefined,
            nakshatra: p.horoscopeAvailable ? "Makha" : undefined,
          });
        }
      }
    }

    // 1. Add Featured Profiles
    for (const p of FEATURED.profiles) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        list.push({
          ...p,
          bio: `Verified member (${p.id}). Dedicated professional with family values and balanced cultural lifestyle.`,
          education: p.profession.includes("Doctor") ? "MBBS, Colombo" : p.profession.includes("Engineer") ? "BSc Eng (Moratuwa)" : "Bachelor's Degree",
          aboutFamily: "Respected, traditional Sri Lankan family background with high social standing.",
          rasi: p.horoscope ? "Mesha" : undefined,
          nakshatra: p.horoscope ? "Aswida" : undefined,
        });
      }
    }

    // 2. Add Mock Profiles from Database
    for (const p of mockProfiles) {
      const code = p.code || p.id;
      if (!seenIds.has(code)) {
        seenIds.add(code);
        const isBride = p.gender === "female";
        const cCode = (p.country.toLowerCase() === "australia" ? "au" : p.country.toLowerCase() === "united kingdom" ? "gb" : "lk") as CountryCode;
        list.push({
          id: code,
          name: p.name,
          gender: isBride ? "bride" : "groom",
          age: p.age,
          height: p.height,
          profession: p.profession,
          religion: p.religion,
          location: `${p.location}, ${p.country}`,
          country: cCode,
          photo: p.photoUrl,
          horoscope: p.horoscopeAvailable,
          bio: p.bio,
          education: p.education,
          aboutFamily: p.aboutFamily,
          professionCategory: p.professionCategory,
          rasi: p.horoscopeAvailable ? "Simha" : undefined,
          nakshatra: p.horoscopeAvailable ? "Makha" : undefined,
        });
      }
    }

    // 3. Add Marquee Profiles
    for (const p of MARQUEE_PROFILES) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        list.push({
          id: p.id,
          gender: p.gender,
          age: p.age,
          height: p.height,
          profession: p.profession,
          religion: p.religion,
          location: `${p.city}, ${p.country.toUpperCase()}`,
          country: p.country,
          photo: p.avatar,
          horoscope: true,
          bio: `Verified proposal from ${p.city}. Values honesty and family harmony.`,
          education: "University Graduate",
          aboutFamily: "Respectable family settled in Sri Lanka.",
        });
      }
    }

    return list;
  }, []);

  // Extra list-card details (demo) per profile
  const extrasById = useMemo(
    () => Object.fromEntries(candidatePool.map((p) => {
      const extras = profileExtras(p.id, p.location, p.religion);
      return [p.id, {
        ...extras,
        district: p.district || extras.district,
        civil: p.details?.civilStatus || extras.civil,
        postedBy: p.details?.createdBy || extras.postedBy,
      }];
    })),
    [candidatePool]
  );

  // Filtered + sorted results
  /* Free plan: each search (filters / sort applied) uses one of the monthly searches.
     The sidebar edits `filters`; results follow `applied`, which only updates when a search is allowed. */
  const [applied, setApplied] = useState<{ filters: SearchFilters; sort: SortKey }>({ filters, sort });
  const { left: usageLeft, unlimited } = useUsage();
  const searchesLeft = usageLeft("searches");
  const viewsLeft = usageLeft("profileViews");
  useEffect(() => {
    if (applied.filters === filters && applied.sort === sort) return;
    const t = window.setTimeout(() => {
      if (hasSession() && allSearchLimitsExhausted()) return;
      if (consume("searches")) setApplied({ filters, sort });
      else {
        // limit reached → put the controls back to the last allowed search
        setFilters(applied.filters);
        setSort(applied.sort);
      }
    }, 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  const results = useMemo(() => {
    const f = applied.filters;
    const sort = applied.sort;
    const list = candidatePool.filter((p) => {
      if (p.gender !== f.lookingFor) return false;
      if (p.age < f.age[0] || p.age > f.age[1]) return false;
      const h = parseHeight(p.height);
      if (h !== null && (f.height[0] > HEIGHT_MIN || f.height[1] < HEIGHT_MAX) && (h < f.height[0] || h > f.height[1])) return false;
      if (f.withPhoto && !p.photo) return false;
      if (f.religions.length) {
        const rel = p.religion.toLowerCase();
        const known = ["buddhist", "catholic", "christian", "hindu", "muslim"];
        const ok = f.religions.some((r) =>
          r === "Other" ? !known.some((k) => rel.includes(k)) : rel.includes(r.toLowerCase()) || (r === "Muslim" && rel.includes("islam"))
        );
        if (!ok) return false;
      }
      if (f.countries.length && !f.countries.includes(p.country)) return false;
      const x = extrasById[p.id];
      if (f.district && x.district !== f.district) return false;
      if (f.professions.length && !f.professions.some((pr) => matchesProfession(p.profession, pr))) return false;
      const more = f.more;
      if (more.ethnicity?.length && !more.ethnicity.includes(x.ethnicity)) return false;
      if (more.civil?.length && !more.civil.includes(x.civil)) return false;
      if (more.education?.length && !more.education.includes(x.education)) return false;
      if (more.postedBy?.length && !more.postedBy.includes(x.postedBy)) return false;
      if (more.horoscope?.length && !p.horoscope) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "best") sorted.sort((a, b) => extrasById[b.id].match - extrasById[a.id].match);
    if (sort === "age-asc") sorted.sort((a, b) => a.age - b.age);
    if (sort === "age-desc") sorted.sort((a, b) => b.age - a.age);
    return sorted;
  }, [candidatePool, applied, extrasById]);

  // Promoted = the three best-matching results (demo); shown in their own band in grid view
  const promotedIds = useMemo(
    () => new Set([...results].sort((a, b) => extrasById[b.id].match - extrasById[a.id].match).slice(0, 3).map((p) => p.id)),
    [results, extrasById]
  );
  const promoted = results.filter((p) => promotedIds.has(p.id));
  const pool = view === "grid" ? results.filter((p) => !promotedIds.has(p.id)) : [...promoted, ...results.filter((p) => !promotedIds.has(p.id))];
  const size = PAGE_SIZE[view];
  const pageCount = Math.max(1, Math.ceil(pool.length / size));
  const current = pool.slice((page - 1) * size, page * size);
  const from = pool.length ? (page - 1) * size + 1 : 0;
  const to = Math.min(page * size, pool.length);

  // Back to page 1 whenever the filters, sort or view change
  useEffect(() => setPage(1), [applied, view]);

  // Open ?id= on load, and follow browser back / forward
  useEffect(() => {
    const openFromUrl = (id: string | null) => {
      if (hasSession() && allSearchLimitsExhausted()) return;
      if (!id || consumeProfileView(id)) setViewId(id);
    };
    openFromUrl(initialId || null);
    const onPop = () => {
      pushedRef.current = false;
      openFromUrl(new URLSearchParams(window.location.search).get("id"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [initialId]);
  const viewing = viewId ? candidatePool.find((c) => c.id.toLowerCase() === viewId.toLowerCase()) ?? null : null;

  // Lock page scroll while the mobile filter drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleOpenDetail = (p: FeaturedProfile) => {
    if (hasSession() && allSearchLimitsExhausted()) return;
    // Free plan: 5 different profiles a month (Upgrade prompt at the limit)
    if (!consumeProfileView(p.id)) return;
    const url = new URL(window.location.href);
    url.searchParams.set("id", p.id);
    // first open adds a history entry (browser Back returns to results); switching profiles replaces it
    if (viewId) window.history.replaceState(null, "", url);
    else {
      window.history.pushState(null, "", url);
      pushedRef.current = true;
    }
    setViewId(p.id);
  };
  const closeDetail = () => {
    if (fromHome || fromDashboard) {
      // came from Home / Dashboard: go back there (history keeps the scroll position); direct visit → open it
      const cameFromSite = document.referrer.startsWith(window.location.origin);
      if (cameFromSite && window.history.length > 1) window.history.back();
      else window.location.assign(fromHome ? "/" : "/dashboard#matches");
      return;
    }
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      window.history.replaceState(null, "", url);
    }
    setViewId(null);
  };

  const goToPage = (p: number) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const clearAll = () => setFilters(defaultFilters(filters.lookingFor));
  const sendInterest = (p: FeaturedProfile) => {
    if (!requireMember("send an interest")) return false;
    if (allSearchLimitsExhausted()) return false;
    if (!consume("interests")) return false;
    if (!saveInterest({ ...favouriteProfile(p), time: "Just now", note: "You sent an interest. Waiting for a reply." })) return false;
    toast.success("Interest sent", `${p.id} will be notified. You can chat once they accept.`);
    return true;
  };
  const saveSearch = () => toast.success("Search saved", "We’ll let you know when new matches join.");

  /* ---------- active filter chips ---------- */
  const chips: { key: string; label: string; value: React.ReactNode; icon?: React.ReactNode; remove: () => void }[] = [];
  const set = (patch: Partial<SearchFilters>) => setFilters((f) => ({ ...f, ...patch }));
  chips.push({ key: "for", label: "Looking for", value: filters.lookingFor === "bride" ? "Bride" : "Groom", remove: () => set({ lookingFor: filters.lookingFor === "bride" ? "groom" : "bride" }) });
  if (filters.age[0] !== AGE_MIN || filters.age[1] !== AGE_MAX)
    chips.push({ key: "age", label: "Age", value: `${filters.age[0]}–${filters.age[1]}`, remove: () => set({ age: [AGE_MIN, AGE_MAX] }) });
  if (filters.height[0] !== HEIGHT_MIN || filters.height[1] !== HEIGHT_MAX)
    chips.push({ key: "height", label: "Height", value: `${fmtHeight(filters.height[0])}–${fmtHeight(filters.height[1])}`, remove: () => set({ height: [HEIGHT_MIN, HEIGHT_MAX] }) });
  filters.religions.forEach((r) => chips.push({ key: `rel-${r}`, label: "Religion", value: r, remove: () => set({ religions: filters.religions.filter((x) => x !== r) }) }));
  filters.countries.forEach((c) =>
    chips.push({ key: `c-${c}`, label: "Country", icon: <Flag country={c} className="h-4 w-4" />, value: COUNTRY_LABEL[c], remove: () => set({ countries: filters.countries.filter((x) => x !== c) }) })
  );
  if (filters.district) chips.push({ key: "district", label: "District", value: filters.district, remove: () => set({ district: "" }) });
  filters.professions.forEach((p) => chips.push({ key: `p-${p}`, label: "Profession", value: p, remove: () => set({ professions: filters.professions.filter((x) => x !== p) }) }));
  (Object.keys(filters.more) as MoreKey[]).forEach((k) =>
    (filters.more[k] ?? []).forEach((v) =>
      chips.push({ key: `${k}-${v}`, label: MORE_SECTIONS[k].title.replace(/ \(.*\)/, ""), value: v, remove: () => set({ more: { ...filters.more, [k]: (filters.more[k] ?? []).filter((x) => x !== v) } }) })
    )
  );
  if (filters.verifiedOnly) chips.push({ key: "verified", label: "", value: "Verified only", remove: () => set({ verifiedOnly: false }) });
  if (filters.withPhoto) chips.push({ key: "photo", label: "", value: "With photo", remove: () => set({ withPhoto: false }) });
  const activeCount = chips.length;

  const countryTitle =
    filters.countries.length === 1 ? COUNTRY_LABEL[filters.countries[0]] : filters.countries.length > 1 ? "selected countries" : "Sri Lanka & abroad";
  const title = `${filters.lookingFor === "bride" ? "Brides" : "Grooms"} in ${filters.district || countryTitle}`;
  const listKey = `${view}-${page}-${sort}-${results.length}`;

  const sidebar = (
    <FiltersSidebar value={filters} onChange={setFilters} onClear={clearAll} onSave={saveSearch} />
  );

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-page-gradient text-ink">
      <HeartPattern className="-z-10" />
      <Navbar variant="light" />

      {viewing ? (
        <ProfileView
          results={results}
          selected={viewing}
          extrasById={extrasById}
          onSelect={handleOpenDetail}
          onBack={closeDetail}
          backTo={fromHome ? "home" : fromDashboard ? "dashboard" : "results"}
          onInterest={(p) => sendInterest(p)}
        />
      ) : (
      <>
      {/* Search band — breadcrumb */}
      <div className="container-page flex h-[68px] items-center">
        <nav aria-label="Breadcrumb" className="enter flex items-center gap-1.5 text-body-sm text-ink-tertiary">
          <Link href={signedIn ? "/dashboard" : "/"} className="transition-colors hover:text-brand-text">
            {signedIn ? "Dashboard" : "Home"}
          </Link>
          <ArrowRight2 size={14} color="currentColor" />
          <span aria-current="page" className="text-ink-secondary">
            Search proposals
          </span>
        </nav>
      </div>

      <main className="container-page flex flex-1 gap-8 pb-20">
        {/* Filters sidebar (desktop) */}
        <div className="enter hidden w-[296px] shrink-0 lg:block">{sidebar}</div>

        {/* Results */}
        <section ref={topRef} className="flex min-w-0 flex-1 scroll-mt-28 flex-col gap-6" aria-label="Results">
          {/* Results header */}
          <div className="enter flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-h3 text-ink md:text-h2">{title}</h1>
              <p className="text-body-sm text-ink-secondary">
                Showing {from}–{to} of{" "}
                <span key={results.length} className="inline-block animate-pop-in font-semibold text-brand-text">
                  {results.length.toLocaleString()} proposals
                </span>
              </p>
              {/* Free plan: what's left this month — searches + profile views (countdown) */}
              {signedIn && !unlimited && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {(
                    [
                      [searchesLeft, "search", "searches", SearchNormal1],
                      [viewsLeft, "profile view", "profile views", Eye],
                    ] as const
                  ).map(([n, one, many, Icon]) => (
                    <span
                      key={one}
                      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm", n === 0 ? "bg-error-bg text-error-fg" : "bg-premium-bg text-premium-fg")}
                    >
                      <Icon size={14} color="currentColor" />
                      {n === 0 ? `No free ${many} left` : <><b key={n} className="inline-block animate-pop-in">{n}</b> free {n === 1 ? one : many} left</>}
                    </span>
                  ))}
                  <span className="text-label-sm text-ink-tertiary">this month</span>
                  <Link href="/plans" className="text-label-sm font-bold text-premium-fg underline-offset-2 hover:underline">
                    Upgrade
                  </Link>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex h-10 items-center gap-2 rounded-[12px] border border-line bg-surface-card px-3.5 text-label-md text-ink transition-colors hover:border-brand lg:hidden"
              >
                <Setting4 size={18} color="currentColor" /> Filters
                {activeCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-label-sm text-ink-on-brand">{activeCount}</span>
                )}
              </button>
              <ViewToggle value={view} onChange={setView} />
              <SortDropdown value={sort} options={SORT_OPTIONS} onChange={setSort} />
            </div>
          </div>

          {/* Active filters */}
          <div className="enter flex flex-wrap items-center gap-2 rounded-[16px] border border-line bg-surface-card px-4 py-3 shadow-xs">
            <span className="mr-1 flex items-center gap-1.5 text-label-md text-ink-secondary">
              <TextalignLeft size={16} color="currentColor" /> Active filters ({activeCount})
            </span>
            {chips.map((c, i) => (
              <RemovableFilterChip
                key={c.key}
                label={c.label || undefined}
                value={c.value}
                icon={c.icon}
                onRemove={c.remove}
                className="animate-pop-in"
                style={{ animationDelay: `${Math.min(i, 10) * 25}ms`, animationFillMode: "backwards" }}
              />
            ))}
            {activeCount > 1 && (
              <button type="button" onClick={clearAll} className="text-label-md text-brand underline-offset-2 hover:underline">
                Clear all
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <EmptyResults onClear={clearAll} />
          ) : (
            <>
              {/* Promoted profiles — grid view, first page */}
              {view === "grid" && page === 1 && promoted.length > 0 && (
                <div className="reveal flex flex-col gap-4 rounded-[24px] border border-premium-line bg-premium-bg p-5">
                  <div className="flex items-center gap-2">
                    <Crown1 size={20} color="currentColor" className="text-premium-fg" />
                    <h2 className="flex-1 text-h6 text-premium-fg">Promoted profiles</h2>
                    <Link href={signedIn && !unlimited ? "/plans" : signedIn ? "/dashboard?promote=1" : "/register"} className="group text-label-md text-premium-fg">
                      Promote your profile <span className="inline-block transition-transform group-hover:translate-x-0.5">›</span>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {promoted.map((p, i) => (
                      <ProfileCard
                        key={p.id}
                        profile={p}
                        promoted
                        onView={handleOpenDetail}
                        // light sweep is staggered card to card
                        style={{ animation: `fade-up 500ms cubic-bezier(0.22,1,0.36,1) ${i * 80}ms backwards`, ["--promo-delay" as string]: `${i * 0.35}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {view === "grid" ? (
                <div key={listKey} className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                  {current.map((p, i) => (
                    <ProfileCard
                      key={p.id}
                      profile={p}
                      onView={handleOpenDetail}
                      style={{ animation: `fade-up 500ms cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 8) * 60}ms backwards` }}
                    />
                  ))}
                </div>
              ) : (
                <div key={listKey} className="flex flex-col gap-4">
                  {current.map((p, i) => (
                    <ProfileCardList
                      key={p.id}
                      profile={p}
                      extras={extrasById[p.id]}
                      bio={p.bio}
                      promoted={promotedIds.has(p.id)}
                      onView={handleOpenDetail}
                      onInterest={sendInterest}
                      style={{ animation: `fade-up 500ms cubic-bezier(0.22,1,0.36,1) ${i * 70}ms backwards` }}
                    />
                  ))}
                </div>
              )}

              {/* Pagination row */}
              <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
                <p className="text-body-sm text-ink-secondary">
                  Showing {from}–{to} of {pool.length.toLocaleString()}
                </p>
                <Pagination page={page} pageCount={pageCount} onChange={goToPage} />
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Back to top
                </Button>
              </div>
            </>
          )}
        </section>
      </main>

      </>
      )}

      <Footer />

      {/* Mobile / tablet filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[min(340px,92vw)] drawer-in flex-col overflow-y-auto bg-page p-3 shadow-xl [&>aside]:shrink-0">
            <div className="mb-2 flex justify-end">
              <button type="button" aria-label="Close filters" onClick={() => setDrawerOpen(false)} className="rounded-full p-2 text-ink-secondary hover:bg-surface-subtle">
                <CloseCircle size={24} color="currentColor" />
              </button>
            </div>
            {sidebar}
            <Button variant="primary" className="sticky bottom-0 mt-3 shrink-0 rounded-full shadow-lg" onClick={() => setDrawerOpen(false)}>
              Show {results.length} proposals
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}

function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex animate-fade-up flex-col items-center gap-3 rounded-[24px] border border-line bg-surface-card px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-subtle text-icon-brand">
        <SearchNormal1 size={30} color="currentColor" />
      </span>
      <h2 className="text-h5 text-ink">No proposals match these filters</h2>
      <p className="max-w-md text-body-md text-ink-secondary">Try a wider age range, another district, or remove a filter or two.</p>
      <Button variant="primary" className="mt-2 rounded-full" onClick={onClear}>
        Clear all filters
      </Button>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page-gradient">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
