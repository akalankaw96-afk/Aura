using DatingApp.Domain.Common;

namespace DatingApp.Domain.Entities;

/// <summary>
/// One refresh token. Tokens rotate on every use; all tokens of one sign-in share a <see cref="SessionId"/>,
/// which is what the member sees as a "device" in the sessions list. Only the SHA-256 hash is stored.
/// </summary>
public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public Guid SessionId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Guid? ReplacedByTokenId { get; set; }

    public string? CreatedByIp { get; set; }
    public string? UserAgent { get; set; }
    /// <summary>When the session started (copied to every rotated token).</summary>
    public DateTime SessionStartedAt { get; set; }

    public bool IsActive(DateTime now) => RevokedAt == null && ExpiresAt > now;
}
