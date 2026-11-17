"use client";

/**
 * Staff back office API (S02-T11) — Admin / Moderator only; the API enforces it (Staff / Admin policies).
 *   /api/moderation/*  queue, review details, decisions, new-photo queue
 *   /api/admin/*       staff list, find by mobile, change role (Admin only)
 *   /api/kyc/documents/{id}/file   ID documents (each staff view is logged by the API)
 *   /api/moderation/reports        member reports — dismiss / handled / suspend (S03-T08)
 */
import { API_BASE_URL, apiJson, apiRequest, toApiError } from "@/lib/http";
import type { KycDocumentDto, PhotoDto, ReviewFlag } from "@/lib/media";
import type { Profile } from "@/types";

export interface QueueItem {
  profileId: string;
  code: string;
  fullName: string;
  gender: string;
  age: number;
  status: "Submitted" | "Resubmitted";
  submittedAt?: string | null;
  mainPhotoRef?: string | null;
  pendingPhotos: number;
}

export interface ReviewLog {
  action: string;
  moderatorName: string;
  note?: string | null;
  createdAt: string;
}

export interface ProfileReview {
  profile: Profile;
  status: string;
  submittedAt?: string | null;
  phoneNumber: string;
  email?: string | null;
  dateOfBirth?: string | null;
  photos: PhotoDto[];
  documents: KycDocumentDto[];
  openFlags: ReviewFlag[];
  history: ReviewLog[];
}

export interface PendingPhoto {
  photoId: string;
  ref: string;
  profileId: string;
  profileCode: string;
  fullName: string;
  createdAt: string;
}

export interface StaffUser {
  userId: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  role: "Admin" | "Moderator" | "Member";
}

/** Field keys the moderator can flag (same list as the API's ModerationService.FlaggableFields). */
export const FLAGGABLE_FIELDS: { field: string; label: string }[] = [
  { field: "photo", label: "Main photo" },
  { field: "name", label: "Name" },
  { field: "dob", label: "Date of birth" },
  { field: "gender", label: "Gender" },
  { field: "about", label: "About you" },
  { field: "profession", label: "Profession" },
  { field: "education", label: "Education" },
  { field: "religion", label: "Religion" },
  { field: "location", label: "Location" },
  { field: "documents", label: "ID document" },
  { field: "selfie", label: "Selfie" },
  { field: "other", label: "Other" },
];

const post = (path: string, json: unknown, fallbackError: string) => apiJson<void>(path, { method: "POST", json, fallbackError });

export const getQueue = () => apiJson<QueueItem[]>("/moderation/queue", { cache: "no-store" });
export const getProfileReview = (profileId: string) =>
  apiJson<ProfileReview>(`/moderation/profiles/${encodeURIComponent(profileId)}`, { cache: "no-store" });
export const approveProfile = (profileId: string, note?: string) =>
  post(`/moderation/profiles/${encodeURIComponent(profileId)}/approve`, { note: note || null }, "We couldn’t approve this profile.");
export const requestChanges = (profileId: string, flags: { field: string; reason: string }[], note?: string) =>
  post(`/moderation/profiles/${encodeURIComponent(profileId)}/request-changes`, { flags, note: note || null }, "We couldn’t send the changes.");
export const suspendProfile = (profileId: string, note: string) =>
  post(`/moderation/profiles/${encodeURIComponent(profileId)}/suspend`, { note }, "We couldn’t suspend this profile.");
export const reinstateProfile = (profileId: string, note?: string) =>
  post(`/moderation/profiles/${encodeURIComponent(profileId)}/reinstate`, { note: note || null }, "We couldn’t reinstate this profile.");

export const getPendingPhotos = () => apiJson<PendingPhoto[]>("/moderation/photos/pending", { cache: "no-store" });
export const approvePhoto = (photoId: string) => post(`/moderation/photos/${encodeURIComponent(photoId)}/approve`, {}, "We couldn’t approve the photo.");
export const rejectPhoto = (photoId: string, reason: string) =>
  post(`/moderation/photos/${encodeURIComponent(photoId)}/reject`, { reason }, "We couldn’t reject the photo.");

export const getStaff = () => apiJson<StaffUser[]>("/admin/staff", { cache: "no-store" });
export const findUserByPhone = (phone: string) =>
  apiJson<StaffUser>(`/admin/users?phone=${encodeURIComponent(phone)}`, { cache: "no-store", fallbackError: "No member with that number." });
export const changeRole = (userId: string, role: "Member" | "Moderator") =>
  apiJson<StaffUser>(`/admin/users/${encodeURIComponent(userId)}/role`, { method: "PUT", json: { role }, fallbackError: "We couldn’t change the role." });

/** URL of an ID document (needs the staff token — load with useApiImage or openDocument). */
export const documentUrl = (id: string) => `${API_BASE_URL}/kyc/documents/${encodeURIComponent(id)}/file`;

/** Opens a document (image or PDF) in a new tab via a temporary blob URL. Each open is logged by the API. */
export async function openDocument(id: string): Promise<void> {
  const tab = window.open("", "_blank");
  const res = await apiRequest(documentUrl(id), { cache: "no-store" });
  if (!res.ok) {
    tab?.close();
    throw await toApiError(res, "We couldn’t open this document.");
  }
  const url = URL.createObjectURL(await res.blob());
  if (tab) tab.location.href = url;
  else window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ---------- reports (S03-T08) ---------- */

export interface ReportItem {
  id: string;
  reason: "Scam" | "Inappropriate" | "FakeProfile" | "Other";
  details?: string | null;
  conversationId?: string | null;
  status: "Open" | "Dismissed" | "Actioned";
  createdAt: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  staffNote?: string | null;
  reporterName: string;
  reporterProfileId?: string | null;
  reportedProfileId: string;
  reportedName: string;
  reportedCode: string;
  reportedPhotoUrl: string;
  reportedStatus: string;
  openReportsOnProfile: number;
  totalReportsOnProfile: number;
}

export const getReports = (status: "open" | "closed" | "all" = "open") =>
  apiJson<ReportItem[]>(`/moderation/reports?status=${status}`, { cache: "no-store" });

/** dismiss · action (handled, no suspension) · suspend (note required; closes all the member's open reports). */
export const resolveReport = (id: string, action: "dismiss" | "action" | "suspend", note?: string) =>
  apiJson<ReportItem>(`/moderation/reports/${encodeURIComponent(id)}/resolve`, {
    method: "POST",
    json: { action, note: note || null },
    fallbackError: "We couldn’t update this report.",
  });
