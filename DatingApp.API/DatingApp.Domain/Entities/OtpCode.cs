using DatingApp.Domain.Common;
using DatingApp.Domain.Enums;

namespace DatingApp.Domain.Entities;

/// <summary>
/// A 6-digit code sent by SMS or e-mail. Only a hash is stored. One row covers a code and its resends.
/// </summary>
public class OtpCode : BaseEntity
{
    public OtpPurpose Purpose { get; set; }
    public OtpChannel Channel { get; set; }
    /// <summary>Normalized phone (E.164) or lower-case e-mail.</summary>
    public string Destination { get; set; } = string.Empty;
    /// <summary>Null when no account matches (forgot password): the code is never sent, but the API behaves the same.</summary>
    public Guid? UserId { get; set; }

    public string CodeHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime LastSentAt { get; set; }
    public int ResendCount { get; set; }
    public int FailedAttempts { get; set; }
    public DateTime? ConsumedAt { get; set; }
}
