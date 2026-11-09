using DatingApp.Application.Common.Interfaces;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DatingApp.Infrastructure.Persistence;

public class ApplicationDbContextInitialiser
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ApplicationDbContextInitialiser(ApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task InitialiseAsync()
    {
        try
        {
            await _context.Database.EnsureCreatedAsync();

            await _context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatMessages')
                BEGIN
                    CREATE TABLE [dbo].[ChatMessages] (
                        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                        [SenderProfileId] UNIQUEIDENTIFIER NOT NULL,
                        [ReceiverProfileId] UNIQUEIDENTIFIER NOT NULL,
                        [ConversationId] NVARCHAR(450) NOT NULL,
                        [MessageText] NVARCHAR(MAX) NOT NULL,
                        [IsRead] BIT NOT NULL DEFAULT 0,
                        [ReadAt] DATETIME2 NULL,
                        [IsFlaggedBySafety] BIT NOT NULL DEFAULT 0,
                        [SafetyFlagReason] NVARCHAR(MAX) NULL,
                        [IsContactShareRequest] BIT NOT NULL DEFAULT 0,
                        [IsContactShareAccepted] BIT NOT NULL DEFAULT 0,
                        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        [UpdatedAt] DATETIME2 NULL,
                        CONSTRAINT [FK_ChatMessages_CandidateProfiles_SenderProfileId] FOREIGN KEY ([SenderProfileId]) REFERENCES [dbo].[CandidateProfiles] ([Id]),
                        CONSTRAINT [FK_ChatMessages_CandidateProfiles_ReceiverProfileId] FOREIGN KEY ([ReceiverProfileId]) REFERENCES [dbo].[CandidateProfiles] ([Id])
                    );
                    CREATE INDEX [IX_ChatMessages_ConversationId] ON [dbo].[ChatMessages] ([ConversationId]);
                END
            ");
        }
        catch (Exception ex)
        {
            // Log or fallback
            Console.WriteLine($"Database initialization notice: {ex.Message}");
        }
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error occurred while seeding database: {ex.Message}");
        }
    }

    public async Task TrySeedAsync()
    {
        // 1. Seed Demo User
        var demoUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "demo@auramatrimony.lk");
        if (demoUser == null)
        {
            demoUser = new User
            {
                Email = "demo@auramatrimony.lk",
                PasswordHash = _passwordHasher.HashPassword("AuraDemo123!"),
                FullName = "Aura Demo Member",
                PhoneNumber = "+94 77 123 4567",
                Role = "Member",
                IsActive = true
            };
            _context.Users.Add(demoUser);
            await _context.SaveChangesAsync();
        }

        // 2. Static Platform Data: Seed Success Stories
        var stories = new List<SuccessStory>
        {
            new()
            {
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

        if (!await _context.SuccessStories.AnyAsync())
        {
            _context.SuccessStories.AddRange(stories);
            await _context.SaveChangesAsync();
        }

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
