namespace DatingApp.Application.DTOs;

public class RegisterDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string ProfileFor { get; set; } = "Myself"; // "Myself", "Son", "Daughter", etc.
    public string Gender { get; set; } = "female";
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class GoogleLoginDto
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public string? GoogleId { get; set; }
    public string? IdToken { get; set; }
}

public class SendOtpDto
{
    public string PhoneNumber { get; set; } = string.Empty;
}

public class VerifyOtpDto
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string? FullName { get; set; }
}

public class OtpResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? DemoOtp { get; set; } // Available in dev for easy testing
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? ProfileId { get; set; }
    public bool HasCompletedProfile { get; set; }
    public bool IsVerified { get; set; }
    public bool IsUnderReview { get; set; }
    public bool IsPremium { get; set; }
    public string PlanId { get; set; } = "free";
    public string? PhotoUrl { get; set; }
}
