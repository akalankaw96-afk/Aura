/**
 * Plan prices + bank transfer details (Plans page and Payment page).
 * Phase 1 = bank transfer only; card / LankaQR / eZ Cash come after the business is registered.
 *
 * The real accounts and QR codes come from the API (appsettings "BankTransfer", GET /api/payments/methods);
 * BANK_ACCOUNTS / PAYMENT_QR below are only shown until that loads. Prices come from GET /api/plans; PLAN_PRICES is the fallback.
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

const DEV = process.env.NODE_ENV !== "production";

/**
 * Shown only until GET /api/payments/methods loads (the real numbers live in the API's appsettings only).
 * Development builds show the same SAMPLE banks and QR codes as appsettings.Development.json, so the page can be tried
 * without the API; production builds show [placeholders] and never the samples.
 */
const SAMPLE_NAME = "Yugadiwi (Pvt) Ltd (SAMPLE)";
export const BANK_ACCOUNTS = DEV
  ? [
      { id: "combank", bankName: "Commercial Bank", accountName: SAMPLE_NAME, accountNumber: "8000 1234 5678", branch: "Colombo 07", swift: "SAMPLE01" },
      { id: "boc", bankName: "Bank of Ceylon (BOC)", accountName: SAMPLE_NAME, accountNumber: "0071 2345 6789", branch: "Kandy City", swift: "SAMPLE02" },
      { id: "peoples", bankName: "People’s Bank", accountName: SAMPLE_NAME, accountNumber: "2040 0011 4521", branch: "Galle Fort", swift: "SAMPLE03" },
      { id: "hnb", bankName: "Hatton National Bank (HNB)", accountName: SAMPLE_NAME, accountNumber: "0090 7766 5544", branch: "Negombo", swift: "SAMPLE04" },
    ]
  : [
      { id: "combank", bankName: "Commercial Bank", accountName: "[Account holder name]", accountNumber: "[0000 0000 0000]", branch: "[Branch name]", swift: "[SWIFT code]" },
      { id: "boc", bankName: "Bank of Ceylon (BOC)", accountName: "[Account holder name]", accountNumber: "[0000 0000 0000]", branch: "[Branch name]", swift: "[SWIFT code]" },
      { id: "peoples", bankName: "People’s Bank", accountName: "[Account holder name]", accountNumber: "[0000 0000 0000]", branch: "[Branch name]", swift: "[SWIFT code]" },
    ];

/** LankaQR codes, one per bank. imageUrl empty = "QR coming soon" (put the PNG in public/payments/qr/ and set the URL in the API config). */
export const PAYMENT_QR = DEV
  ? [
      { id: "combank-qr", name: "Commercial Bank", provider: "LankaQR", accountName: SAMPLE_NAME, imageUrl: "/payments/qr/sample-combank.png", note: "Development sample" },
      { id: "boc-qr", name: "Bank of Ceylon (BOC)", provider: "LankaQR", accountName: SAMPLE_NAME, imageUrl: "/payments/qr/sample-boc.png", note: "Development sample" },
      { id: "peoples-qr", name: "People’s Bank", provider: "LankaQR", accountName: SAMPLE_NAME, imageUrl: "", note: "" },
      { id: "hnb-qr", name: "Hatton National Bank (HNB)", provider: "LankaQR", accountName: SAMPLE_NAME, imageUrl: "/payments/qr/sample-hnb.png", note: "Development sample" },
    ]
  : [
      { id: "combank-qr", name: "Commercial Bank", provider: "LankaQR", accountName: "[Account holder name]", imageUrl: "", note: "" },
      { id: "boc-qr", name: "Bank of Ceylon (BOC)", provider: "LankaQR", accountName: "[Account holder name]", imageUrl: "", note: "" },
      { id: "peoples-qr", name: "People’s Bank", provider: "LankaQR", accountName: "[Account holder name]", imageUrl: "", note: "" },
    ];

/** How long the team takes to check a receipt (shown on the page and after upload) */
export const REVIEW_TIME = "within 24 hours (Mon–Sat)";

/** Receipt upload rules */
export const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const RECEIPT_MAX_MB = 10;
