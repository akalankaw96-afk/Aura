using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DatingApp.Application.Services;

public interface IContentService
{
    Task<HomeContentDto> GetHomeContentAsync(CancellationToken ct = default);
    Task<List<SuccessStoryDto>> GetStoriesAsync(CancellationToken ct = default);
    Task<List<PricingPlanDto>> GetPlansAsync(CancellationToken ct = default);
    Task<List<FaqDto>> GetFaqsAsync(CancellationToken ct = default);
}

public class ContentService : IContentService
{
    private readonly IApplicationDbContext _context;
    private readonly IProfileService _profileService;

    public ContentService(IApplicationDbContext context, IProfileService profileService)
    {
        _context = context;
        _profileService = profileService;
    }

    public async Task<HomeContentDto> GetHomeContentAsync(CancellationToken ct = default)
    {
        // Public page: approved members only
        var profiles = await _profileService.GetProfilesAsync(new ProfileFilterDto { VerifiedOnly = true }, ct);
        var stories = await GetStoriesAsync(ct);
        var plans = await GetPlansAsync(ct);
        var faqs = await GetFaqsAsync(ct);

        return new HomeContentDto
        {
            FeaturedProfiles = profiles.Take(8).ToList(),
            SuccessStories = stories,
            PricingPlans = plans,
            Faqs = faqs,
            TotalVerifiedCount = await _context.CandidateProfiles.CountAsync(p => p.Verified, ct),
            TotalWeddingsCount = stories.Count
        };
    }

    /// <summary>Stories shared by real couples. Empty until someone shares one (no sample stories).</summary>
    public async Task<List<SuccessStoryDto>> GetStoriesAsync(CancellationToken ct = default)
    {
        var list = await _context.SuccessStories.AsNoTracking().OrderByDescending(s => s.CreatedAt).ToListAsync(ct);
        return list.Select(s => new SuccessStoryDto
        {
            Id = s.Id,
            CoupleNames = s.CoupleNames,
            Title = s.Title,
            Quote = s.Quote,
            Story = s.Story,
            WeddingDate = s.WeddingDate,
            Location = s.Location,
            PhotoUrl = s.PhotoUrl,
            ProfessionInfo = s.ProfessionInfo
        }).ToList();
    }

    public async Task<List<PricingPlanDto>> GetPlansAsync(CancellationToken ct = default)
    {
        try
        {
            var list = await _context.PricingPlans.AsNoTracking().OrderBy(p => p.DisplayOrder).ToListAsync(ct);
            if (list.Any())
            {
                return list.Select(p => new PricingPlanDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    Period = p.Period,
                    Popular = p.Popular,
                    Description = p.Description,
                    Features = string.IsNullOrWhiteSpace(p.FeaturesJson) 
                        ? new List<string>() 
                        : JsonSerializer.Deserialize<List<string>>(p.FeaturesJson) ?? new List<string>(),
                    CtaText = p.CtaText
                }).ToList();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SQL Server plans query notice: {ex.Message}");
        }

        return new List<PricingPlanDto>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Basic Explorer",
                Price = "LKR 0",
                Period = "Free Forever",
                Popular = false,
                Description = "Perfect for creating your profile and exploring verified matches.",
                Features = new List<string>
                {
                    "Create and manage your verified profile",
                    "Browse all verified professional singles",
                    "Receive matchmaking interests & requests",
                    "Limited daily profile views",
                    "Standard customer care support"
                },
                CtaText = "Get Started Free"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Premium Matrimonial",
                Price = "LKR 3,900",
                Period = "for 3 Months (LKR 1,300/mo)",
                Popular = true,
                Description = "The most popular plan for active individuals and families seeking serious matches.",
                Features = new List<string>
                {
                    "Everything in Basic Explorer",
                    "Unlimited direct messaging & contact requests",
                    "View verified phone numbers & parents contact",
                    "Complete horoscope matching & Porondam",
                    "Priority profile badge & 5x visibility boost",
                    "Dedicated relationship helpline"
                },
                CtaText = "Upgrade to Premium"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Elite VIP Matchmaker",
                Price = "LKR 8,500",
                Period = "for 6 Months",
                Popular = false,
                Description = "Bespoke, confidential service with a dedicated matrimonial advisor.",
                Features = new List<string>
                {
                    "Everything in Premium Matrimonial",
                    "Dedicated Personal Relationship Matchmaker",
                    "Hand-curated monthly match recommendations",
                    "Confidential background & degree verification",
                    "Private photos only unlocked on mutual approval",
                    "Direct family-to-family coordination"
                },
                CtaText = "Join Elite VIP"
            }
        };
    }

    public async Task<List<FaqDto>> GetFaqsAsync(CancellationToken ct = default)
    {
        try
        {
            var list = await _context.FaqItems.AsNoTracking().OrderBy(f => f.DisplayOrder).ToListAsync(ct);
            if (list.Any())
            {
                return list.Select(f => new FaqDto
                {
                    Id = f.Id,
                    Question = f.Question,
                    Answer = f.Answer
                }).ToList();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SQL Server faqs query notice: {ex.Message}");
        }

        return new List<FaqDto>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Question = "How does profile verification work on this platform?",
                Answer = "Every candidate undergoes a mandatory 3-tier verification check: 1) Government photo identity (NIC/Passport), 2) Professional qualification documents (Medical council registration, Engineering charter, CA membership, University degree), and 3) Active phone number confirmation. Only fully verified profiles receive our verified trust badge."
            },
            new()
            {
                Id = Guid.NewGuid(),
                Question = "How is my privacy protected?",
                Answer = "We provide granular privacy controls. You can choose whether your photo is public, visible only to verified logged-in users, or visible strictly upon mutual consent. Your direct phone number and family contact details are never shown publicly and require mutual approval."
            },
            new()
            {
                Id = Guid.NewGuid(),
                Question = "Can parents or guardians manage the profile?",
                Answer = "Yes! A significant number of our members have their profiles created and jointly managed by parents, siblings, or guardians. When registering, simply select \"Profile for Son/Daughter/Sibling\", and both family and candidate details can be included."
            },
            new()
            {
                Id = Guid.NewGuid(),
                Question = "Is horoscope compatibility (Porondam) supported?",
                Answer = "Yes. For families who consider traditional astrology, candidates can securely upload birth chart details (Nekatha, Lagna, Rasi). Premium members can generate instant 20 Porondam compatibility reports alongside modern lifestyle matching."
            },
            new()
            {
                Id = Guid.NewGuid(),
                Question = "Can I connect with Sri Lankan professionals living abroad?",
                Answer = "Absolutely. We have over 3,500+ active Sri Lankan doctors, software architects, corporate executives, and postgraduates living across Australia, the UK, the United States, Canada, New Zealand, and the UAE."
            }
        };
    }
}
