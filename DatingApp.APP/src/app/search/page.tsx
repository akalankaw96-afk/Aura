"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SearchNormal1,
  Filter,
  CloseCircle,
  Refresh2,
  Verify,
  Star1,
  Heart,
  ArrowRight2,
  User,
  Briefcase,
  Location,
  NoteText
} from "iconsax-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { ProfileDetailModal, type ProposalDetail } from "@/components/profile/ProfileDetailModal";
import { useToast } from "@/components/ui/Toast";
import { HeartPattern } from "@/components/ui/Decor";
import { FEATURED, MARQUEE_PROFILES, type FeaturedProfile } from "@/content/home";
import { mockProfiles } from "@/data/mockData";
import { apiService } from "@/services/api";
import type { Profile } from "@/types";
import type { CountryCode } from "@/components/ui/Flag";

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
}

const RELIGIONS = ["All", "Buddhist", "Hindu", "Catholic", "Christian", "Muslim"];
const PROFESSIONS = [
  "All",
  "Doctors & Healthcare",
  "Engineers & IT",
  "Teachers & Academia",
  "Finance & Banking",
  "Legal & Law",
  "Business & Executives",
  "Overseas / Expats",
];
const LOCATIONS = [
  "All",
  "Colombo",
  "Kandy",
  "Galle",
  "Gampaha",
  "Kurunegala",
  "Jaffna",
  "Kalutara",
  "Matara",
  "Australia (Melbourne/Sydney)",
  "United Kingdom (London)",
  "Canada (Toronto)",
  "Middle East (Doha/Dubai)",
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  // Query parameter initializers
  const queryFor = searchParams.get("for")?.toLowerCase();
  const initialGender = queryFor === "bride" ? "bride" : queryFor === "groom" ? "groom" : "all";
  const initialCategory = searchParams.get("category") || "";
  const initialMinAge = searchParams.get("min") || "18";
  const initialMaxAge = searchParams.get("max") || "60";
  const initialId = searchParams.get("id") || "";

  // Filter States
  const [genderFilter, setGenderFilter] = useState<"all" | "bride" | "groom">(initialGender as any);
  const [minAge, setMinAge] = useState<number>(Number(initialMinAge) || 18);
  const [maxAge, setMaxAge] = useState<number>(Number(initialMaxAge) || 60);
  const [selectedReligion, setSelectedReligion] = useState<string>("All");
  const [selectedProfession, setSelectedProfession] = useState<string>("All");
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [horoscopeOnly, setHoroscopeOnly] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [activeModalProfile, setActiveModalProfile] = useState<ProposalDetail | null>(null);

  // Live Database Connectivity State
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [liveDbProfiles, setLiveDbProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetch("http://localhost:5000/api/profiles", { cache: "no-store" })
      .then(async (res) => {
        if (res.ok) {
          const data: Profile[] = await res.json();
          if (isMounted) {
            setDbStatus("connected");
            setLiveDbProfiles(data);
          }
        } else {
          if (isMounted) setDbStatus("offline");
        }
      })
      .catch(() => {
        if (isMounted) setDbStatus("offline");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync category parameter if provided
  useEffect(() => {
    if (initialCategory) {
      if (initialCategory.toLowerCase().includes("teacher")) {
        setSelectedProfession("Teachers & Academia");
        setGenderFilter("bride");
      } else if (initialCategory.toLowerCase().includes("doctor") || initialCategory.toLowerCase().includes("health")) {
        setSelectedProfession("Doctors & Healthcare");
      } else if (initialCategory.toLowerCase().includes("engineer") || initialCategory.toLowerCase().includes("it")) {
        setSelectedProfession("Engineers & IT");
      } else if (initialCategory.toLowerCase().includes("overseas") || initialCategory.toLowerCase().includes("expat")) {
        setSelectedProfession("Overseas / Expats");
      } else if (initialCategory.toLowerCase().includes("kandy")) {
        setSelectedLocation("Kandy");
      } else if (initialCategory.toLowerCase().includes("colombo")) {
        setSelectedLocation("Colombo");
      } else {
        setSearchKeyword(initialCategory);
      }
    }
  }, [initialCategory]);

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
          const cCode = (p.country?.toLowerCase() === "australia" ? "au" : p.country?.toLowerCase() === "united kingdom" ? "gb" : "lk") as CountryCode;
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

  // Check initial id query parameter to auto-open modal
  useEffect(() => {
    if (initialId) {
      const match = candidatePool.find((c) => c.id.toLowerCase() === initialId.toLowerCase());
      if (match) {
        handleOpenDetail(match);
      }
    }
  }, [initialId, candidatePool]);

  // Filtered List
  const filteredProfiles = useMemo(() => {
    return candidatePool.filter((p) => {
      // Gender filter
      if (genderFilter !== "all" && p.gender !== genderFilter) return false;

      // Age range
      if (p.age < minAge || p.age > maxAge) return false;

      // Religion
      if (selectedReligion !== "All" && !p.religion.toLowerCase().includes(selectedReligion.toLowerCase())) {
        return false;
      }

      // Profession Category
      if (selectedProfession !== "All") {
        const prof = p.profession.toLowerCase();
        if (selectedProfession === "Doctors & Healthcare" && !prof.includes("doctor") && !prof.includes("nurse") && !prof.includes("pharmacist") && !prof.includes("dental")) {
          return false;
        }
        if (selectedProfession === "Engineers & IT" && !prof.includes("engineer") && !prof.includes("software") && !prof.includes("tech")) {
          return false;
        }
        if (selectedProfession === "Teachers & Academia" && !prof.includes("teacher") && !prof.includes("lecturer") && !prof.includes("bed")) {
          return false;
        }
        if (selectedProfession === "Finance & Banking" && !prof.includes("accountant") && !prof.includes("bank") && !prof.includes("finance")) {
          return false;
        }
        if (selectedProfession === "Overseas / Expats" && p.country === "lk") {
          return false;
        }
      }

      // Location
      if (selectedLocation !== "All") {
        const loc = p.location.toLowerCase();
        if (selectedLocation.includes("Australia") && !loc.includes("australia") && !loc.includes("melbourne") && p.country !== "au") {
          return false;
        }
        if (selectedLocation.includes("United Kingdom") && !loc.includes("uk") && !loc.includes("london") && p.country !== "gb") {
          return false;
        }
        if (selectedLocation.includes("Canada") && !loc.includes("canada") && !loc.includes("toronto") && p.country !== "ca") {
          return false;
        }
        if (selectedLocation.includes("Middle East") && !loc.includes("doha") && !loc.includes("dubai") && p.country !== "qa") {
          return false;
        }
        if (!selectedLocation.includes("(") && !loc.includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // Horoscope
      if (horoscopeOnly && !p.horoscope) return false;

      // Keyword search
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matches =
          p.id.toLowerCase().includes(kw) ||
          p.profession.toLowerCase().includes(kw) ||
          p.location.toLowerCase().includes(kw) ||
          p.religion.toLowerCase().includes(kw) ||
          (p.bio && p.bio.toLowerCase().includes(kw)) ||
          (p.education && p.education.toLowerCase().includes(kw));
        if (!matches) return false;
      }

      return true;
    });
  }, [candidatePool, genderFilter, minAge, maxAge, selectedReligion, selectedProfession, selectedLocation, horoscopeOnly, searchKeyword]);

  const handleOpenDetail = (p: CandidateProposal) => {
    setActiveModalProfile({
      id: p.id,
      name: p.name,
      code: p.id,
      gender: p.gender,
      age: p.age,
      height: p.height,
      profession: p.profession,
      education: p.education || "Bachelor's Degree",
      location: p.location,
      country: p.country.toUpperCase(),
      religion: p.religion,
      photo: p.photo,
      bio: p.bio,
      aboutFamily: p.aboutFamily,
      horoscope: p.horoscope,
      rasi: p.rasi,
      nakshatra: p.nakshatra,
    });
  };

  const handleResetFilters = () => {
    setGenderFilter("all");
    setMinAge(18);
    setMaxAge(60);
    setSelectedReligion("All");
    setSelectedProfession("All");
    setSelectedLocation("All");
    setVerifiedOnly(false);
    setHoroscopeOnly(false);
    setSearchKeyword("");
    router.push("/search");
  };

  return (
    <div className="relative isolate min-h-screen bg-page-gradient text-ink flex flex-col">
      <HeartPattern className="-z-10" />
      <Navbar variant="light" />

      {/* Hero Search Header */}
      <section className="border-b border-line bg-surface-card/60 backdrop-blur-md pt-8 pb-10 shadow-sm">
        <div className="container-page flex flex-col gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 text-label-sm text-brand-text">
              <Verify size={16} color="currentColor" />
              <span>Sri Lanka’s Verified Marriage Directory</span>
            </div>
            <h1 className="text-h2 md:text-display-sm text-ink font-extrabold tracking-tight">
              Find Genuine Proposals
            </h1>
            <p className="text-body-md text-ink-secondary">
              Explore photo-verified proposals across Sri Lanka and expats abroad. Contact details unlock only upon mutual consent.
            </p>
          </div>

          {/* Quick Gender Chips & Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div role="tablist" aria-label="Gender filter" className="flex items-center gap-2">
              <Chip
                role="tab"
                aria-selected={genderFilter === "all"}
                selected={genderFilter === "all"}
                avatar="/brand/couple.png"
                onClick={() => setGenderFilter("all")}
              >
                All Proposals
              </Chip>
              <Chip
                role="tab"
                aria-selected={genderFilter === "bride"}
                selected={genderFilter === "bride"}
                avatar="/brand/bride.png"
                onClick={() => setGenderFilter("bride")}
              >
                Brides Only
              </Chip>
              <Chip
                role="tab"
                aria-selected={genderFilter === "groom"}
                selected={genderFilter === "groom"}
                avatar="/brand/groom.png"
                onClick={() => setGenderFilter("groom")}
              >
                Grooms Only
              </Chip>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {dbStatus === "connected" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  SQL Server: AuraMatrimonyDb (Live)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 shadow-sm" title="API server is stopped. Showing resilient local fallback dataset.">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  API Offline: Fallback Dataset
                </span>
              )}

              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-card px-4 py-1.5 text-label-md text-ink-secondary shadow-sm">
                <span>Showing <strong>{filteredProfiles.length}</strong> verified proposals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Filters Sidebar + Proposals Grid */}
      <main className="container-page flex-1 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 flex flex-col gap-6">
            <div className="sticky top-28 rounded-2xl border border-line bg-surface-card p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="flex items-center gap-2 text-h6 font-bold text-ink">
                  <Filter size={20} color="currentColor" className="text-icon-brand" />
                  Filter Proposals
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-label-sm text-brand-link hover:underline"
                >
                  <Refresh2 size={14} color="currentColor" /> Reset
                </button>
              </div>

              {/* Keyword Search */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm text-ink-secondary">Keyword Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search by ID, job, city..."
                    className="w-full h-10 rounded-lg border border-line bg-surface-card px-9 text-body-sm text-ink placeholder:text-ink-tertiary focus:border-brand-focus focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <SearchNormal1 size={16} color="currentColor" className="absolute left-3 top-3 text-ink-tertiary" />
                  {searchKeyword && (
                    <button
                      type="button"
                      onClick={() => setSearchKeyword("")}
                      className="absolute right-3 top-3 text-ink-tertiary hover:text-ink"
                    >
                      <CloseCircle size={16} color="currentColor" />
                    </button>
                  )}
                </div>
              </div>

              {/* Age Range Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-label-sm">
                  <span className="text-ink-secondary">Age Range</span>
                  <span className="font-semibold text-ink">{minAge} – {maxAge} years</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-ink-tertiary">Min Age</span>
                    <select
                      value={minAge}
                      onChange={(e) => setMinAge(Number(e.target.value))}
                      className="w-full h-9 rounded-md border border-line bg-surface-card px-2 text-body-sm text-ink focus:border-brand-focus focus:outline-none"
                    >
                      {[18, 21, 24, 27, 30, 35, 40, 45].map((a) => (
                        <option key={a} value={a}>{a} yrs</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[11px] text-ink-tertiary">Max Age</span>
                    <select
                      value={maxAge}
                      onChange={(e) => setMaxAge(Number(e.target.value))}
                      className="w-full h-9 rounded-md border border-line bg-surface-card px-2 text-body-sm text-ink focus:border-brand-focus focus:outline-none"
                    >
                      {[25, 30, 35, 40, 45, 50, 60].map((a) => (
                        <option key={a} value={a}>{a} yrs</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Religion Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm text-ink-secondary">Religion / Faith</label>
                <select
                  value={selectedReligion}
                  onChange={(e) => setSelectedReligion(e.target.value)}
                  className="w-full h-10 rounded-lg border border-line bg-surface-card px-3 text-body-sm text-ink focus:border-brand-focus focus:outline-none"
                >
                  {RELIGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Profession Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm text-ink-secondary">Profession Sector</label>
                <select
                  value={selectedProfession}
                  onChange={(e) => setSelectedProfession(e.target.value)}
                  className="w-full h-10 rounded-lg border border-line bg-surface-card px-3 text-body-sm text-ink focus:border-brand-focus focus:outline-none"
                >
                  {PROFESSIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* District & Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-sm text-ink-secondary">District / Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full h-10 rounded-lg border border-line bg-surface-card px-3 text-body-sm text-ink focus:border-brand-focus focus:outline-none"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Checkbox Toggles */}
              <div className="flex flex-col gap-2 pt-2 border-t border-line">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={horoscopeOnly}
                    onChange={(e) => setHoroscopeOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                  />
                  <span className="text-body-sm text-ink flex items-center gap-1">
                    <Star1 size={14} color="currentColor" className="text-gold-500" /> Horoscope available
                  </span>
                </label>
              </div>
            </div>
          </aside>

          {/* Proposals Grid Column */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {filteredProfiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProfiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onView={handleOpenDetail}
                    onInterest={() => {
                      toast.success(
                        "Interest Sent!",
                        `${profile.id} has been notified. You will be alerted as soon as they respond.`
                      );
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line bg-surface-card/60 p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-subtle text-icon-brand">
                  <SearchNormal1 size={32} color="currentColor" />
                </div>
                <h3 className="text-h4 text-ink font-bold">No Matching Proposals Found</h3>
                <p className="max-w-md text-body-md text-ink-secondary">
                  We could not find any proposals matching your exact search filters. Try broadening your age range or clearing specific profession filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 flex h-11 items-center gap-2 rounded-full bg-brand-gradient px-6 text-button-md text-ink-on-brand shadow-sm hover:shadow-glow"
                >
                  <Refresh2 size={18} color="currentColor" /> Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Candidate Profile Detail Inspection Modal */}
      {activeModalProfile && (
        <ProfileDetailModal
          profile={activeModalProfile}
          onClose={() => setActiveModalProfile(null)}
          onConnect={(p, note) => {
            toast.success("Interest Sent!", `Your introductory request has been delivered to ${p.id}.`);
          }}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-page-gradient">
          <div className="flex flex-col items-center gap-3 text-ink-secondary">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            <p className="text-body-md font-medium">Loading marriage proposals...</p>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}