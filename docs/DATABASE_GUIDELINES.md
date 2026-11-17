# Database Guidelines

EF Core 9 · SQL Server (LocalDB in development) · `ApplicationDbContext` in `DatingApp.Infrastructure/Persistence`.
Today the DB is created with `EnsureCreated` and defaults to **InMemory** when `UseInMemoryDatabase` is missing
(BUG-013, TD-10). Moving to migrations is the first DB task in Sprint 01.

## 1. Current entities
All inherit `BaseEntity` → `Id` (Guid), `CreatedAt` (UTC), `UpdatedAt?`.

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| `User` | Email, PasswordHash, FullName, PhoneNumber, Role (`"Member"` string), IsActive | 1–0..1 `CandidateProfile` | Role as free string |
| `CandidateProfile` | UserId, Code (`LK-123456`), FullName, Gender, DateOfBirth (+ Age kept for search), Height (string), Profession, ProfessionCategory, Education, University, Location, Country, Religion, Community, Bio, AboutFamily, HoroscopeAvailable, Status (Draft → Approved / Suspended), SubmittedAt, ReviewedAt, ReviewedByUserId, Premium, PhotoUrl (public ref), Interests (CSV), SubmittedDetailsJson | sent/received `MatchRequest`, `ProfilePhoto`, `KycDocument` | Plan still a boolean (`Premium` → gold) until Sprint 04 (TD-11) |
| `MatchRequest` | SenderProfileId, ReceiverProfileId, Status (Pending · Accepted · Declined · Withdrawn), Note, RespondedAt | 2 × `CandidateProfile` | One row per direction; a withdrawn one is reopened when sent again |
| `ChatMessage` | SenderProfileId, ReceiverProfileId, ConversationId (string), MessageText, IsRead, ReadAt, IsFlaggedBySafety, SafetyFlagReason, IsContactShareRequest / Accepted / Declined / Cancelled | 2 × `CandidateProfile` | No Conversation entity; contact-share state = latest share message |
| Review (S02) | `ProfilePhoto`, `KycDocument`, `ProfileReviewFlag`, `ProfileReviewLog` (incl. report decisions), `Notification` | profile / user | Files in `IFileStorage`, keys only in the DB |
| Usage (S03) | `PlanLimit` (PlanId, Feature, MonthlyLimit null = unlimited), `UsageCounter` (UserId, Feature, PeriodStart, Count), `ProfileView` (ViewerUserId, ViewedProfileId, ViewCount, LastViewedAt) | user / profile | Limits set by the admin |
| Safety (S03) | `Shortlist` (UserId, ProfileId), `SavedSearch` (UserId, Name, FiltersJson), `Block` (BlockerProfileId, BlockedProfileId, Reason), `Report` (ReporterUserId, ReportedProfileId, Reason, Details, Status, ReviewedBy / At, StaffNote) | user / profile | Users are never hard-deleted (NoAction FKs) |
| `PricingPlan` | Name, Price (string), Period, Popular, Description, FeaturesJson, CtaText, DisplayOrder | — | Money as text |
| `SuccessStory`, `FaqItem` | content fields | — | CMS-style content |

## 2. Target additions (by sprint)
| Sprint | New / changed tables |
|---|---|
| 01 | `RefreshToken` (hashed, expiry, revokedAt, replacedBy), `OtpCode` (hashed, expiry, attempts); `User.Role` constrained; `User.SecurityStamp` |
| 02 | `ProfilePhoto` (url/key, order, isPrimary, moderationStatus), `KycSubmission` (status, documents, reviewer, decidedAt, rejectedFields JSON), `ProfileDraft`; `CandidateProfile.DateOfBirth`, `Status` (Draft/Pending/Approved/Rejected/Suspended) replacing `Verified` |
| 03 | **Done:** `PlanLimit`, `UsageCounter`, `ProfileView`, `Shortlist`, `SavedSearch`, `Block`, `Report` (`Notification` came in 02). `Conversation` entity not needed yet (conversation id from the two profiles) |
| 04 | `Subscription` (plan, startsAt, endsAt, status), `Payment` (gateway ref, amountLkrCents, status, idempotency key), `Boost` (startsAt, endsAt, paymentId), `AuditLog` |

