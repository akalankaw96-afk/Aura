"use client";

import { apiJson } from "@/lib/http";

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
