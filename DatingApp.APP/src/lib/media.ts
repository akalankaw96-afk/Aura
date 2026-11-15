"use client";

/**
 * Photos, identity documents and the profile review (Sprint 02 — S02-T09 / T10).
 *
 *   POST /api/photos (multipart "file")          → PhotoDto       GET /api/photos/mine
 *   PUT  /api/photos/{id}/main · DELETE /api/photos/{id}
 *   POST /api/kyc/documents ("type" + "file")    → KycDocumentDto  GET /api/kyc/documents
 *   GET  /api/profiles/me/status                 → ProfileStatus  POST /api/profiles/me/submit
 *
 * Images are never kept in localStorage: the API stores them; screens show them through `useApiImage`.
 */
import { useEffect, useState } from "react";
import { API_BASE_URL, apiJson, apiRequest, toApiError } from "@/lib/http";

export const PHOTO_MAX_MB = 8;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const DOCUMENT_TYPES = [...PHOTO_TYPES, "application/pdf"];

export type ReviewItemStatus = "Pending" | "Approved" | "Rejected";
export type KycDocumentType = "NicFront" | "NicBack" | "Passport" | "Selfie";
export type ProfileReviewStatus = "None" | "Draft" | "Submitted" | "ChangesRequested" | "Resubmitted" | "Approved" | "Suspended";

export interface PhotoDto {
  id: string;
  /** "photo:<id>" */
  ref: string;
  sortOrder: number;
  isMain: boolean;
  status: ReviewItemStatus;
  rejectReason?: string | null;
  createdAt: string;
}

export interface KycDocumentDto {
  id: string;
  type: KycDocumentType;
  contentType: string;
  sizeBytes: number;
  status: ReviewItemStatus;
  uploadedAt: string;
}

export interface ReviewFlag {
  field: string;
  reason: string;
  createdAt: string;
}

export interface ProfileStatusInfo {
  status: ProfileReviewStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  flags: ReviewFlag[];
  photoCount: number;
  hasMainPhoto: boolean;
  documentTypes: KycDocumentType[];
  /** dateOfBirth · photo · idDocument · selfie · profile */
  missing: string[];
  canSubmit: boolean;
}

/** Checks done in the browser for a quick message; the API checks the real file again. */
export function checkFile(file: File, allowPdf: boolean): string | null {
  const types = allowPdf ? DOCUMENT_TYPES : PHOTO_TYPES;
  if (!types.includes(file.type)) return allowPdf ? "Upload a JPG, PNG, WebP or PDF file." : "Photos must be JPG, PNG or WebP.";
  if (file.size > PHOTO_MAX_MB * 1024 * 1024) {
    return `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${PHOTO_MAX_MB} MB.`;
  }
  return null;
}

async function upload<T>(path: string, form: FormData, fallback: string): Promise<T> {
  // no Content-Type header: the browser sets multipart/form-data with the boundary
  const res = await apiRequest(path, { method: "POST", body: form, timeoutMs: 60_000 });
  if (!res.ok) throw await toApiError(res, fallback);
  return (await res.json()) as T;
}

// ---- photos ----

export function uploadPhoto(file: File): Promise<PhotoDto> {
  const form = new FormData();
  form.append("file", file);
  return upload<PhotoDto>("/photos", form, "We couldn’t upload this photo. Please try again.");
}

export const listMyPhotos = () => apiJson<PhotoDto[]>("/photos/mine", { cache: "no-store" });

export const setMainPhoto = (id: string) =>
  apiJson<void>(`/photos/${encodeURIComponent(id)}/main`, { method: "PUT", fallbackError: "We couldn’t change your main photo." });

export const deletePhoto = (id: string) =>
  apiJson<void>(`/photos/${encodeURIComponent(id)}`, { method: "DELETE", fallbackError: "We couldn’t remove this photo." });

// ---- identity documents ----

export function uploadDocument(type: KycDocumentType, file: File): Promise<KycDocumentDto> {
  const form = new FormData();
  form.append("type", type);
  form.append("file", file);
  return upload<KycDocumentDto>("/kyc/documents", form, "We couldn’t upload this document. Please try again.");
}

export const listMyDocuments = () => apiJson<KycDocumentDto[]>("/kyc/documents", { cache: "no-store" });

// ---- review ----

export const getReviewStatus = () => apiJson<ProfileStatusInfo>("/profiles/me/status", { cache: "no-store" });

export const submitForReview = () =>
  apiJson<ProfileStatusInfo>("/profiles/me/submit", { method: "POST", fallbackError: "We couldn’t submit your profile. Please try again." });

export const MISSING_LABELS: Record<string, string> = {
  profile: "your profile details",
  dateOfBirth: "your date of birth",
  photo: "a main photo or an avatar",
  idDocument: "your NIC (front and back) or passport",
  selfie: "a selfie",
};

// ---- showing images ----

/** "photo:<id>" or an API photo URL → the file URL (works without login only once the photo is approved). */
export function photoFileUrl(src: string): string {
  return src.startsWith("photo:") ? `${API_BASE_URL}/photos/${src.slice("photo:".length)}/file` : src;
}

const isApiFile = (src: string) => src.startsWith("photo:") || src.startsWith(`${API_BASE_URL}/photos/`) || src.startsWith(`${API_BASE_URL}/kyc/`);

/**
 * An <img>-ready URL for our own photos and documents. Files that are still in review (or private, like ID documents)
 * need the access token, which an <img> tag can't send — so they are fetched and shown as a temporary blob URL.
 * Anything else (avatars, data URIs, other sites) is returned unchanged.
 */
export function useApiImage(src: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(src && !isApiFile(src) ? src : null);

  useEffect(() => {
    if (!src) {
      setUrl(null);
      return;
    }
    if (!isApiFile(src)) {
      setUrl(src);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    apiRequest(photoFileUrl(src), { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        objectUrl = URL.createObjectURL(await res.blob());
        if (!cancelled) setUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return url;
}
