# Database Guidelines

EF Core 9 · SQL Server (LocalDB in development) · `ApplicationDbContext` in `DatingApp.Infrastructure/Persistence`.
Today the DB is created with `EnsureCreated` and defaults to **InMemory** when `UseInMemoryDatabase` is missing
(BUG-013, TD-10). Moving to migrations is the first DB task in Sprint 01.

## 1. Current entities
All inherit `BaseEntity` → `Id` (Guid), `CreatedAt` (UTC), `UpdatedAt?`.

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| `User` | Email, PasswordHash, FullName, PhoneNumber, Role (`"Member"` string), IsActive | 1–0..1 `CandidateProfile` | Role as free string |
| `CandidateProfile` | UserId, Code (`LK-9021`), FullName, Gender, Age, Height (string), Profession, ProfessionCategory, Education, University, Location, Country, Religion, Community, Bio, AboutFamily, HoroscopeAvailable, Verified, Premium, PhotoUrl, Interests (CSV), SubmittedDetailsJson | sent/received `MatchRequest` | Age stored instead of DOB; one photo; KYC + plan as booleans (TD-11) |
| `MatchRequest` | SenderProfileId, ReceiverProfileId, Status (enum), Note, RespondedAt | 2 × `CandidateProfile` | |
| `ChatMessage` | SenderProfileId, ReceiverProfileId, ConversationId (string), MessageText, IsRead, ReadAt, IsFlaggedBySafety, SafetyFlagReason, IsContactShareRequest/Accepted | 2 × `CandidateProfile` | No Conversation entity |
| `PricingPlan` | Name, Price (string), Period, Popular, Description, FeaturesJson, CtaText, DisplayOrder | — | Money as text |
| `SuccessStory`, `FaqItem` | content fields | — | CMS-style content |

## 2. Target additions (by sprint)
| Sprint | New / changed tables |
|---|---|
| 01 | `RefreshToken` (hashed, expiry, revokedAt, replacedBy), `OtpCode` (hashed, expiry, attempts); `User.Role` constrained; `User.SecurityStamp` |
| 02 | `ProfilePhoto` (url/key, order, isPrimary, moderationStatus), `KycSubmission` (status, documents, reviewer, decidedAt, rejectedFields JSON), `ProfileDraft`; `CandidateProfile.DateOfBirth`, `Status` (Draft/Pending/Approved/Rejected/Suspended) replacing `Verified` |
| 03 | `Conversation` (+ participants), `Block`, `Report`, `Shortlist`, `ProfileView`, `SavedSearch`, `UsageCounter` (memberId, kind, period, count), `Notification` |
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
