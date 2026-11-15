using DatingApp.Domain.Common;
using DatingApp.Domain.Enums;

namespace DatingApp.Domain.Entities;

public class CandidateProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string Code { get; set; } = string.Empty; // e.g. LK-9021
    public string FullName { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    /// <summary>Kept for search; worked out from <see cref="DateOfBirth"/> whenever the profile is saved or read.</summary>
    public int Age { get; set; }
    /// <summary>Real birth date (checked against the ID at review). Null only for profiles saved before 2026-11-14.</summary>
    public DateOnly? DateOfBirth { get; set; }
    public string Height { get; set; } = string.Empty;
    
    public string Profession { get; set; } = string.Empty;
    public ProfessionCategory ProfessionCategory { get; set; }
    public string Education { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    
    public string Location { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Religion { get; set; } = string.Empty;
    public string Community { get; set; } = string.Empty;
    
    public string Bio { get; set; } = string.Empty;
    public string AboutFamily { get; set; } = string.Empty;
    public bool HoroscopeAvailable { get; set; } = true;
    /// <summary>Review state (S02-T01, replaces the old Verified flag). Visible to other members only when Approved.</summary>
    public ProfileStatus Status { get; set; } = ProfileStatus.Draft;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public bool Premium { get; set; } = false;
    public string PhotoUrl { get; set; } = string.Empty;
    public string Interests { get; set; } = string.Empty; // Comma-separated list
    public string? SubmittedDetailsJson { get; set; }

    public ICollection<ProfilePhoto> Photos { get; set; } = new List<ProfilePhoto>();
    public ICollection<KycDocument> KycDocuments { get; set; } = new List<KycDocument>();
    public ICollection<ProfileReviewFlag> ReviewFlags { get; set; } = new List<ProfileReviewFlag>();

    // Match Requests
    public ICollection<MatchRequest> SentMatchRequests { get; set; } = new List<MatchRequest>();
    public ICollection<MatchRequest> ReceivedMatchRequests { get; set; } = new List<MatchRequest>();
}

