using DatingApp.Domain.Common;

namespace DatingApp.Domain.Entities;

public class PricingPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Price { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public bool Popular { get; set; } = false;
    public string Description { get; set; } = string.Empty;
    public string FeaturesJson { get; set; } = "[]"; // JSON array of features
    public string CtaText { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

