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

/// <summary>
/// A bank-transfer payment (S04-T03 / T04). The member makes an order (amount from <see cref="PlanPrice"/>, reference
/// made by the server), transfers the money, then uploads the receipt. Staff approve it once — that starts the plan.
/// Payment records are kept even when an account is deleted (legal / tax).
/// </summary>
public class Payment : BaseEntity
{
    public Guid UserId { get; set; }
    public BillingProduct Product { get; set; } = BillingProduct.Plan;
    /// <summary>"gold" · "platinum" · "boost".</summary>
    public string PlanId { get; set; } = string.Empty;
    public int Months { get; set; }
    public int Days { get; set; }
    public long AmountCents { get; set; }
    public string Currency { get; set; } = "LKR";
    /// <summary>What the member types in the transfer's remarks, e.g. VK-G3-7K2QXM. Unique.</summary>
    public string Reference { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    /// <summary>Private file key in IFileStorage (owner + staff only).</summary>
    public string? ReceiptKey { get; set; }
    public string? ReceiptContentType { get; set; }
    public string? ReceiptFileName { get; set; }
    public DateOnly? PaidOn { get; set; }
    public string? MemberNote { get; set; }
    public DateTime? SubmittedAt { get; set; }

    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    /// <summary>Reject reason (shown to the member) or the approver's note.</summary>
    public string? ReviewNote { get; set; }
}

/// <summary>
/// A paid profile boost (S04-T05): the profile is shown first in matching searches with a "Promoted" badge.
/// Buying again while promoted adds the days after the current boost.
/// </summary>
public class Boost : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ProfileId { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    /// <summary>The approved payment; null when staff gave it.</summary>
    public Guid? PaymentId { get; set; }
    public Guid? GrantedByUserId { get; set; }
    public string? Note { get; set; }
}
