using DatingApp.Domain.Common;

namespace DatingApp.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = "Member";
    public bool IsActive { get; set; } = true;

    // Navigation property
    public CandidateProfile? Profile { get; set; }
}