## 3. Rules
1. **Every schema change is a migration**: `dotnet ef migrations add <Name> -p DatingApp.Infrastructure -s DatingApp.WebApi`.
   Never edit an applied migration; never use `EnsureCreated` outside tests.
2. **Impact note before changing a table**: add a short entry in §5 (what changes, data migration, which endpoints/screens).
3. Configure entities with `IEntityTypeConfiguration<T>` classes (lengths, required, indexes, delete behaviour) — not attributes scattered on entities.
4. Strings have max lengths; enums stored as strings for readability; money as `long` cents; dates `DateTime` UTC.
5. No lists in CSV/JSON columns when you need to filter on them — use a child table (TD-11).
6. Indexes for every search filter (Gender, Religion, Age/DOB, Location, Status) and FK; unique on `User.Email`,
   `CandidateProfile.Code`, `(SenderProfileId, ReceiverProfileId)` for active requests.
7. Delete behaviour: `Restrict` by default; soft delete (`DeletedAt`) for members, messages and payments.
8. Queries: `AsNoTracking()` for reads, project to DTOs with `Select`, page everything, avoid N+1 (`Include` only what is shown).
9. Seed: content (plans, FAQs, stories) in all environments; **demo members only in Development** (BUG-015), no known passwords committed.
10. Tests use SQLite in-memory or Testcontainers SQL Server — not the EF InMemory provider for relational behaviour.
11. Backups and destructive operations (drop, truncate, reset) only with explicit approval.

## 4. Local setup
```
"ConnectionStrings": { "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=VikasithaDev;Trusted_Connection=True;" }
"UseInMemoryDatabase": false
dotnet ef database update -p DatingApp.Infrastructure -s DatingApp.WebApi
```

