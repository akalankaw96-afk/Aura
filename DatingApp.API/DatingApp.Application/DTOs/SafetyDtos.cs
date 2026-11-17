namespace DatingApp.Application.DTOs;

public class ShortlistItemDto
{
    public ProfileDto Profile { get; set; } = new();
    public DateTime AddedAt { get; set; }
}

public class SavedSearchDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ProfileSearchDto Filters { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class CreateSavedSearchDto
{
    public string Name { get; set; } = string.Empty;
    public ProfileSearchDto Filters { get; set; } = new();
}

public class BlockMemberDto
{
    /// <summary>Optional — the reason picked in the block dialog (max 100 characters).</summary>
    public string? Reason { get; set; }
}

public class BlockedMemberDto
{
    public Guid ProfileId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime BlockedAt { get; set; }
}

public class CreateReportDto
{
    public Guid ProfileId { get; set; }
    /// <summary>Scam · Inappropriate · FakeProfile · Other.</summary>
    public string Reason { get; set; } = "Other";
    public string? Details { get; set; }
    public string? ConversationId { get; set; }
}

public class ReportDto
{
    public Guid Id { get; set; }
    public Guid ReportedProfileId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; }
}

/// <summary>One report in the staff queue (S03-T08).</summary>
public class ReportQueueItemDto
{
    public Guid Id { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? ConversationId { get; set; }
    public string Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedByName { get; set; }
    public string? StaffNote { get; set; }

    public string ReporterName { get; set; } = string.Empty;
    public Guid? ReporterProfileId { get; set; }

    public Guid ReportedProfileId { get; set; }
    public string ReportedName { get; set; } = string.Empty;
    public string ReportedCode { get; set; } = string.Empty;
    public string ReportedPhotoUrl { get; set; } = string.Empty;
    /// <summary>The reported profile's review status (Approved, Suspended …).</summary>
    public string ReportedStatus { get; set; } = string.Empty;
    /// <summary>Open reports about the same member, this one included.</summary>
    public int OpenReportsOnProfile { get; set; }
    public int TotalReportsOnProfile { get; set; }
}

public class ResolveReportDto
{
    /// <summary>dismiss · action (handled without suspending) · suspend (suspends the member and closes all their open reports).</summary>
    public string Action { get; set; } = string.Empty;
    /// <summary>Required to suspend; kept with the report and in the profile's history.</summary>
    public string? Note { get; set; }
}
