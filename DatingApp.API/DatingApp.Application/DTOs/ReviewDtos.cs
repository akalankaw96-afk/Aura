namespace DatingApp.Application.DTOs;

public class PhotoDto
{
    public Guid Id { get; set; }
    /// <summary>"photo:&lt;id&gt;" — the web app turns it into GET /api/photos/{id}/file.</summary>
    public string Ref { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsMain { get; set; }
    public string Status { get; set; } = "Pending";
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class KycDocumentDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty; // NicFront · NicBack · Passport · Selfie
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime UploadedAt { get; set; }
}

public class ReviewFlagDto
{
    public string Field { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>GET /profiles/me/status — everything the dashboard needs about the review (S02-T02).</summary>
public class ProfileStatusDto
{
    /// <summary>None (no profile yet) · Draft · Submitted · ChangesRequested · Resubmitted · Approved · Suspended.</summary>
    public string Status { get; set; } = "None";
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public List<ReviewFlagDto> Flags { get; set; } = new();
    public int PhotoCount { get; set; }
    public bool HasMainPhoto { get; set; }
    public List<string> DocumentTypes { get; set; } = new();
    /// <summary>What is still needed before the profile can be submitted (empty when ready).</summary>
    public List<string> Missing { get; set; } = new();
    public bool CanSubmit { get; set; }
}

public class ReorderPhotosDto
{
    public List<Guid> PhotoIds { get; set; } = new();
}

// ---- moderation (S02-T06) ----

public class ReviewQueueItemDto
{
    public Guid ProfileId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? SubmittedAt { get; set; }
    public string? MainPhotoRef { get; set; }
    public int PendingPhotos { get; set; }
}

public class ReviewLogDto
{
    public string Action { get; set; } = string.Empty;
    public string ModeratorName { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ProfileReviewDto
{
    public ProfileDto Profile { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public DateTime? SubmittedAt { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? DateOfBirth { get; set; }
    public List<PhotoDto> Photos { get; set; } = new();
    public List<KycDocumentDto> Documents { get; set; } = new();
    public List<ReviewFlagDto> OpenFlags { get; set; } = new();
    public List<ReviewLogDto> History { get; set; } = new();
}

public class ReviewDecisionDto
{
    public string? Note { get; set; }
}

public class RequestChangesDto
{
    public List<ReviewFlagInputDto> Flags { get; set; } = new();
    public string? Note { get; set; }
}

public class ReviewFlagInputDto
{
    public string Field { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class RejectPhotoDto
{
    public string Reason { get; set; } = string.Empty;
}

public class PendingPhotoDto
{
    public Guid PhotoId { get; set; }
    public string Ref { get; set; } = string.Empty;
    public Guid ProfileId { get; set; }
    public string ProfileCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// ---- staff (S02-T08) ----

public class StaffUserDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Role { get; set; } = string.Empty;
}

public class ChangeRoleDto
{
    public string Role { get; set; } = string.Empty; // Member · Moderator
}

// ---- notifications (S02-T12) ----

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Link { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
