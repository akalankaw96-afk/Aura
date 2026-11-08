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
        }
        catch (Exception ex)
        {
            // Log or fallback
            Console.WriteLine($"Database initialization notice: {ex.Message}");
        }
    }

    private async Task<User> GetOrCreateCandidateUserAsync(string email, string fullName)
    {
        var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existing != null) return existing;

        var user = new User
        {
            Email = email,
            FullName = fullName,
            PhoneNumber = "+94 " + new Random().Next(70, 78) + " " + new Random().Next(100, 999) + " " + new Random().Next(1000, 9999),
            PasswordHash = _passwordHasher.HashPassword("AuraDemo123!"),
            Role = "Member",
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
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

        // 2. Seed Initial 8 Verified Professional Profiles if missing
        if (!await _context.CandidateProfiles.AnyAsync(p => p.Code == "LK-9021"))
        {
            var u1 = await GetOrCreateCandidateUserAsync("kavinda.perera@auramatrimony.lk", "Dr. Kavinda Perera");
            var u2 = await GetOrCreateCandidateUserAsync("nilushi.senanayake@auramatrimony.lk", "Nilushi Senanayake");
            var u3 = await GetOrCreateCandidateUserAsync("amila.fernando@auramatrimony.lk", "Eng. Amila Fernando");
            var u4 = await GetOrCreateCandidateUserAsync("priya.wickramasinghe@auramatrimony.lk", "Dr. Priya Wickramasinghe");
            var u5 = await GetOrCreateCandidateUserAsync("roshan.gunasekara@auramatrimony.lk", "Roshan Gunasekara");
            var u6 = await GetOrCreateCandidateUserAsync("dinithi.jayasuriya@auramatrimony.lk", "Dinithi Jayasuriya");
            var u7 = await GetOrCreateCandidateUserAsync("sameera.alwis@auramatrimony.lk", "Dr. Sameera Alwis");
            var u8 = await GetOrCreateCandidateUserAsync("tharushi.alahakoon@auramatrimony.lk", "Tharushi Alahakoon");

            var candidateSpecs = new[]
            {
                (u1, "LK-9021", "Dr. Kavinda Perera", Gender.Male, 29, "5' 10\"", "Medical Officer (MBBS)", ProfessionCategory.Doctor, "MBBS, Faculty of Medicine, Colombo", "University of Colombo", "Colombo 07", "Sri Lanka", "Buddhist", "Sinhala Govigama", true, true, "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop", "Practicing doctor at National Hospital Colombo. Values family, traditional culture, and outdoor hiking. Looking for an educated, caring life partner.", "Father is a retired civil engineer, mother is a teacher. Younger sister is reading for her degree.", true, "Medicine,Hiking,Photography,Volunteering"),
                (u2, "LK-8834", "Nilushi Senanayake", Gender.Female, 26, "5' 5\"", "Senior Software Engineer", ProfessionCategory.IT, "BSc (Hons) in Computer Science, University of Moratuwa", "University of Moratuwa", "Colombo / Remote", "Sri Lanka", "Buddhist", "Sinhala Govigama", true, false, "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop", "Software engineer at a leading US tech firm. Passionate about art, reading, and gentle family lifestyle. Seeking an ambitious and honest professional.", "Respectable Buddhist family from Kandy. Parents are government pensioners.", true, "Tech & AI,Classical Music,Cooking,Reading"),
                (u3, "LK-7102", "Eng. Amila Fernando", Gender.Male, 31, "6' 0\"", "Civil Structural Engineer", ProfessionCategory.Engineer, "BSc Eng (Hons) Moratuwa, MSc Melbourne", "University of Melbourne", "Melbourne / Colombo", "Australia", "Christian", "Sinhala", true, true, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop", "Chartered civil engineer working in Melbourne with Australian PR. Non-smoker, active athlete, balanced spiritual life. Open to settling in Australia or Sri Lanka.", "Well-established family in Moratuwa. Both parents are university lecturers.", false, "Cricket,Travel,Architecture,Badminton"),
                (u4, "LK-6549", "Dr. Priya Wickramasinghe", Gender.Female, 28, "5' 4\"", "Dental Surgeon (BDS)", ProfessionCategory.Doctor, "BDS University of Peradeniya", "University of Peradeniya", "Kandy / Kurunegala", "Sri Lanka", "Buddhist", "Sinhala Govigama", true, false, "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop", "Dental surgeon running a private dental practice in Kandy. Values Buddhist traditions, cultural festivals, and community welfare.", "Father is a retired medical specialist, mother holds a high post in education.", true, "Gardening,Cooking,Meditation,Classical Dance"),
                (u5, "LK-5421", "Roshan Gunasekara", Gender.Male, 33, "5' 9\"", "Chartered Financial Analyst (CFA)", ProfessionCategory.Finance, "BBA Finance, CFA Charterholder", "University of Colombo", "Singapore / Colombo", "Singapore", "Buddhist", "Sinhala Karava", true, false, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop", "Portfolio Manager at a Singapore investment fund. Frequent traveler, fitness enthusiast, grounded and family-oriented. Looking for a partner with global exposure.", "Parents live in Colombo 05. Elder brother is a doctor in the UK.", true, "FinTech,Scuba Diving,Running,Fine Dining"),
                (u6, "LK-4318", "Dinithi Jayasuriya", Gender.Female, 27, "5' 6\"", "Attorney-at-Law & Legal Counsel", ProfessionCategory.Legal, "LL.B (Hons) London, Attorney-at-Law Sri Lanka Law College", "University of London", "Colombo 03", "Sri Lanka", "Buddhist", "Sinhala Govigama", true, true, "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop", "Corporate legal counsel handling international arbitration. Calm temperament, love for literature, animal welfare, and family gatherings.", "Father is a President's Counsel, mother is a homemaker.", true, "Literature,Animal Welfare,Violin,Debating"),
                (u7, "LK-3904", "Dr. Sameera Alwis", Gender.Male, 30, "5' 11\"", "Consultant Radiologist", ProfessionCategory.Doctor, "MBBS, MD (Radiology), FRCR (UK)", "Royal College of Radiologists (UK)", "London / Colombo", "United Kingdom", "Catholic", "Sinhala", true, true, "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800&auto=format&fit=crop", "Currently in NHS Fellowship training in London. Values kindness, intellectual curiosity, and balanced work-life harmony.", "Devout Catholic family from Negombo with strong ethical values.", false, "Medical Research,Tennis,Jazz,Global Travel"),
                (u8, "LK-2810", "Tharushi Alahakoon", Gender.Female, 25, "5' 3\"", "UX Design Lead & Lecturer", ProfessionCategory.IT, "BSc in Design & Interaction, Singapore", "National University of Singapore", "Galle / Colombo", "Sri Lanka", "Buddhist", "Sinhala", true, false, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop", "Creative digital design leader and visiting university lecturer. Loves minimalist aesthetics, coastal road trips, and culinary experiments.", "Mother is a school principal, father runs a boutique hospitality firm in the South.", true, "UI/UX Design,Baking,Nature Walks,Yoga")
            };

            foreach (var s in candidateSpecs)
            {
                if (!await _context.CandidateProfiles.AnyAsync(p => p.Code == s.Item2 || p.UserId == s.Item1.Id))
                {
                    _context.CandidateProfiles.Add(new CandidateProfile
                    {
                        UserId = s.Item1.Id,
                        Code = s.Item2,
                        FullName = s.Item3,
                        Gender = s.Item4,
                        Age = s.Item5,
                        Height = s.Item6,
                        Profession = s.Item7,
                        ProfessionCategory = s.Item8,
                        Education = s.Item9,
                        University = s.Item10,
                        Location = s.Item11,
                        Country = s.Item12,
                        Religion = s.Item13,
                        Community = s.Item14,
                        Verified = s.Item15,
                        Premium = s.Item16,
                        PhotoUrl = s.Item17,
                        Bio = s.Item18,
                        AboutFamily = s.Item19,
                        HoroscopeAvailable = s.Item20,
                        Interests = s.Item21
                    });
                }
            }
            await _context.SaveChangesAsync();
        }

        // 3. Seed Success Stories
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
