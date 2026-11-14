using DatingApp.Domain.Common;

namespace DatingApp.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;

    /// <summary>E.164 format, e.g. +94771234567 (see Identifiers.NormalizePhone).</summary>
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = Roles.Member;
    public bool IsActive { get; set; } = true;

    // Security (S01)
    public bool PhoneVerified { get; set; }
    /// <summary>Google account id ("sub" claim) once the member has signed in with Google.</summary>
    public string? GoogleSubject { get; set; }
    /// <summary>Changes whenever the password changes or all sessions are revoked.</summary>
    public string SecurityStamp { get; set; } = Guid.NewGuid().ToString("N");
    public int FailedLoginCount { get; set; }
    public DateTime? LockoutEndsAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }

    // Navigation properties
    public CandidateProfile? Profile { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public static class Roles
{
    public const string Member = "Member";
    public const string Moderator = "Moderator";
    public const string Admin = "Admin";
}
