"use client";

import { apiJson } from "@/lib/http";
import { resolvePhoto } from "@/content/avatars";
import type { Profile } from "@/types";

/**
 * Sprint 03 API calls: server search, profile views, interests, shortlist, saved searches, blocks, reports
 * and the admin's plan limits. Profile photos come back as refs ("photo:<id>", "avatar:<id>") and are resolved here.
 */

const withPhoto = (p: Profile): Profile => (p ? { ...p, photoUrl: resolvePhoto(p.photoUrl) } : p);

/* ---------- search (S03-T01) ---------- */

export interface SearchQuery {
  gender?: "female" | "male";
  ageFrom?: number;
  ageTo?: number;
  religion?: string;
  community?: string;
  location?: string;
  country?: string;
  profession?: string;
  horoscope?: boolean;
  q?: string;
  sort?: "newest" | "ageAsc" | "ageDesc";
  /** the app narrows the results with its own filters — counts as a search */
  filtered?: boolean;
  page?: number;
  pageSize?: number;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toParams(q: SearchQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(q)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

/** GET /api/profiles/search — a member's filtered first page counts as one search (402 at the limit). */
export async function searchProfiles(q: SearchQuery): Promise<Paged<Profile>> {
  const page = await apiJson<Paged<Profile>>(`/profiles/search?${toParams(q)}`, {
    cache: "no-store",
    fallbackError: "We couldn’t load profiles. Please try again.",
  });
  return { ...page, items: page.items.map(withPhoto) };
}

/** GET /api/profiles/{id} — opening a profile records a view (402 at the limit, 404 when hidden or gone). */
export async function openProfile(profileId: string): Promise<Profile> {
  return withPhoto(await apiJson<Profile>(`/profiles/${encodeURIComponent(profileId)}`, {
    cache: "no-store",
    fallbackError: "We couldn’t open this profile. Please try again.",
  }));
}

/* ---------- profile views (S03-T04) ---------- */

export interface ProfileViewItem { profile: Profile; lastViewedAt: string; viewCount: number }
export interface ProfileViewers { total: number; locked: boolean; planId: string; items: ProfileViewItem[] }

export async function getViewers(): Promise<ProfileViewers> {
  const v = await apiJson<ProfileViewers>("/profile-views/viewers", { cache: "no-store" });
  return { ...v, items: v.items.map((i) => ({ ...i, profile: withPhoto(i.profile) })) };
}

/* ---------- interests (S03-T05) ---------- */

export interface Interest {
  id: string;
  direction: "sent" | "received";
  status: "Pending" | "Accepted" | "Declined" | "Withdrawn";
  note?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  profile: Profile;
}

export async function listInterests(box: "received" | "sent" | "matched"): Promise<Interest[]> {
  const list = await apiJson<Interest[]>(`/match-requests/${box}`, { cache: "no-store" });
  return list.map((i) => ({ ...i, profile: withPhoto(i.profile) }));
}

export const sendInterestTo = (receiverProfileId: string, note?: string) =>
  apiJson<{ id: string }>("/match-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiverProfileId, note }),
    fallbackError: "We couldn’t send your interest. Please try again.",
  });

export const respondInterest = (id: string, accept: boolean) =>
  apiJson<{ message: string }>(`/match-requests/${encodeURIComponent(id)}/respond`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accept }),
    fallbackError: "We couldn’t update this interest. Please try again.",
  });

export const withdrawInterest = (id: string) =>
  apiJson<{ message: string }>(`/match-requests/${encodeURIComponent(id)}/withdraw`, {
    method: "PUT",
    fallbackError: "We couldn’t withdraw this interest. Please try again.",
  });

/* ---------- shortlist + saved searches (S03-T06) ---------- */

export interface ShortlistItem { profile: Profile; addedAt: string }

export async function getShortlist(): Promise<ShortlistItem[]> {
  const list = await apiJson<ShortlistItem[]>("/shortlist", { cache: "no-store" });
  return list.map((i) => ({ ...i, profile: withPhoto(i.profile) }));
}
export const addToShortlist = (profileId: string) =>
  apiJson<void>(`/shortlist/${encodeURIComponent(profileId)}`, { method: "PUT", fallbackError: "We couldn’t save this profile." });
