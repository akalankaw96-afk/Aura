/**
 * Plan prices + bank transfer details (Plans page and Payment page).
 * Phase 1 = bank transfer only; card / LankaQR / eZ Cash come after the business is registered.
 *
 * ⚠️ BANK_ACCOUNT values in [square brackets] are placeholders — replace them with the real account
 * before launch (they are copied by the members, so they must be exact).
 */
export type PaidPlan = "gold" | "platinum";
export type Period = 1 | 3 | 6;

export const PLAN_PRICES: Record<PaidPlan, Record<Period, number>> = {
  gold: { 1: 2500, 3: 6375, 6: 11250 },
  platinum: { 1: 6500, 3: 16575, 6: 29250 },
};
export const PLAN_NAME: Record<PaidPlan, string> = { gold: "Gold", platinum: "Platinum" };
export const PERIODS: Period[] = [1, 3, 6];

export const lkr = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;

export const BANK_ACCOUNT = {
  bankName: "[Bank name]",
  accountName: "[Account holder name]",
  accountNumber: "[0000 0000 0000]",
  branch: "[Branch name]",
  /** shown small; useful for transfers from overseas */
  swift: "[SWIFT code]",
};

/** How long the team takes to check a receipt (shown on the page and after upload) */
export const REVIEW_TIME = "within 24 hours (Mon–Sat)";

/** Receipt upload rules */
export const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const RECEIPT_MAX_MB = 10;
