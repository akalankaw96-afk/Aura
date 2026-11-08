"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight2,
  Book1,
  Briefcase,
  Cake,
  Heart,
  Location,
  People,
  Ruler,
  SearchNormal1,
  Teacher,
  TickCircle,
  Verify,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Flag } from "@/components/ui/Flag";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { REQUESTS, type InterestRequest } from "@/content/dashboard";

/**
 * Figma: 📊 Member Dashboard → Requests — Desktop 1440 (171:15511)
 *
 * Manage proposals and interests received, sent, or accepted.
 * Split view: selectable list on the left, full rich profile on the right.
 */
export default function RequestsPage() {
  const toast = useToast();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<"received" | "sent" | "accepted">("received");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("MP-24817");
  const [actionState, setActionState] = useState<Record<string, "accepted" | "declined">>({});
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({});

  const listByTab = useMemo(() => {
    return REQUESTS.filter((r) => r.tab === tab);
  }, [tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return listByTab;
    return listByTab.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.meta.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.profession.toLowerCase().includes(q)
    );
  }, [listByTab, search]);

  const selected = useMemo(() => {
    return filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? REQUESTS[0];
  }, [filtered, selectedId]);

  const counts = useMemo(
    () => ({
      received: REQUESTS.filter((r) => r.tab === "received").length,
      sent: REQUESTS.filter((r) => r.tab === "sent").length,
      accepted: REQUESTS.filter((r) => r.tab === "accepted").length,
    }),
    []
  );

  const handleAccept = (r: InterestRequest) => {
    setActionState((prev) => ({ ...prev, [r.id]: "accepted" }));
    toast.success(lang === "si" ? "කැමැත්ත පිළිගන්නා ලදී!" : "Interest accepted!", lang === "si" ? `ඔබට සහ ${r.name} වෙත දැන් පණිවිඩ හුවමාරු කරගත හැක.` : `You and ${r.name} can now exchange messages.`);
  };

  const handleDecline = (r: InterestRequest) => {
    setActionState((prev) => ({ ...prev, [r.id]: "declined" }));
    toast.info(lang === "si" ? "යෝජනාව ප්‍රතික්ෂේප විය" : "Request declined", lang === "si" ? `යෝජනා ලැයිස්තුවෙන් ඉවත් කරන ලදී.` : `Removed from active requests.`);
  };

  const toggleShortlist = (id: string) => {
    setShortlisted((prev) => {
      const next = !prev[id];
      if (next) toast.success(lang === "si" ? "ලැයිස්තුවට එක් කළා" : "Added to shortlist", lang === "si" ? "ඔබගේ සුරැකි ලැයිස්තුවට එක් විය." : "Saved to your shortlisted profiles.");
      else toast.info(lang === "si" ? "ලැයිස්තුවෙන් ඉවත් කළා" : "Removed from shortlist", lang === "si" ? "සුරැකි ලැයිස්තුවෙන් ඉවත් විය." : "Profile removed from shortlist.");
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="min-h-screen bg-page-gradient">
      <Navbar variant="member" />

      <main className="container-page pb-20 pt-6 lg:pt-8">
        {/* Breadcrumb & Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 text-body-sm text-ink-tertiary">
              <Link href="/dashboard" className="transition-colors hover:text-brand">
                {t.nav.dashboard}
              </Link>
              <span>/</span>
              <span className="font-semibold text-ink">{t.nav.requests}</span>
            </nav>
            <h1 className="text-h2 text-ink">{t.requests.title}</h1>
            <p className="mt-1 text-body-md text-ink-secondary">
              {t.requests.subtitle}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-full border border-line bg-surface-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setTab("received");
                setSearch("");
              }}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-label-md transition-all",
                tab === "received"
                  ? "bg-brand-gradient text-ink-on-brand shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              )}
            >
              <span>{t.requests.received}</span>
              <span
                className={cn(
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-label-sm",
                  tab === "received" ? "bg-white/20 text-white" : "bg-surface-subtle text-ink-secondary"
                )}
              >
                {counts.received}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("sent");
                setSearch("");
              }}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-label-md transition-all",
                tab === "sent"
                  ? "bg-brand-gradient text-ink-on-brand shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              )}
            >
              <span>{t.requests.sent}</span>
              <span
                className={cn(
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-label-sm",
                  tab === "sent" ? "bg-white/20 text-white" : "bg-surface-subtle text-ink-secondary"
                )}
              >
                {counts.sent}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("accepted");
                setSearch("");
              }}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-label-md transition-all",
                tab === "accepted"
                  ? "bg-brand-gradient text-ink-on-brand shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              )}
            >
              <span>{t.requests.accepted}</span>
              <span
                className={cn(
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-label-sm",
                  tab === "accepted" ? "bg-white/20 text-white" : "bg-surface-subtle text-ink-secondary"
                )}
              >
                {counts.accepted}
              </span>
            </button>
          </div>
        </div>

        {/* Split View */}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left Column: Request List */}
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-card p-4 shadow-sm">
            {/* Search Input */}
            <div className="flex h-11 items-center gap-2 rounded-md border border-line bg-surface-subtle px-3 transition-colors focus-within:border-brand-focus">
              <SearchNormal1 size={18} color="currentColor" className="shrink-0 text-icon-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.requests.searchPlaceholder}
                className="h-full w-full min-w-0 bg-transparent text-body-md text-ink placeholder:text-ink-disabled outline-none"
              />
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-body-sm text-ink-tertiary">
                  {lang === "si" ? "මෙම ටැබයේ යෝජනා හමු නොවීය." : "No requests found in this tab."}
                </div>
              ) : (
                filtered.map((item) => {
                  const isSelected = selected?.id === item.id;
                  const itemStatus = actionState[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                        isSelected
                          ? "border-brand bg-brand-subtle shadow-xs"
                          : "border-transparent hover:border-line hover:bg-surface-subtle"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.photo}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        {item.isNew && (
                          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface-card bg-brand" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-label-lg text-ink">
                            {item.name}
                            <Verify size={16} color="currentColor" variant="Bold" className="text-icon-brand" />
                          </span>
                          <span className="text-caption text-ink-tertiary">{item.time}</span>
                        </div>
                        <p className="truncate text-body-sm text-ink-secondary">{item.meta}</p>
                        {itemStatus && (
                          <span className="text-caption font-semibold text-brand-text capitalize">
                            {lang === "si" ? "තත්ත්වය" : "Status"}: {itemStatus === "accepted" ? (lang === "si" ? "පිළිගත්" : "Accepted") : (lang === "si" ? "ප්‍රතික්ෂේපිත" : "Declined")}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Profile Detail */}
          {selected && (
            <div className="flex flex-col gap-6 rounded-xl border border-line bg-surface-card p-6 shadow-sm">
              {/* Top Section: Photo + Header Info */}
              <div className="flex flex-col gap-6 md:flex-row">
                {/* Photo 280 × 340 */}
                <div className="relative aspect-[280/340] w-full max-w-[280px] shrink-0 overflow-hidden rounded-lg bg-surface-muted shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.photo}
                    alt={selected.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-3 top-3">
                    <span className="inline-flex h-[24px] items-center gap-1 rounded-full bg-surface-glass-strong px-2.5 text-label-sm text-ink-on-brand backdrop-blur-md">
                      <Verify size={14} color="currentColor" className="text-success-fg" /> {t.featured.verified}
                    </span>
                  </div>
                </div>

                {/* Info Column */}
                <div className="flex flex-1 flex-col gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-h2 text-ink">
                      {selected.name}, {selected.age}
                      <Verify size={22} color="currentColor" variant="Bold" className="text-icon-brand" />
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-body-md text-ink-secondary">
                      <Flag country={selected.country} className="h-4 w-5" />
                      {selected.location}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selected.badges.map((b) => (
                        <Badge key={b} tone={b.includes("Horoscope") ? "info" : "success"}>
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Interest Note Box */}
                  <div className="rounded-lg border border-brand/20 bg-brand-subtle p-4">
                    <div className="mb-1 flex items-center gap-1.5 text-label-sm text-brand-text">
                      <Heart size={16} color="currentColor" variant="Bold" />
                      <span>{t.requests.interestNote} · {selected.time}</span>
                    </div>
                    <p className="text-body-sm italic text-ink">{selected.note}</p>
                  </div>

                  {/* 8 Attribute Tiles */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                    <DetailTile icon={<Cake size={18} color="currentColor" />} label={t.hero.age} value={`${selected.age} ${lang === "si" ? "වසර" : "yrs"}`} />
                    <DetailTile icon={<Ruler size={18} color="currentColor" />} label={lang === "si" ? "උස" : "Height"} value={selected.height} />
                    <DetailTile icon={<Book1 size={18} color="currentColor" />} label={t.hero.religion} value={selected.religion} />
                    <DetailTile icon={<People size={18} color="currentColor" />} label={lang === "si" ? "ජාතිය" : "Ethnicity"} value={selected.ethnicity} />
                    <DetailTile icon={<Briefcase size={18} color="currentColor" />} label={lang === "si" ? "රැකියාව" : "Profession"} value={selected.profession} />
                    <DetailTile icon={<Teacher size={18} color="currentColor" />} label={lang === "si" ? "අධ්‍යාපනය" : "Education"} value={selected.education} />
                    <DetailTile icon={<Heart size={18} color="currentColor" />} label={lang === "si" ? "විවාහක තත්ත්වය" : "Civil status"} value={selected.civilStatus} />
                    <DetailTile icon={<Location size={18} color="currentColor" />} label={lang === "si" ? "පදිංචිය" : "Living in"} value={selected.livingIn} />
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="rounded-lg border border-line bg-surface-subtle p-5">
                <h3 className="mb-2 text-label-lg font-bold text-ink">
                  {lang === "si" ? `${selected.name.split(" ")[0]} පිළිබඳව` : `About ${selected.name.split(" ")[0]}`}
                </h3>
                <p className="text-body-md text-ink-secondary">{selected.about}</p>
              </div>

              {/* Divider & Action Bar */}
              <div className="flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Shortlist profile"
                    onClick={() => toggleShortlist(selected.id)}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                      shortlisted[selected.id]
                        ? "border-brand bg-brand-subtle text-brand"
                        : "border-line bg-surface-card text-ink-tertiary hover:border-brand hover:text-brand"
                    )}
                  >
                    <Heart size={20} color="currentColor" variant={shortlisted[selected.id] ? "Bold" : "Linear"} />
                  </button>
                  <span className="text-body-xs text-ink-tertiary">
                    {lang === "si"
                      ? "කැමැත්ත පිළිගැනීමෙන් දුරකථන අංක හුවමාරු වන අතර පණිවිඩ යැවීම සක්‍රිය වේ."
                      : "Accepting will exchange contact details & unlock private messaging."}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {actionState[selected.id] ? (
                    <span className="flex items-center gap-1.5 text-label-md text-success-fg">
                      <TickCircle size={20} color="currentColor" /> {actionState[selected.id] === "accepted" ? (lang === "si" ? "කැමැත්ත පිළිගන්නා ලදී" : "Interest Accepted") : (lang === "si" ? "ප්‍රතික්ෂේප විය" : "Declined")}
                    </span>
                  ) : (
                    <>
                      <Button variant="outline" size="md" onClick={() => handleDecline(selected)}>
                        {t.requests.decline}
                      </Button>
                      <Button variant="primary" size="md" onClick={() => handleAccept(selected)}>
                        {t.requests.acceptInterest}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DetailTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-line bg-surface-card p-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-icon-brand">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-caption text-ink-tertiary">{label}</p>
        <p className="truncate text-body-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