## 5. Change log of schema decisions
| Date | Change | Impact | Migration |
|---|---|---|---|
| — | (first entry: InitialCreate baseline from current model, Sprint 01) | none — captures the existing schema | `InitialCreate` |
| 2026-11-13 | S01 auth: `User` + PhoneVerified, GoogleSubject (unique, filtered), SecurityStamp, FailedLoginCount, LockoutEndsAt, PasswordChangedAt; new `RefreshTokens`, `OtpCodes`, `PasswordResetTokens` (hashes only); config classes in `Persistence/Configurations`. Startup now runs `Migrate()` (SQL) instead of `EnsureCreated`; SQL Server is the default | Dev DBs made by `EnsureCreated` must be dropped once; phone numbers now stored as E.164 (`+94771234567`) — older formatted numbers won't match login | `InitialCreate` (to generate — includes the auth tables) |
| 2026-11-14 | Registration data fix: `Users.Email` nullable (unique only when set — mobile-only accounts have no e-mail, no more `phone_…@auramatrimony.lk`); `CandidateProfiles.DateOfBirth` (date, nullable — age is worked out from it). Startup repair (`ApplicationDbContextInitialiser.CleanUpRegistrationDataAsync`) clears fake e-mails, copies the profile name over "New member", removes stored SVG avatars and the invented "Professional" / "Bachelor's Degree" values on profiles created before 2026-11-15 | Existing profiles have no birth date until the member saves the profile again | `RegistrationDataFix` (owner generates: `dotnet ef migrations add RegistrationDataFix -p DatingApp.Infrastructure -s DatingApp.WebApi`) |
| 2026-11-14 | Sprint 02 review: `CandidateProfiles.Status` (int enum) + `SubmittedAt`, `ReviewedAt`, `ReviewedByUserId`; `Verified` column dropped; new `ProfilePhotos`, `KycDocuments`, `ProfileReviewFlags`, `ProfileReviewLogs`, `Notifications`. Files themselves live in `IFileStorage` (only keys in the DB) | Existing profiles become **Draft** (none were approved in dev DBs) and must submit with photo + ID | `Sprint02Review` (owner generates) |
| 2026-11-14 | Sprint 03 usage: new `PlanLimits` (PlanId, Feature, MonthlyLimit null = unlimited, UpdatedByUserId; unique PlanId + Feature) and `UsageCounters` (UserId, Feature, PeriodStart = first of month, Count; unique UserId + Feature + PeriodStart). Search indexes on `CandidateProfiles` (Status, Gender, DateOfBirth) and (Status, CreatedAt). Startup seeds missing plan-limit rows (Free 3/5/3/2, paid unlimited) and never overwrites the admin's values | None for existing data | `Sprint03Usage` (owner generates) |
| 2026-11-14 | Sprint 03 interactions: new `ProfileViews` (ViewerUserId, ViewedProfileId, ViewCount, LastViewedAt; unique viewer + profile; index ViewedProfileId + LastViewedAt; FK to profile cascade, to user no action). `MatchRequestStatus` gains `Withdrawn = 4` (int column — no schema change) | None | `Sprint03Interactions` (owner generates) |
| 2026-11-14 | Sprint 03 safety: new `Shortlists` (UserId, ProfileId; unique), `SavedSearches` (UserId, Name ≤ 60 unique per user, FiltersJson ≤ 2000), `Blocks` (BlockerProfileId, BlockedProfileId unique, Reason ≤ 100; both FKs no action), `Reports` (ReporterUserId, ReportedProfileId, Reason / Status int enums, Details ≤ 1000, ConversationId, ReviewedByUserId, ReviewedAt, StaffNote; index Status + CreatedAt); `ChatMessages` + `IsContactShareDeclined`, `IsContactShareCancelled` (bit, default 0) | None | `Sprint03Safety` (owner generates) |
| 2026-11-16 | Sprint 04 billing: new `PlanPrices` (Product, PlanId, Months, Days, AmountCents bigint, Currency, IsActive, UpdatedByUserId; unique Product + PlanId + Months + Days) and `Subscriptions` (UserId, PlanId, StartsAt, EndsAt, Status, PaymentId, GrantedByUserId, Note, ReminderSentAt; indexes UserId + Status + EndsAt, Status + EndsAt). `CandidateProfiles` + `PlanId` (default "free") and `PlanEndsAt` — a cache written only by `SubscriptionService`. Start-up seeds prices and turns old `Premium = 1` profiles into a one-month Gold period | Paid members set by hand keep Gold for a month, then follow their subscriptions | `Sprint04Billing` (owner generates) |
| 2026-11-16 | Sprint 04 payments: new `Payments` (UserId, Product, PlanId, Months, Days, AmountCents bigint, Currency, Reference unique, Status, ReceiptKey / ContentType / FileName, PaidOn date, MemberNote, SubmittedAt, ReviewedByUserId, ReviewedAt, ReviewNote; indexes UserId + Status, Status + SubmittedAt; FK to Users, no cascade). `Subscriptions.PaymentId` now unique when set (one payment starts one period). `ReviewAction` 10–12 (receipt viewed, payment approved / rejected) | Payment records are kept when an account is deleted (legal) | `Sprint04Payments` (owner generates — `Sprint04Billing` was already generated before these) |
| 2026-11-17 | Sprint 04 boosts: new `Boosts` (UserId, ProfileId, StartsAt, EndsAt, PaymentId unique when set, GrantedByUserId, Note; index ProfileId + EndsAt; FKs to Users and CandidateProfiles, no cascade). `CandidateProfiles.PromotedUntil` (datetime, null) — cache written only by `BoostService`; search orders by it | Boosts follow on from each other, so one end date says whether a profile is promoted | `Sprint04Boosts` (owner generates) |
| 2026-11-17 | Sprint 04 admin: `Users.DeactivatedAt` (datetime, null) and `Users.StatusReason` (500); `CandidateProfiles.IsHidden` (bit, default 0) — set while the account is blocked or deactivated, checked next to `Status = Approved` everywhere other members see profiles; new `AuditLogs` (ActorUserId, Action 50, TargetUserId, Detail 500; indexes TargetUserId + CreatedAt, CreatedAt) | One flag keeps blocked / deactivated members out of every list without touching their review status | `Sprint04Admin` (owner generates) |
| 2026-11-17 | Sprint 04 account: `Users.DeletionRequestedAt` (filtered index) and `Users.ErasedAt`; `CandidateProfiles.HiddenByMemberAt` ("take a break" — search only); new `AccountClosureFeedback` (Reason 50, Comment 1000 — no user id). Erasure after 30 days removes personal rows and files and blanks the user / profile; `Payments`, `Subscriptions`, `Boosts`, `ProfileReviewLogs`, `AuditLogs` are kept (rows stay linked to the blanked user) | Members can leave for good while the business keeps the records it must; the phone number becomes free | `Sprint04Account` (owner generates) |
