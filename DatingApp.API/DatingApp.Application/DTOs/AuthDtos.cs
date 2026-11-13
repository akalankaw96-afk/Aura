using System.ComponentModel.DataAnnotations;

namespace DatingApp.Application.DTOs;

// ── Requests ────────────────────────────────────────────────────────────────

public class RegisterDto
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required, StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(128)]
    public string Password { get; set; } = string.Empty;

    [StringLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [StringLength(20)]
    public string ProfileFor { get; set; } = "Myself"; // "Myself", "Son", "Daughter", etc.

    [StringLength(10)]
    public string Gender { get; set; } = "female";
}

public class LoginDto
{
    /// <summary>E-mail address or mobile number.</summary>
    [Required, StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(128)]
    public string Password { get; set; } = string.Empty;
}

public class GoogleLoginDto
{
    /// <summary>Google ID token (One Tap "credential") or OAuth access token (popup). Verified on the server.</summary>
    [Required, StringLength(4096)]
    public string IdToken { get; set; } = string.Empty;
}

public class SendOtpDto
{
    [Required, StringLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;
}

public class VerifyOtpDto
{
    [Required, StringLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required, StringLength(6, MinimumLength = 6)]
    public string OtpCode { get; set; } = string.Empty;

    [StringLength(100)]
    public string? FullName { get; set; }
}

public class ForgotPasswordDto
{
    /// <summary>"email" or "phone".</summary>
    [Required, RegularExpression("^(email|phone)$")]
    public string Channel { get; set; } = string.Empty;

    [Required, StringLength(256)]
    public string Value { get; set; } = string.Empty;
}

public class VerifyResetCodeDto : ForgotPasswordDto
{
    [Required, StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    [Required, StringLength(128)]
    public string ResetToken { get; set; } = string.Empty;

    [Required, StringLength(128)]
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    [Required, StringLength(128)]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required, StringLength(128)]
    public string NewPassword { get; set; } = string.Empty;
}

// ── Responses ───────────────────────────────────────────────────────────────

public class OtpResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int ExpiresInSeconds { get; set; }
    public int ResendAvailableInSeconds { get; set; }
    public int ResendsLeft { get; set; }
}

public class AuthResponseDto
{
    /// <summary>Access token (short-lived). The refresh token travels only in the httpOnly cookie.</summary>
    public string Token { get; set; } = string.Empty;
    public DateTime TokenExpiresAt { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public bool PhoneVerified { get; set; }
    public string Role { get; set; } = string.Empty;
    public Guid? ProfileId { get; set; }
    public bool HasCompletedProfile { get; set; }
    public bool IsVerified { get; set; }
    public bool IsUnderReview { get; set; }
    public bool IsPremium { get; set; }
    public string PlanId { get; set; } = "free";
    public string? PhotoUrl { get; set; }
}

public class ResetTokenResponseDto
{
    public string ResetToken { get; set; } = string.Empty;
    public int ExpiresInSeconds { get; set; }
}

public class SessionDto
{
    public Guid Id { get; set; }
    public string Device { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public DateTime SignedInAt { get; set; }
    public DateTime LastActiveAt { get; set; }
    public bool IsCurrent { get; set; }
}

/// <summary>Internal: what the service hands the controller after a successful sign-in or refresh.</summary>
public record AuthResult(AuthResponseDto Response, string RefreshToken, DateTime RefreshTokenExpiresAt);
