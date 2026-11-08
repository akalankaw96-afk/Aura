using DatingApp.Domain.Common;

namespace DatingApp.Domain.Entities;

public class SuccessStory : BaseEntity
{
    public string CoupleNames { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Quote { get; set; } = string.Empty;
    public string Story { get; set; } = string.Empty;
    public string WeddingDate { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
    public string ProfessionInfo { get; set; } = string.Empty;
}

