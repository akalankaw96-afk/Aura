namespace DatingApp.Application.DTOs;

public class UsageItemDto
{
    /// <summary>Search · ProfileView · Interest · NewChat</summary>
    public string Feature { get; set; } = string.Empty;
    public int Used { get; set; }
    /// <summary>Null = unlimited.</summary>
    public int? Limit { get; set; }
    public int? Remaining { get; set; }
}

/// <summary>GET /api/me/usage — this month's allowance (S03-T03).</summary>
public class UsageDto
{
    public string PlanId { get; set; } = "free";
    public DateTime PeriodStart { get; set; }
    /// <summary>When the counters start again (first day of next month, UTC).</summary>
    public DateTime ResetsAt { get; set; }
    public List<UsageItemDto> Items { get; set; } = new();
}

public class PlanLimitDto
{
    public string PlanId { get; set; } = string.Empty;
    public string Feature { get; set; } = string.Empty;
    public int? MonthlyLimit { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdatePlanLimitsDto
{
    public List<PlanLimitDto> Limits { get; set; } = new();
}

/// <summary>GET /api/profiles/search query (S03-T01).</summary>
public class ProfileSearchDto
{
    public string? Gender { get; set; }
    public int? AgeFrom { get; set; }
    public int? AgeTo { get; set; }
    public string? Religion { get; set; }
    public string? Community { get; set; }
    public string? Location { get; set; }
    public string? Country { get; set; }
    public string? Profession { get; set; }
    public bool? Horoscope { get; set; }
    /// <summary>Free text: name, profile code or profession.</summary>
    public string? Q { get; set; }
    /// <summary>newest (default) · ageAsc · ageDesc</summary>
    public string? Sort { get; set; }
    /// <summary>
    /// True when the app narrows the results with filters the API doesn't run itself (height, several religions,
    /// countries, "with photo"…). Counts as a search like any other filter (S03-T10, TD-28).
    /// </summary>
    public bool? Filtered { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(Total / (double)PageSize);
}

/// <summary>A profile someone viewed, or a member who viewed you (S03-T04).</summary>
public class ProfileViewItemDto
{
    public ProfileDto Profile { get; set; } = new();
    public DateTime LastViewedAt { get; set; }
    public int ViewCount { get; set; }
}

/// <summary>"Who viewed me". Free members get the total only (<see cref="Locked"/> = true, no items).</summary>
public class ProfileViewersDto
{
    public int Total { get; set; }
    public bool Locked { get; set; }
    public string PlanId { get; set; } = "free";
    public List<ProfileViewItemDto> Items { get; set; } = new();
}

/// <summary>Everything the member dashboard shows, in one call (S03-T09).</summary>
public class DashboardDto
{
    public UsageDto Usage { get; set; } = new();

    /// <summary>Approved members who opened my profile (ever / last 7 days).</summary>
    public int ProfileViewers { get; set; }
    public int ProfileViewersThisWeek { get; set; }
    /// <summary>Free plan: the counts only — the names are for Gold / Platinum.</summary>
    public bool ViewersLocked { get; set; }
    public List<ProfileViewItemDto> RecentViewers { get; set; } = new();

    /// <summary>Interests received (not withdrawn), and the ones waiting for my answer.</summary>
    public int InterestsReceived { get; set; }
    public int InterestsWaiting { get; set; }
    public int InterestsSentWaiting { get; set; }
    public int Matches { get; set; }
    /// <summary>Approved members who saved my profile.</summary>
    public int ShortlistedBy { get; set; }

    public int UnreadMessages { get; set; }
    public int UnreadChats { get; set; }
    public List<ConversationDto> RecentConversations { get; set; } = new();
}
