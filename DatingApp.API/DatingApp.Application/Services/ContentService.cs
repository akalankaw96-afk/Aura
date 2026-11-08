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
        var profiles = await _profileService.GetProfilesAsync(null, ct);
        var stories = await GetStoriesAsync(ct);
        var plans = await GetPlansAsync(ct);
        var faqs = await GetFaqsAsync(ct);

        return new HomeContentDto
        {
            FeaturedProfiles = profiles.Take(8).ToList(),
            SuccessStories = stories,
            PricingPlans = plans,
            Faqs = faqs,
            TotalVerifiedCount = 50000,
            TotalWeddingsCount = 12000
        };
    }

    public async Task<List<SuccessStoryDto>> GetStoriesAsync(CancellationToken ct = default)
    {
        try
        {
            var list = await _context.SuccessStories.AsNoTracking().ToListAsync(ct);
            if (list.Any())
            {
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
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SQL Server stories query notice: {ex.Message}");
        }

        return new List<SuccessStoryDto>
        {
            new()
            {
                Id = Guid.NewGuid(),
                CoupleNames = "Dr. Ashan & Dr. Tharushi",
                Title = "Our hearts are full of love & mutual respect",
                Quote = "\"Being medical doctors with round-the-clock emergency shifts, finding someone who genuinely understands the sacrifices of our profession seemed nearly impossible. Through this platform, our families connected respectfully, we matched our values, and today we are happily married for over a year.\"",
                Story = "Matched in March 2024, married in Colombo with family blessings.",
                WeddingDate = "December 2024",
                Location = "Colombo, Sri Lanka",
                PhotoUrl = "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
                ProfessionInfo = "Consultant Physician & Pediatric Surgeon"
            },
            new()
            {
                Id = Guid.NewGuid(),
                CoupleNames = "Eng. Dilshan & Shenali",
                Title = "Two engineers across continents united",
                Quote = "\"I was living in Sydney while Shenali was working as a Cloud Architect in Colombo. The verified background and family involvement gave both our parents tremendous peace of mind. We are now building our dream life in Melbourne!\"",
                Story = "Long-distance courtship supported by verified identity and sincere family communication.",
                WeddingDate = "September 2025",
                Location = "Melbourne, Australia",
                PhotoUrl = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
                ProfessionInfo = "Civil Engineer & Cloud Architect"
            },
            new()
            {
                Id = Guid.NewGuid(),
                CoupleNames = "Malik & Dr. Zainab",
                Title = "A blessed partnership founded on shared faith & career goals",
                Quote = "\"The privacy filters gave us complete dignity. We loved the detailed criteria matching education and religious values. It was seamless from our first verified greeting to our Nikah.\"",
                Story = "Matched with matching cultural expectations and verified professional credentials.",
                WeddingDate = "November 2025",
                Location = "Kandy, Sri Lanka",
                PhotoUrl = "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop",
                ProfessionInfo = "Corporate Banker & Medical Registrar"
            }
        };
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
