namespace DatingApp.Application.DTOs;

public class ChatMessageDto
{
    public Guid Id { get; set; }
    public Guid SenderProfileId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderPhotoUrl { get; set; } = string.Empty;
    public Guid ReceiverProfileId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string ConversationId { get; set; } = string.Empty;
    public string MessageText { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
    public bool IsMe { get; set; }

    // Safety & Anti-Scam scanner
    public bool IsFlaggedBySafety { get; set; }
    public string? SafetyFlagReason { get; set; }

    // Contact sharing
    public bool IsContactShareRequest { get; set; }
    public bool IsContactShareAccepted { get; set; }
    public bool IsContactShareDeclined { get; set; }
    public bool IsContactShareCancelled { get; set; }
}

public class SendMessageDto
{
    public Guid ReceiverProfileId { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public string? ConversationId { get; set; }
}

public class ConversationDto
{
    public string ConversationId { get; set; } = string.Empty;
    public Guid PartnerProfileId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public string PartnerPhotoUrl { get; set; } = string.Empty;
    public string PartnerProfession { get; set; } = string.Empty;
    public bool PartnerVerified { get; set; }
    public bool PartnerOnline { get; set; }
    public string LastMessageText { get; set; } = string.Empty;
    public DateTime LastMessageTime { get; set; }
    public int UnreadCount { get; set; }
    public bool IsContactShared { get; set; }
    public string? PartnerPhoneNumber { get; set; }
    /// <summary>Contact share: none · sent (I asked) · received (they asked) · accepted (S03-T07).</summary>
    public string ContactShareState { get; set; } = "none";
    /// <summary>I blocked this member — the chat is read-only until I unblock (S03-T07).</summary>
    public bool IsBlocked { get; set; }
}

public class TypingIndicatorDto
{
    public string ConversationId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool IsTyping { get; set; }
}

public class ContactShareDto
{
    public string ConversationId { get; set; } = string.Empty;
    public Guid RequesterProfileId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public bool IsMutual { get; set; }
}
