using DatingApp.Domain.Common;

namespace DatingApp.Domain.Entities;

/// <summary>Single-use token issued after a correct reset code. Only the hash is stored.</summary>
public class PasswordResetToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
}