export const removeFromShortlist = (profileId: string) =>
  apiJson<void>(`/shortlist/${encodeURIComponent(profileId)}`, { method: "DELETE", fallbackError: "We couldn’t remove this profile." });

export interface SavedSearch { id: string; name: string; filters: SearchQuery; createdAt: string }

export const getSavedSearches = () => apiJson<SavedSearch[]>("/saved-searches", { cache: "no-store" });
export const saveSearch = (name: string, filters: SearchQuery) =>
  apiJson<SavedSearch>("/saved-searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, filters }),
    fallbackError: "We couldn’t save this search.",
  });
export const deleteSavedSearch = (id: string) =>
  apiJson<void>(`/saved-searches/${encodeURIComponent(id)}`, { method: "DELETE", fallbackError: "We couldn’t delete this search." });

/* ---------- block + report (S03-T07) ---------- */

export interface BlockedMember { profileId: string; name: string; photoUrl: string; reason?: string | null; blockedAt: string }

export async function getBlocked(): Promise<BlockedMember[]> {
  const list = await apiJson<BlockedMember[]>("/blocks", { cache: "no-store" });
  return list.map((b) => ({ ...b, photoUrl: resolvePhoto(b.photoUrl) }));
}
export const blockMember = (profileId: string, reason?: string) =>
  apiJson<void>(`/blocks/${encodeURIComponent(profileId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason || null }),
    fallbackError: "We couldn’t block this member. Please try again.",
  });
export const unblockMember = (profileId: string) =>
  apiJson<void>(`/blocks/${encodeURIComponent(profileId)}`, { method: "DELETE", fallbackError: "We couldn’t unblock this member." });

export type ReportReason = "Scam" | "Inappropriate" | "FakeProfile" | "Other";

/** The block dialog's reasons → report reasons. */
export function reportReasonFor(label: string): ReportReason {
  const l = label.toLowerCase();
  if (/money|bank/.test(l)) return "Scam";
  if (/rude|inappropriate/.test(l)) return "Inappropriate";
  if (/fake|misleading/.test(l)) return "FakeProfile";
  return "Other";
}

export const reportMember = (profileId: string, reason: ReportReason, details?: string, conversationId?: string) =>
  apiJson<{ id: string }>("/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, reason, details: details || null, conversationId: conversationId || null }),
    fallbackError: "We couldn’t send your report. Please try again.",
  });

/* ---------- admin: plan limits (S03-T02) ---------- */

export interface PlanLimit { planId: "free" | "gold" | "platinum"; feature: "Search" | "ProfileView" | "Interest" | "NewChat"; monthlyLimit: number | null; updatedAt?: string | null }

export const getPlanLimits = () => apiJson<PlanLimit[]>("/admin/plan-limits", { cache: "no-store" });
export const updatePlanLimits = (limits: Pick<PlanLimit, "planId" | "feature" | "monthlyLimit">[]) =>
  apiJson<PlanLimit[]>("/admin/plan-limits", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limits }),
    fallbackError: "We couldn’t save the limits. Please try again.",
  });

/* ---------- dashboard summary (S03-T09) ---------- */

export interface DashboardConversation {
  conversationId: string;
  partnerProfileId: string;
  partnerName: string;
  partnerPhotoUrl: string;
  partnerOnline: boolean;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface DashboardSummary {
  profileViewers: number;
  profileViewersThisWeek: number;
  viewersLocked: boolean;
  recentViewers: ProfileViewItem[];
  interestsReceived: number;
  interestsWaiting: number;
  interestsSentWaiting: number;
  matches: number;
  shortlistedBy: number;
  unreadMessages: number;
  unreadChats: number;
  recentConversations: DashboardConversation[];
}

/** GET /api/me/dashboard — everything the dashboard shows in one call. */
export async function getDashboard(): Promise<DashboardSummary> {
  const d = await apiJson<DashboardSummary>("/me/dashboard", { cache: "no-store" });
  return {
    ...d,
    recentViewers: d.recentViewers.map((v) => ({ ...v, profile: withPhoto(v.profile) })),
    recentConversations: d.recentConversations.map((c) => ({ ...c, partnerPhotoUrl: resolvePhoto(c.partnerPhotoUrl) })),
  };
}
