# Project overview — Vikasitha (Aura)

**Purpose:** a trusted Sri Lankan matrimony platform where every profile is ID-verified, families can search
safely, and contact details stay private until both sides accept.

## Users and roles
| Role | Can do |
|---|---|
| Guest | Browse home, search, open profiles (no gallery), read plans/FAQ. Any action opens the "Log in to continue" popup. |
| Member — KYC pending / changes requested | Locked dashboard showing review status; fix rejected fields and resubmit. |
| Member — Free (approved) | Search 3×/month, view 5 different profiles/month, 3 interests, 2 chat connections; upgrade prompts at limits. |
| Member — Gold / Platinum | Unlimited usage, who-viewed-me, contact sharing, boost (LKR 500 / 7 days), Platinum matchmaker extras. |
| Moderator / Admin | KYC review, photo review, reports, payments, members (admin UI is a mock today). |

## Main journeys
1. **Join:** Register (email/mobile + password or Google) → OTP verify → profile (about, family, education, WhatsApp)
   → photos or illustration avatar → submit → dashboard locked "under review".
2. **KYC result:** approved → full dashboard · changes requested → "Fix your profile" with highlighted fields → resubmit.
3. **Find:** Search with filters (age, religion, district…) → grid/list → full-page profile view (results list left,
   profile right) → photo viewer, share, report.
4. **Connect:** Send interest (+ note) → Friends page (Received tab) accept/decline → chat (contact details unlock on mutual accept).
5. **Pay:** Plans page (Gold/Platinum, 1/3/6 months) → membership card with expiry → boost profile → promoted row.

## Markets and constraints
- Sri Lanka + diaspora; English and Sinhala UI (Tamil font loaded, translations not yet written).
- Mobile-first usage (installable PWA, bottom tab bar on mobile).
- Payments expected via Sri Lankan gateways (card, LankaQR, eZ Cash, bank slip) — none integrated yet.
- Privacy is central: phone numbers / links blocked in notes and messages before mutual acceptance.

## Status at a glance (11 Nov 2026)
Front end: most screens built and clickable on demo data. API: auth, profiles, interests, chat and content exist
but have critical security gaps and use an in-memory DB by default. Details: `PROJECT_ANALYSIS.md`.

## Key links
- Figma: https://www.figma.com/design/jyoGCUqvQuZsoUp2uUi95W/AI-Learning-2
- Full Web API specification (102 endpoints): Claude doc "Vikasitha — Web API Specification"
  (https://claude.ai/artifact/LP2mSaiPiJYZCij2bLU1p6) — summary in `API_GUIDELINES.md`.
