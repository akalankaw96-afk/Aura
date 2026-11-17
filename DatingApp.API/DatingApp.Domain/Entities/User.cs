using DatingApp.Domain.Common;

namespace DatingApp.Domain.Entities;

public class User : BaseEntity
{
    /// <summary>Lower-case e-mail, or null for members who signed up with a mobile number only.</summary>
    public string? Email { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;

    /// <summary>E.164 format, e.g. +94771234567 (see Identifiers.NormalizePhone).</summary>
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = Roles.Member;
    /// <summary>False = blocked by staff (S04-T07): can't sign in.</summary>
    public bool IsActive { get; set; } = true;
    /// <summary>Account deactivated (S04-T07 / T08): profile hidden, sessions ended. Signing in again brings it back.</summary>
    public DateTime? DeactivatedAt { get; set; }
    /// <summary>Why staff blocked or deactivated the account (staff only).</summary>
    public string? StatusReason { get; set; }
    /// <summary>The member deleted their account (S04-T08): can't sign in; data erased after 30 days.</summary>
    public DateTime? DeletionRequestedAt { get; set; }
    /// <summary>When the personal data was erased (payment records are kept).</summary>
    public DateTime? ErasedAt { get; set; }

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
