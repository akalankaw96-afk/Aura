using DatingApp.Domain.Common;
using DatingApp.Domain.Enums;

namespace DatingApp.Domain.Entities;

/// <summary>Monthly allowance of one feature on one plan, set by the admin (S03-T02). Null = unlimited.</summary>
public class PlanLimit : BaseEntity
{
    /// <summary>"free", "gold" or "platinum".</summary>
    public string PlanId { get; set; } = string.Empty;
    public UsageFeature Feature { get; set; }
    public int? MonthlyLimit { get; set; }
    public Guid? UpdatedByUserId { get; set; }
}

/// <summary>How many times a member used a feature in one calendar month (UTC) (S03-T03).</summary>
public class UsageCounter : BaseEntity
{
    public Guid UserId { get; set; }
    public UsageFeature Feature { get; set; }
    /// <summary>First day of the month the count belongs to.</summary>
    public DateOnly PeriodStart { get; set; }
    public int Count { get; set; }
}

/// <summary>One member looking at another member's profile (S03-T04). One row per viewer + profile; counts repeat visits.</summary>
public class ProfileView : BaseEntity
{
    public Guid ViewerUserId { get; set; }
    public Guid ViewedProfileId { get; set; }
    public int ViewCount { get; set; } = 1;
    public DateTime LastViewedAt { get; set; } = DateTime.UtcNow;
}
