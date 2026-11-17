using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Common.Security;
using Microsoft.Extensions.Configuration;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace DatingApp.Infrastructure.Persistence;

public class ApplicationDbContextInitialiser
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ApplicationDbContextInitialiser> _logger;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher _passwordHasher;

    public ApplicationDbContextInitialiser(
        ApplicationDbContext context,
        ILogger<ApplicationDbContextInitialiser> logger,
        IConfiguration configuration,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
    }

    /// <summary>
    /// SQL Server: applies EF migrations (create them with `dotnet ef migrations add`, see DATABASE_GUIDELINES.md).
    /// InMemory (tests / explicit opt-in only): creates the schema directly.
    /// </summary>
    public async Task InitialiseAsync()
    {
        if (_context.Database.IsRelational())
        {
            await _context.Database.MigrateAsync();
        }
        else
        {
            await _context.Database.EnsureCreatedAsync();
        }
    }

    /// <summary>Seeds site content only. No demo members (removed 2026-11-14).</summary>
    public async Task SeedAsync()
    {
        try
        {
            await CleanUpRegistrationDataAsync();
            await EnsureAdminAsync();
            await EnsurePlanLimitsAsync();
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while seeding the database");
        }
    }

    /// <summary>
    /// First Admin (S02-T08): from user-secrets <c>Seed:AdminPhone</c> + <c>Seed:AdminPassword</c>. Nothing happens
    /// without both. An existing account with that number is promoted (its password is kept); otherwise one is created.
    /// </summary>
    private async Task EnsureAdminAsync()
    {
        var phoneSetting = _configuration["Seed:AdminPhone"];
        var password = _configuration["Seed:AdminPassword"];
        if (string.IsNullOrWhiteSpace(phoneSetting) || string.IsNullOrWhiteSpace(password)) return;

        var phone = Identifiers.NormalizePhone(phoneSetting);
        if (phone == null)
        {
            _logger.LogWarning("Seed:AdminPhone is not a valid phone number — no admin created");
            return;
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone);
        if (user == null)
        {
            Identifiers.EnsureStrongPassword(password, "Seed:AdminPassword");
            _context.Users.Add(new User
            {
                FullName = "Administrator",
                PhoneNumber = phone,
                PhoneVerified = true,
                PasswordHash = _passwordHasher.HashPassword(password),
                Role = Roles.Admin
            });
            await _context.SaveChangesAsync();
            _logger.LogInformation("Admin account created for {Phone}", phone);
        }
        else
        {
            if (user.Role != Roles.Admin)
            {
                user.Role = Roles.Admin;
                user.PhoneVerified = true;
                user.SecurityStamp = Guid.NewGuid().ToString("N");
                _logger.LogInformation("Account {Phone} promoted to Admin", phone);
            }

            // Development help: Seed:AdminResetPassword=true sets the admin password from Seed:AdminPassword and clears a lockout.
            if (string.Equals(_configuration["Seed:AdminResetPassword"], "true", StringComparison.OrdinalIgnoreCase))
            {
                Identifiers.EnsureStrongPassword(password, "Seed:AdminPassword");
                user.PasswordHash = _passwordHasher.HashPassword(password);
                user.PasswordChangedAt = DateTime.UtcNow;
                user.FailedLoginCount = 0;
                user.LockoutEndsAt = null;
                user.PhoneVerified = true;
                user.SecurityStamp = Guid.NewGuid().ToString("N");
                _logger.LogWarning("Admin password for {Phone} reset from Seed:AdminPassword — remove Seed:AdminResetPassword now", phone);
            }

            await _context.SaveChangesAsync();
        }
    }

    /// <summary>Starting plan limits (S03-T02) — only rows that don't exist yet; the admin's changes are never overwritten.</summary>
    private async Task EnsurePlanLimitsAsync()
    {
        var existing = await _context.PlanLimits.Select(p => new { p.PlanId, p.Feature }).ToListAsync();
        var added = 0;
        foreach (var plan in DatingApp.Application.Services.Plans.All)
        {
            foreach (var feature in Enum.GetValues<UsageFeature>())
            {
                if (existing.Any(e => e.PlanId == plan && e.Feature == feature)) continue;
                _context.PlanLimits.Add(new PlanLimit
                {
                    PlanId = plan,
                    Feature = feature,
                    MonthlyLimit = plan == DatingApp.Application.Services.Plans.Free
                        ? DatingApp.Application.Services.Plans.FreeDefaults.GetValueOrDefault(feature)
                        : null
                });
                added++;
            }
        }
        if (added > 0) await _context.SaveChangesAsync();
    }

    /// <summary>Profiles saved before this date may hold the old made-up registration values.</summary>
    private static readonly DateTime LegacyCutoffUtc = new(2026, 11, 15, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>
    /// One-off repair of accounts created before the 2026-11-14 registration fix. Safe to run on every start:
    /// each step only matches rows that still have the old values.
    ///  - made-up "phone_…@auramatrimony.lk" e-mails → null
    ///  - account name "New member" / "Phone Member" → the name from the member's profile
    ///  - avatar images stored as data: URIs → empty (the app shows the bride / groom illustration)
    ///  - values the old form invented ("Professional", "Bachelor's Degree") → empty; stray spaces trimmed
    /// </summary>
    private async Task CleanUpRegistrationDataAsync()
    {
        var changed = 0;

        var fakeEmails = await _context.Users
            .Where(u => u.Email != null && u.Email.StartsWith("phone_") && u.Email.EndsWith("@auramatrimony.lk"))
            .ToListAsync();
        foreach (var u in fakeEmails) { u.Email = null; changed++; }

        var placeholderNames = await _context.Users.Include(u => u.Profile)
            .Where(u => (u.FullName == "New member" || u.FullName == "Phone Member") && u.Profile != null && u.Profile.FullName != "")
            .ToListAsync();
        foreach (var u in placeholderNames) { u.FullName = u.Profile!.FullName.Trim(); changed++; }

        var legacyProfiles = await _context.CandidateProfiles
            .Where(p => p.CreatedAt < LegacyCutoffUtc &&
                        (p.PhotoUrl.StartsWith("data:") || p.Profession == "Professional" ||
                         p.Education == "Bachelor's Degree" || p.Bio.EndsWith(" ") || p.Bio.StartsWith(" ")))
            .ToListAsync();
        foreach (var p in legacyProfiles)
        {
            if (p.PhotoUrl.StartsWith("data:")) p.PhotoUrl = string.Empty;
            if (p.Profession == "Professional") p.Profession = string.Empty;
            if (p.Education == "Bachelor's Degree") p.Education = string.Empty;
            p.Bio = p.Bio.Trim();
            p.FullName = p.FullName.Trim();
            changed++;
        }

        if (changed > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Registration data clean-up: {Count} account / profile rows repaired", changed);
        }
    }

    /// <summary>Content seed (plans, FAQs) — safe in every environment. No sample members or success stories.</summary>
    private async Task TrySeedAsync()
    {
        // 4. Seed Pricing Plans
        var plans = new List<PricingPlan>
        {
            new()
            {
                Name = "Basic Explorer",
                Price = "LKR 0",
                Period = "Free Forever",
                Popular = false,
                Description = "Perfect for creating your profile and exploring verified matches.",
                FeaturesJson = JsonSerializer.Serialize(new[]
                {
                    "Create and manage your verified profile",
                    "Browse all verified professional singles",
                    "Receive matchmaking interests & requests",
                    "Limited daily profile views",
                    "Standard customer care support"
                }),
                CtaText = "Get Started Free",
                DisplayOrder = 1
            },
            new()
            {
                Name = "Premium Matrimonial",
                Price = "LKR 3,900",
                Period = "for 3 Months (LKR 1,300/mo)",
                Popular = true,
                Description = "The most popular plan for active individuals and families seeking serious matches.",
                FeaturesJson = JsonSerializer.Serialize(new[]
                {
                    "Everything in Basic Explorer",
                    "Unlimited direct messaging & contact requests",
                    "View verified phone numbers & parents contact",
                    "Complete horoscope matching & Porondam",
                    "Priority profile badge & 5x visibility boost",
                    "Dedicated relationship helpline"
                }),
                CtaText = "Upgrade to Premium",
                DisplayOrder = 2
            },
            new()
            {
                Name = "Elite VIP Matchmaker",
                Price = "LKR 8,500",
                Period = "for 6 Months",
                Popular = false,
                Description = "Bespoke, confidential service with a dedicated matrimonial advisor.",
                FeaturesJson = JsonSerializer.Serialize(new[]
                {
                    "Everything in Premium Matrimonial",
                    "Dedicated Personal Relationship Matchmaker",
                    "Hand-curated monthly match recommendations",
                    "Confidential background & degree verification",
                    "Private photos only unlocked on mutual approval",
                    "Direct family-to-family coordination"
                }),
                CtaText = "Join Elite VIP",
                DisplayOrder = 3
            }
        };

        if (!await _context.PricingPlans.AnyAsync())
        {
            _context.PricingPlans.AddRange(plans);
            await _context.SaveChangesAsync();
        }

        // 5. Seed FAQ items
        var faqs = new List<FaqItem>
        {
            new()
            {
                Question = "How does profile verification work on this platform?",
                Answer = "Every candidate undergoes a mandatory 3-tier verification check: 1) Government photo identity (NIC/Passport), 2) Professional qualification documents (Medical council registration, Engineering charter, CA membership, University degree), and 3) Active phone number confirmation. Only fully verified profiles receive our verified trust badge.",
                DisplayOrder = 1
            },
            new()
            {
                Question = "How is my privacy protected?",
                Answer = "We provide granular privacy controls. You can choose whether your photo is public, visible only to verified logged-in users, or visible strictly upon mutual consent. Your direct phone number and family contact details are never shown publicly and require mutual approval.",
                DisplayOrder = 2
            },
            new()
            {
                Question = "Can parents or guardians manage the profile?",
                Answer = "Yes! A significant number of our members have their profiles created and jointly managed by parents, siblings, or guardians. When registering, simply select \"Profile for Son/Daughter/Sibling\", and both family and candidate details can be included.",
                DisplayOrder = 3
            },
            new()
            {
                Question = "Is horoscope compatibility (Porondam) supported?",
                Answer = "Yes. For families who consider traditional astrology, candidates can securely upload birth chart details (Nekatha, Lagna, Rasi). Premium members can generate instant 20 Porondam compatibility reports alongside modern lifestyle matching.",
                DisplayOrder = 4
            },
            new()
            {
                Question = "Can I connect with Sri Lankan professionals living abroad?",
                Answer = "Absolutely. We have over 3,500+ active Sri Lankan doctors, software architects, corporate executives, and postgraduates living across Australia, the UK, the United States, Canada, New Zealand, and the UAE.",
                DisplayOrder = 5
            }
        };

        if (!await _context.FaqItems.AnyAsync())
        {
            _context.FaqItems.AddRange(faqs);
            await _context.SaveChangesAsync();
        }
    }
}
