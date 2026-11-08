using DatingApp.Domain.Common;
using DatingApp.Domain.Enums;

namespace DatingApp.Domain.Entities;

public class MatchRequest : BaseEntity
{
    public Guid SenderProfileId { get; set; }
    public CandidateProfile? SenderProfile { get; set; }

    public Guid ReceiverProfileId { get; set; }
    public CandidateProfile? ReceiverProfile { get; set; }

    public MatchRequestStatus Status { get; set; } = MatchRequestStatus.Pending;
    public string? Note { get; set; }
    public DateTime? RespondedAt { get; set; }
}

