"use client";

import { API_BASE_URL, ApiError, apiJson, apiRequest, toApiError } from "@/lib/http";

/**
 * Plans, prices and the member's subscription (Sprint 04). Prices come from the database (amounts in cents);
 * the admin changes them in the staff area.
 */
export interface PlanPrice {
  product: "plan" | "boost";
  planId: "gold" | "platinum" | "boost";
  months: number;
  days: number;
  amountCents: number;
  amount: number;
  currency: string;
  savePercent?: number | null;
  updatedAt?: string | null;
}

export interface SubscriptionItem {
  id: string;
  planId: "gold" | "platinum";
  status: "Active" | "Upcoming" | "Expired" | "Cancelled";
  startsAt: string;
  endsAt: string;
  source: "payment" | "staff";
  note?: string | null;
}

export interface MySubscription {
  planId: "free" | "gold" | "platinum";
  endsAt?: string | null;
  daysLeft: number;
  items: SubscriptionItem[];
}

/** GET /api/plans — public prices for the Plans page. */
export const getPlans = () => apiJson<PlanPrice[]>("/plans", { cache: "no-store", auth: false });

/** GET /api/me/subscription — my plan now, when it ends and the history. */
export const getMySubscription = () => apiJson<MySubscription>("/me/subscription", { cache: "no-store" });

/* ---------- bank-transfer payments (S04-T03) ---------- */

export type PaymentStatus = "Pending" | "AwaitingReview" | "Approved" | "Rejected" | "Cancelled";

export interface Payment {
  id: string;
  product: "plan" | "boost";
  planId: "gold" | "platinum" | "boost";
  months: number;
  days: number;
  amountCents: number;
  amount: number;
  currency: string;
  reference: string;
  status: PaymentStatus;
  hasReceipt: boolean;
  receiptFileName?: string | null;
  receiptContentType?: string | null;
  paidOn?: string | null;
  memberNote?: string | null;
  createdAt: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  /** Reject reason (shown to the member) or the approver's note. */
  reviewNote?: string | null;
}

export interface BankAccount {
  /** stable key from the API config (e.g. "combank"); older APIs don't send it */
  id?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swift: string;
}

/** GET /api/payments/bank-account — our first account, from the API's configuration (kept for older clients). */
export const getBankAccount = () => apiJson<BankAccount>("/payments/bank-account", { cache: "no-store", auth: false });

/** A LankaQR (or bank) QR code members can scan from their banking app. */
export interface PaymentQr {
  id: string;
  name: string;
  provider: string;
  accountName: string;
  /** "/payments/qr/combank.png" (web app public folder) or an https URL; empty = not ready yet */
  imageUrl: string;
  note?: string;
}

export interface PaymentMethods {
  accounts: BankAccount[];
  qrCodes: PaymentQr[];
}

/**
 * GET /api/payments/methods — every bank account + QR code we accept, from the API's configuration.
 * An API without that endpoint (404) still works: we use its single bank account and show no QR codes.
 */
export async function getPaymentMethods(): Promise<PaymentMethods> {
  try {
    const m = await apiJson<PaymentMethods>("/payments/methods", { cache: "no-store", auth: false });
    return { accounts: m.accounts ?? [], qrCodes: m.qrCodes ?? [] };
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 404) throw err;
    return { accounts: [await getBankAccount()], qrCodes: [] };
  }
}

/** POST /api/payments/bank-transfer — start (or reuse) an order; the server sets the amount and reference. */
export const createBankTransfer = (planId: "gold" | "platinum", months: number) =>
  apiJson<Payment>("/payments/bank-transfer", {
    method: "POST",
    json: { planId, months },
    fallbackError: "We couldn’t start your payment. Please try again.",
  });

/** POST /api/payments/bank-transfer with product "boost" (S04-T05) — approved Gold / Platinum members only. */
export const createBoostTransfer = (days: number) =>
  apiJson<Payment>("/payments/bank-transfer", {
    method: "POST",
    json: { product: "boost", days },
    fallbackError: "We couldn’t start your payment. Please try again.",
  });

/** POST /api/payments/{id}/receipt — multipart: receipt, paidOn (yyyy-mm-dd), note. */
export async function uploadReceipt(paymentId: string, file: File, paidOn: string, note?: string): Promise<Payment> {
  const form = new FormData();
  form.append("receipt", file);
  form.append("paidOn", paidOn);
  if (note?.trim()) form.append("note", note.trim());
  // no Content-Type header: the browser sets multipart/form-data with the boundary
  const res = await apiRequest(`/payments/${encodeURIComponent(paymentId)}/receipt`, { method: "POST", body: form, timeoutMs: 60_000 });
  if (!res.ok) throw await toApiError(res, "We couldn’t upload your receipt. Please try again.");
  return (await res.json()) as Payment;
}

/** GET /api/payments/mine — newest first. */
export const getMyPayments = () => apiJson<Payment[]>("/payments/mine", { cache: "no-store" });

/** Opens a receipt (image or PDF) in a new tab via a temporary blob URL. Staff opens are logged by the API. */
export async function openReceipt(paymentId: string): Promise<void> {
  const tab = window.open("", "_blank");
  const res = await apiRequest(`${API_BASE_URL}/payments/${encodeURIComponent(paymentId)}/receipt`, { cache: "no-store" });
  if (!res.ok) {
    tab?.close();
    throw await toApiError(res, "We couldn’t open this receipt.");
  }
  const url = URL.createObjectURL(await res.blob());
  if (tab) tab.location.href = url;
  else window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ---------- staff payments queue (S04-T04) ---------- */

export interface StaffPayment extends Payment {
  userId: string;
  profileId?: string | null;
  memberName: string;
  memberCode?: string | null;
  phoneNumber: string;
  currentPlan: "free" | "gold" | "platinum";
  reviewedBy?: string | null;
}

export type PaymentQueueFilter = "review" | "pending" | "approved" | "rejected" | "all";

export const getPaymentQueue = (status: PaymentQueueFilter = "review") =>
  apiJson<StaffPayment[]>(`/moderation/payments?status=${status}`, { cache: "no-store" });
export const approvePayment = (id: string, note?: string) =>
  apiJson<StaffPayment>(`/moderation/payments/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    json: { note: note?.trim() || null },
    fallbackError: "We couldn’t approve this payment.",
  });
export const rejectPayment = (id: string, reason: string) =>
  apiJson<StaffPayment>(`/moderation/payments/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    json: { reason },
    fallbackError: "We couldn’t reject this payment.",
  });

/* ---------- admin ---------- */
export const getAdminPrices = () => apiJson<PlanPrice[]>("/admin/prices", { cache: "no-store" });
export const updateAdminPrices = (prices: Pick<PlanPrice, "product" | "planId" | "months" | "days" | "amountCents">[]) =>
  apiJson<PlanPrice[]>("/admin/prices", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prices }),
    fallbackError: "We couldn’t save the prices. Please try again.",
  });

export const lkr = (amount: number) => `LKR ${amount.toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;
