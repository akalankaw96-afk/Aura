using DatingApp.Domain.Common;

namespace DatingApp.Domain.Entities;

public class ChatMessage : BaseEntity
{
    public Guid SenderProfileId { get; set; }
    public CandidateProfile? SenderProfile { get; set; }

    public Guid ReceiverProfileId { get; set; }
    public CandidateProfile? ReceiverProfile { get; set; }

    public string ConversationId { get; set; } = string.Empty;
    public string MessageText { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }

    // Flow 3: Anti-Scam & Safety Scanner fields
    public bool IsFlaggedBySafety { get; set; } = false;
    public string? SafetyFlagReason { get; set; }

    // Flow 3: Mutual Phone/Contact Share Gate fields
    public bool IsContactShareRequest { get; set; } = false;
    public bool IsContactShareAccepted { get; set; } = false;
}
