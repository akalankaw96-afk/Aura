using DatingApp.Domain.Common;

namespace DatingApp.Domain.Entities;

/// <summary>
/// Staff actions on accounts (S04-T07): who did what to whom, when and why. Profile review decisions and payment
/// decisions are also in the member's ProfileReviewLog.
/// </summary>
public class AuditLog : BaseEntity
{
    public Guid ActorUserId { get; set; }
    /// <summary>e.g. member.block · member.unblock · member.deactivate · member.activate · member.resetPassword</summary>
    public string Action { get; set; } = string.Empty;
    public Guid? TargetUserId { get; set; }
    public string? Detail { get; set; }
}

/// <summary>Why members delete their accounts (S04-T08) — stored without any link to the member, for reporting only.</summary>
public class AccountClosureFeedback : BaseEntity
{
    public string Reason { get; set; } = string.Empty;
    public string? Comment { get; set; }
}
