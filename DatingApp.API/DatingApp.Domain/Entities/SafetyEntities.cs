using DatingApp.Domain.Common;
using DatingApp.Domain.Enums;

namespace DatingApp.Domain.Entities;

/// <summary>A profile a member saved to look at later (S03-T06).</summary>
public class Shortlist : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ProfileId { get; set; }
}

/// <summary>A named set of search filters (S03-T06). Running it is a normal search and counts as one.</summary>
public class SavedSearch : BaseEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    /// <summary>The <c>ProfileSearchDto</c> filters as JSON (page / pageSize not kept).</summary>
    public string FiltersJson { get; set; } = "{}";
}

/// <summary>One member blocking another (S03-T07). Hides both from each other; the blocked member is not told.</summary>
public class Block : BaseEntity
{
    public Guid BlockerProfileId { get; set; }
    public Guid BlockedProfileId { get; set; }
    /// <summary>The reason the member picked (shown to them in their blocked list only).</summary>
    public string? Reason { get; set; }
}

/// <summary>A member reporting another member to the safety team (S03-T07; handled in the staff area, S03-T08).</summary>
public class Report : BaseEntity
{
    public Guid ReporterUserId { get; set; }
    public Guid ReportedProfileId { get; set; }
    public ReportReason Reason { get; set; }
    public string? Details { get; set; }
    /// <summary>Set when the report was made from a chat.</summary>
    public string? ConversationId { get; set; }
    public ReportStatus Status { get; set; } = ReportStatus.Open;
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? StaffNote { get; set; }
}
