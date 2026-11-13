namespace DatingApp.Application.Common.Security;

/// <summary>Auth limits agreed in SPRINT_PLAN.md (S01-T03, T05, T16). Change them here only.</summary>
public static class AuthRules
{
    // One-time codes (SMS / e-mail)
    public const int CodeLength = 6;
    public static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(5);
    public const int CodeMaxAttempts = 5;
    public static readonly TimeSpan CodeResendWait = TimeSpan.FromSeconds(60);
    public const int CodeMaxResends = 3;
    /// <summary>After this window a new code starts with fresh resend / attempt counters.</summary>
    public static readonly TimeSpan CodeWindow = TimeSpan.FromHours(1);

    // Password reset
    public static readonly TimeSpan ResetTokenLifetime = TimeSpan.FromMinutes(10);

    // Sessions
    public static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(30);

    // Login lockout
    public const int MaxFailedLogins = 5;
    public static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    // Passwords
    public const int PasswordMinLength = 8;
    public const int PasswordMaxLength = 128;
}
