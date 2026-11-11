# Security Guidelines

Matrimony data is sensitive: names, photos, phone numbers, religion, ID documents. Treat every request as hostile
and every browser value as untrusted. Open vulnerabilities are tracked in `BUG_TRACKER.md` (BUG-001 … BUG-018).

## 1. Non-negotiables
1. **Identity comes from the JWT**, never from a body/query/hub argument (`User.FindFirstValue(...)`).
2. **Every endpoint is `[Authorize]` by default.** Anonymous endpoints are listed explicitly (see §6).
3. **The server decides** plan, KYC status, usage limits, boosts, payment status and admin role. The browser only caches.
4. **No secrets in Git.** No keys, passwords, tokens, connection strings with passwords, `.env` files, real member data.
5. **No demo backdoors.** No master OTPs, fake sessions, "any password" admin logins, auto-verified profiles.
6. **Least data out.** Responses never contain password hashes, OTPs, internal ids of other users' accounts, phone
   numbers or e-mail of other members (contact details only after mutual contact-share acceptance).

## 2. Secrets and configuration
- Development: `dotnet user-secrets` for `Jwt:Key`, `Google:ClientSecret`, SMS/payment keys, DB password.
- Deployed: environment variables or a vault. `appsettings.json` keeps **names** and safe defaults only.
- App must **fail fast at startup** if a required secret is missing — no hard-coded fallback (BUG-007).
- Web app: only `NEXT_PUBLIC_*` values reach the browser — never put a secret behind that prefix.
- A secret that was ever committed is **leaked**: rotate it, then remove it.

## 3. Authentication
- Passwords: ASP.NET `PasswordHasher<T>` or PBKDF2-SHA256 ≥ 600k iterations; rehash on login (BUG-018).
  Min length 8, blocklist common passwords, lockout after 5 failed attempts for 15 min (already in the UI flow).
- Tokens: access JWT ≈ 15 min (HS256 key ≥ 32 bytes, or RS256), claims `sub`, `profileId`, `role`, `plan`;
  refresh token rotated on every use, stored hashed, sent as httpOnly + Secure + SameSite=Lax cookie (BUG-008, BUG-017).
- Logout revokes the refresh token. Password change/reset revokes all.
- OTP: 6 digits, hashed, 5-min expiry, max 5 attempts, resend throttle (60 s), sent only by SMS (BUG-001).
- Google: validate ID token signature, `aud`, `iss`, `exp`; link accounts by verified e-mail only (BUG-002).
- Password reset: single-use token, 30-min expiry, same response whether the e-mail exists or not.

## 4. Authorization
- Roles: `Member`, `Moderator`, `Admin`. Admin/moderator endpoints use `[Authorize(Roles = "...")]` + policies.
- Resource checks in the **service**: a member may only read/write their own profile, drafts, photos, KYC,
  requests and conversations; chat only within an accepted match; blocked users can't see or contact each other.
- Plan/limit checks in the service (e.g. `UsageService.Consume`), returning `402`/`403` with a code the UI maps to
  the upgrade popup.
- Web guards (`requireMember`, `KycGuard`) are UX only — never the security boundary.

## 5. Input, output and files
- Validate every DTO (length, enum, ranges); reject unknown fields where practical.
- EF Core parameterises queries; never build SQL strings. Never `dangerouslySetInnerHTML` with user text.
- Uploads (photos, ID documents): allow-list MIME + magic-byte check, max size (photos 8 MB, ID 10 MB), strip EXIF
  (GPS), re-encode images, random file names, private storage; ID documents only via short-lived signed URLs and
  only to moderators. Never serve ID documents from a public URL.
- Chat: rate limit, length limit (2,000 chars), safety filter for phone numbers/links before contact share.

## 6. Anonymous endpoints (allow-list)
`/api/auth/register`, `login`, `google-login`, `send-otp`, `verify-otp`, `refresh`, `forgot-password`,
`reset-password`; `/api/content/*`; public profile teasers for the home page (limited fields, no contacts, no full photos).

## 7. Transport and browser
- HTTPS everywhere, HSTS in production. CORS: explicit origins per environment, credentials only for those (BUG-006).
- Security headers on the web app: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'`.
- Rate limiting (ASP.NET `RateLimiter`): auth 10/min/IP, OTP 3/10 min/phone, search & profile views per plan.

## 8. Logging and privacy
- Log security events (login fail/success, lockout, role change, KYC decision, payment) with user id, not PII.
- Never log passwords, tokens, OTPs, ID numbers, card data. Card data never touches our servers (hosted gateway page).
- Member can deactivate/delete the account; deletion removes photos and ID documents (retention policy in Sprint 04).
- Demo/seed data in Development only; never copy production data to a dev machine.

## 9. Security checklist for every PR
- [ ] New endpoint has `[Authorize]` (or is in §6) and takes identity from claims
- [ ] Ownership / role / plan check in the service, with a test
- [ ] No secret, token or personal data in code, logs, fixtures or screenshots
- [ ] Input validated; errors return ProblemDetails without stack traces
- [ ] Client trusts nothing it could edit in DevTools
