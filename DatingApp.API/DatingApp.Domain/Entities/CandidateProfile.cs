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
    public int Age { get; set; }
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
    public bool Verified { get; set; } = false;
    public bool Premium { get; set; } = false;
    public string PhotoUrl { get; set; } = string.Empty;
    public string Interests { get; set; } = string.Empty; // Comma-separated list
    public string? SubmittedDetailsJson { get; set; }

    // Match Requests
    public ICollection<MatchRequest> SentMatchRequests { get; set; } = new List<MatchRequest>();
    public ICollection<MatchRequest> ReceivedMatchRequests { get; set; } = new List<MatchRequest>();
}

