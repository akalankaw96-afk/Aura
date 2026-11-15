using DatingApp.Domain.Common;
using DatingApp.Domain.Enums;

namespace DatingApp.Domain.Entities;

/// <summary>A member photo (S02-T04). Stored privately; other members see it only once a moderator approves it.</summary>
public class ProfilePhoto : BaseEntity
{
    public Guid ProfileId { get; set; }
    public CandidateProfile? Profile { get; set; }

    /// <summary>Key inside the file store (never a public path).</summary>
    public string StorageKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public int SortOrder { get; set; }
    public bool IsMain { get; set; }

    public ReviewItemStatus Status { get; set; } = ReviewItemStatus.Pending;
    public string? RejectReason { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
}

/// <summary>An identity document or selfie (S02-T05). Only the member and staff can read it; every staff view is logged.</summary>
public class KycDocument : BaseEntity
{
    public Guid ProfileId { get; set; }
    public CandidateProfile? Profile { get; set; }

    public KycDocumentType Type { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public ReviewItemStatus Status { get; set; } = ReviewItemStatus.Pending;
}

/// <summary>A field the moderator asked the member to change, with the reason (S02-T06 / T07).</summary>
public class ProfileReviewFlag : BaseEntity
{
    public Guid ProfileId { get; set; }
    public CandidateProfile? Profile { get; set; }

    /// <summary>Profile field key, e.g. "photo", "about", "dob", "documents".</summary>
    public string Field { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

/// <summary>Audit trail of moderator actions, including who looked at identity documents.</summary>
public class ProfileReviewLog : BaseEntity
{
    public Guid ProfileId { get; set; }
    public Guid ModeratorUserId { get; set; }
    public ReviewAction Action { get; set; }
    public string? Note { get; set; }
}

/// <summary>In-app notification (S02-T12).</summary>
public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Link { get; set; }
    public DateTime? ReadAt { get; set; }
}
