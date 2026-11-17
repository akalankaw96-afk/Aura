namespace DatingApp.Application.DTOs;

/// <summary>GET /api/admin/stats (S04-T07) — counts for the staff dashboard (members only, staff left out).</summary>
public class AdminStatsDto
{
    public int TotalMembers { get; set; }
    /// <summary>Signed in (or refreshed a session) within 30 days.</summary>
    public int ActiveMembers { get; set; }
    /// <summary>Profiles submitted, waiting for their first review.</summary>
    public int PendingReviews { get; set; }
    /// <summary>Profiles sent back after "changes requested", waiting again.</summary>
    public int KycUpdates { get; set; }
    /// <summary>Signed up, profile not submitted yet.</summary>
    public int IncompleteRegistrations { get; set; }
    public int NewThisWeek { get; set; }
    public int Blocked { get; set; }
    public int PaidMembers { get; set; }
}

/// <summary>A member in the staff members list (S04-T07).</summary>
public class AdminMemberDto
{
    public Guid UserId { get; set; }
    public Guid? ProfileId { get; set; }
    public string? Code { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    /// <summary>Male · Female · null</summary>
    public string? Gender { get; set; }
    /// <summary>Free · Gold · Platinum</summary>
    public string Plan { get; set; } = "Free";
    /// <summary>Active · PendingReview · Incomplete · Deactivated · Blocked</summary>
    public string Status { get; set; } = "Incomplete";
    /// <summary>Why staff blocked / deactivated (staff only).</summary>
    public string? StatusReason { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LastActiveAt { get; set; }
}

/// <summary>POST /api/admin/members/{id}/status</summary>
public class MemberStatusDto
{
    /// <summary>activate · deactivate · block · unblock</summary>
    public string? Action { get; set; }
    /// <summary>Required for deactivate and block.</summary>
    public string? Reason { get; set; }
}

/// <summary>POST /api/account/visibility — "take a break" (S04-T08).</summary>
public class AccountVisibilityDto
{
    public bool Hidden { get; set; }
    /// <summary>Optional, not stored.</summary>
    public string? Reason { get; set; }
}

/// <summary>POST /api/account/delete (S04-T08).</summary>
public class DeleteAccountDto
{
    public string? Code { get; set; }
    /// <summary>found-here · found-elsewhere · not-ready · no-matches · privacy · too-many-messages · other</summary>
    public string? Reason { get; set; }
    public string? Comment { get; set; }
}
