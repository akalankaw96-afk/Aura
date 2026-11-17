using DatingApp.Domain.Common;
using DatingApp.Domain.Enums;

namespace DatingApp.Domain.Entities;

/// <summary>
/// A price the admin sets (S04-T01). Plans: PlanId gold / platinum + Months. Boost: PlanId "boost" + Days.
/// Money is kept in cents (LKR 2,500.00 = 250000) — never as text (TD-11).
/// </summary>
public class PlanPrice : BaseEntity
{
    public BillingProduct Product { get; set; }
    public string PlanId { get; set; } = string.Empty;
    public int Months { get; set; }
    public int Days { get; set; }
    public long AmountCents { get; set; }
    public string Currency { get; set; } = "LKR";
    public bool IsActive { get; set; } = true;
    public Guid? UpdatedByUserId { get; set; }
}

/// <summary>
/// A paid period of Gold or Platinum (S04-T02). Plans don't auto-renew: buying again adds a period that starts when
/// the current one ends. The member's plan is the best subscription running now.
/// </summary>
public class Subscription : BaseEntity
{
    public Guid UserId { get; set; }
    /// <summary>"gold" or "platinum".</summary>
    public string PlanId { get; set; } = string.Empty;
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    /// <summary>The approved payment (S04-T04); null when staff granted it.</summary>
    public Guid? PaymentId { get; set; }
    public Guid? GrantedByUserId { get; set; }
    public string? Note { get; set; }
    /// <summary>When the "ends in 3 days" reminder went out (sent once).</summary>
    public DateTime? ReminderSentAt { get; set; }
}
