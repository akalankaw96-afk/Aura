using DatingApp.Application.Common.Interfaces;
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

    public ApplicationDbContextInitialiser(
        ApplicationDbContext context,
        ILogger<ApplicationDbContextInitialiser> logger)
    {
        _context = context;
        _logger = logger;
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
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while seeding the database");
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
