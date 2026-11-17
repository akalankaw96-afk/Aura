namespace DatingApp.Application.DTOs;

/// <summary>One price (S04-T01). Amount is also given in rupees for display; cents are the stored value.</summary>
public class PlanPriceDto
{
    /// <summary>plan · boost</summary>
    public string Product { get; set; } = "plan";
    /// <summary>gold · platinum · boost</summary>
    public string PlanId { get; set; } = string.Empty;
    public int Months { get; set; }
    public int Days { get; set; }
    public long AmountCents { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "LKR";
    /// <summary>Saving against paying the 1-month price every month (plans only).</summary>
    public int? SavePercent { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdatePricesDto
{
    public List<PlanPriceDto> Prices { get; set; } = new();
}

public class SubscriptionDto
{
    public Guid Id { get; set; }
    public string PlanId { get; set; } = string.Empty;
    /// <summary>Active · Expired · Cancelled — and "Upcoming" for a renewal that starts later.</summary>
    public string Status { get; set; } = "Active";
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    /// <summary>payment · staff</summary>
    public string Source { get; set; } = "payment";
    public string? Note { get; set; }
}

/// <summary>The member's plan now and their plan history (GET /api/me/subscription).</summary>
public class MySubscriptionDto
{
    /// <summary>free · gold · platinum</summary>
    public string PlanId { get; set; } = "free";
    /// <summary>When the paid plan ends, renewals already bought included.</summary>
    public DateTime? EndsAt { get; set; }
    public int DaysLeft { get; set; }
    public List<SubscriptionDto> Items { get; set; } = new();
}

/// <summary>Staff giving a plan without a payment (complimentary, corrections).</summary>
public class GrantSubscriptionDto
{
    public string PlanId { get; set; } = "gold";
    public int Months { get; set; } = 1;
    /// <summary>Required — why it was given.</summary>
    public string? Note { get; set; }
}

public class CancelSubscriptionDto
{
    public string? Note { get; set; }
}
