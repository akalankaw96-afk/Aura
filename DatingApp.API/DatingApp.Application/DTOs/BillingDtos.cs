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

/// <summary>Our bank account for transfers (S04-T03) — from configuration "BankTransfer", never from the database.</summary>
public class BankAccountDto
{
    public string BankName { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Swift { get; set; } = string.Empty;
}

/// <summary>POST /api/payments/bank-transfer — start (or reuse) an order. The amount always comes from the price list.</summary>
public class CreateBankTransferDto
{
    /// <summary>plan (default) · boost</summary>
    public string? Product { get; set; }
    /// <summary>gold · platinum (plans)</summary>
    public string PlanId { get; set; } = "gold";
    public int Months { get; set; } = 1;
    /// <summary>Boost length in days (boosts; default 7).</summary>
    public int Days { get; set; }
}

public class PaymentDto
{
    public Guid Id { get; set; }
    /// <summary>plan · boost</summary>
    public string Product { get; set; } = "plan";
    public string PlanId { get; set; } = string.Empty;
    public int Months { get; set; }
    public int Days { get; set; }
    public long AmountCents { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "LKR";
    public string Reference { get; set; } = string.Empty;
    /// <summary>Pending · AwaitingReview · Approved · Rejected · Cancelled</summary>
    public string Status { get; set; } = "Pending";
    public bool HasReceipt { get; set; }
    public string? ReceiptFileName { get; set; }
    public string? ReceiptContentType { get; set; }
    public DateOnly? PaidOn { get; set; }
    public string? MemberNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    /// <summary>Reject reason (members see it) or the approver's note.</summary>
    public string? ReviewNote { get; set; }
}

/// <summary>A payment in the staff queue (S04-T04) — with who paid.</summary>
public class StaffPaymentDto : PaymentDto
{
    public Guid UserId { get; set; }
    public Guid? ProfileId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string? MemberCode { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    /// <summary>free · gold · platinum — the member's plan right now.</summary>
    public string CurrentPlan { get; set; } = "free";
    public string? ReviewedBy { get; set; }
}

public class ApprovePaymentDto
{
    public string? Note { get; set; }
}

public class RejectPaymentDto
{
    /// <summary>Required — the member sees it (e.g. "Amount on the receipt is LKR 2,000").</summary>
    public string? Reason { get; set; }
}

/// <summary>GET /api/boosts/me — the member's promotion (S04-T05).</summary>
public class BoostStatusDto
{
    public bool Active { get; set; }
    /// <summary>Start of the running boost chain.</summary>
    public DateTime? StartsAt { get; set; }
    /// <summary>End of the last boost bought (extensions included).</summary>
    public DateTime? EndsAt { get; set; }
    public int DaysLeft { get; set; }
    public int TotalDays { get; set; }
    /// <summary>Members who opened the profile since the boost started.</summary>
    public int Views { get; set; }
    /// <summary>Interests received since the boost started.</summary>
    public int Interests { get; set; }
    /// <summary>Can buy a boost now: approved profile + Gold / Platinum running.</summary>
    public bool CanBuy { get; set; }
}
