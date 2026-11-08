namespace DatingApp.Application.DTOs;

public class SuccessStoryDto
{
    public Guid Id { get; set; }
    public string CoupleNames { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Quote { get; set; } = string.Empty;
    public string Story { get; set; } = string.Empty;
    public string WeddingDate { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
    public string ProfessionInfo { get; set; } = string.Empty;
}

public class PricingPlanDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Price { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public bool Popular { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<string> Features { get; set; } = new();
    public string CtaText { get; set; } = string.Empty;
}

public class FaqDto
{
    public Guid Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}

public class HomeContentDto
{
    public List<ProfileDto> FeaturedProfiles { get; set; } = new();
    public List<SuccessStoryDto> SuccessStories { get; set; } = new();
    public List<PricingPlanDto> PricingPlans { get; set; } = new();
    public List<FaqDto> Faqs { get; set; } = new();
    public int TotalVerifiedCount { get; set; } = 50000;
    public int TotalWeddingsCount { get; set; } = 12000;
}

