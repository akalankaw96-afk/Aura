using DatingApp.Domain.Entities;

namespace DatingApp.Application.Common.Interfaces;

public record AccessToken(string Token, DateTime ExpiresAt);

public interface IJwtTokenGenerator
{
    /// <summary>Short-lived access token. <paramref name="sessionId"/> goes into the "sid" claim.</summary>
    AccessToken GenerateAccessToken(User user, Guid sessionId);
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
    /// <summary>True when the hash uses an old format or cost and should be re-hashed after a successful login.</summary>
    bool NeedsRehash(string passwordHash);
}

public record GoogleIdentity(string Subject, string Email, string? Name, string? PictureUrl);

public interface IGoogleTokenValidator
{
    /// <summary>
    /// Validates a Google ID token (One Tap) or OAuth access token (popup) against our client id.
    /// Returns null when the token is invalid, expired, for another app, or the e-mail isn't verified.
    /// </summary>
    Task<GoogleIdentity?> ValidateAsync(string token, CancellationToken ct = default);
}

public interface ISmsSender
{
    Task SendAsync(string phoneNumber, string message, CancellationToken ct = default);
}

public interface IEmailSender
{
    Task SendAsync(string email, string subject, string body, CancellationToken ct = default);
}

/// <summary>Where a request came from — stored on sessions so members can recognise their devices.</summary>
public record ClientInfo(string? IpAddress, string? UserAgent);
