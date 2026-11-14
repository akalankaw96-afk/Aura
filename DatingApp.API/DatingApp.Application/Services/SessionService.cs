using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Common.Security;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>
/// Sign-in sessions: short access token (JWT) + rotating refresh token (httpOnly cookie, stored hashed).
/// Re-using a refresh token that was already rotated revokes the whole session (token theft signal).
/// </summary>
public interface ISessionService
{
    /// <summary>Starts a new session. <paramref name="user"/> must have <c>Profile</c> loaded.</summary>
    Task<AuthResult> StartAsync(User user, ClientInfo client, CancellationToken ct = default);
    Task<AuthResult> RefreshAsync(string? refreshToken, ClientInfo client, CancellationToken ct = default);
    /// <summary>Logout: revokes the session the refresh token belongs to. Unknown tokens are ignored.</summary>
    Task EndAsync(string? refreshToken, CancellationToken ct = default);
    Task<IReadOnlyList<SessionDto>> ListAsync(Guid userId, Guid? currentSessionId, CancellationToken ct = default);
    Task RevokeAsync(Guid userId, Guid sessionId, CancellationToken ct = default);
    /// <summary>Revokes every session of the user, optionally keeping one (e.g. the device that changed the password).</summary>
    Task RevokeAllAsync(Guid userId, Guid? exceptSessionId, CancellationToken ct = default);
    AuthResponseDto ToResponse(User user, AccessToken? accessToken);
}

public class SessionService : ISessionService
{
    /// <summary>Two tabs refreshing at the same moment shouldn't log the member out.</summary>
    private static readonly TimeSpan ReuseGrace = TimeSpan.FromSeconds(15);

    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwt;

    public SessionService(IApplicationDbContext context, IJwtTokenGenerator jwt)
    {
        _context = context;
        _jwt = jwt;
    }

    public async Task<AuthResult> StartAsync(User user, ClientInfo client, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var (entity, raw) = NewRefreshToken(user.Id, Guid.NewGuid(), now, now, client);
        _context.RefreshTokens.Add(entity);
        await _context.SaveChangesAsync(ct);

        var access = _jwt.GenerateAccessToken(user, entity.SessionId);
        return new AuthResult(ToResponse(user, access), raw, entity.ExpiresAt);
    }

    public async Task<AuthResult> RefreshAsync(string? refreshToken, ClientInfo client, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) throw AppException.Unauthenticated();

        var now = DateTime.UtcNow;
        var hash = SecureTokens.Hash(refreshToken);
        var stored = await _context.RefreshTokens
            .Include(t => t.User!).ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (stored?.User == null) throw AppException.Unauthenticated();

        if (stored.RevokedAt != null)
        {
            var rotatedJustNow = stored.ReplacedByTokenId != null && now - stored.RevokedAt.Value < ReuseGrace;
            if (stored.ReplacedByTokenId != null && !rotatedJustNow)
            {
                // A rotated token came back: someone else may hold it. End the whole session.
                await RevokeSessionTokensAsync(stored.UserId, stored.SessionId, now, ct);
                await _context.SaveChangesAsync(ct);
            }
            throw AppException.Unauthenticated("Your session has ended. Please log in again.");
        }

        if (stored.ExpiresAt <= now || !stored.User.IsActive)
        {
            throw AppException.Unauthenticated("Your session has ended. Please log in again.");
        }

        var (next, raw) = NewRefreshToken(stored.UserId, stored.SessionId, stored.SessionStartedAt, now, client);
        stored.RevokedAt = now;
        stored.ReplacedByTokenId = next.Id;
        _context.RefreshTokens.Add(next);
        await _context.SaveChangesAsync(ct);

        var access = _jwt.GenerateAccessToken(stored.User, stored.SessionId);
        return new AuthResult(ToResponse(stored.User, access), raw, next.ExpiresAt);
    }

    public async Task EndAsync(string? refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return;

        var hash = SecureTokens.Hash(refreshToken);
        var stored = await _context.RefreshTokens.AsNoTracking()
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (stored == null) return;

        await RevokeSessionTokensAsync(stored.UserId, stored.SessionId, DateTime.UtcNow, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<SessionDto>> ListAsync(Guid userId, Guid? currentSessionId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var active = await _context.RefreshTokens.AsNoTracking()
            .Where(t => t.UserId == userId && t.RevokedAt == null && t.ExpiresAt > now)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        return active
            .GroupBy(t => t.SessionId)
            .Select(g => g.First())
            .Select(t => new SessionDto
            {
                Id = t.SessionId,
                Device = DescribeDevice(t.UserAgent),
                IpAddress = t.CreatedByIp,
                SignedInAt = t.SessionStartedAt,
                LastActiveAt = t.CreatedAt,
                IsCurrent = t.SessionId == currentSessionId
            })
            .ToList();
    }

    public async Task RevokeAsync(Guid userId, Guid sessionId, CancellationToken ct = default)
    {
        var count = await RevokeSessionTokensAsync(userId, sessionId, DateTime.UtcNow, ct);
        if (count == 0) throw AppException.NotFound("Session not found.");
        await _context.SaveChangesAsync(ct);
    }

    public async Task RevokeAllAsync(Guid userId, Guid? exceptSessionId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null && t.SessionId != exceptSessionId)
            .ToListAsync(ct);
        foreach (var token in tokens) token.RevokedAt = now;
        // Caller saves (keeps the password change and the revocation in one transaction).
    }

    public AuthResponseDto ToResponse(User user, AccessToken? accessToken)
    {
        var profile = user.Profile;
        var hasProfile = profile != null;
        return new AuthResponseDto
        {
            Token = accessToken?.Token ?? string.Empty,
            TokenExpiresAt = accessToken?.ExpiresAt ?? default,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            PhoneVerified = user.PhoneVerified,
            Role = user.Role,
            ProfileId = profile?.Id,
            HasCompletedProfile = hasProfile,
            IsVerified = profile?.Verified ?? false,
            IsUnderReview = hasProfile && !profile!.Verified,
            IsPremium = profile?.Premium ?? false,
            PlanId = (profile?.Premium ?? false) ? "premium" : "free",
            PhotoUrl = profile?.PhotoUrl
        };
    }

    private async Task<int> RevokeSessionTokensAsync(Guid userId, Guid sessionId, DateTime now, CancellationToken ct)
    {
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && t.SessionId == sessionId && t.RevokedAt == null)
            .ToListAsync(ct);
        foreach (var token in tokens) token.RevokedAt = now;
        return tokens.Count;
    }

    private static (RefreshToken Entity, string Raw) NewRefreshToken(
        Guid userId, Guid sessionId, DateTime sessionStartedAt, DateTime now, ClientInfo client)
    {
        var raw = SecureTokens.NewToken();
        var entity = new RefreshToken
        {
            UserId = userId,
            SessionId = sessionId,
            SessionStartedAt = sessionStartedAt,
            TokenHash = SecureTokens.Hash(raw),
            CreatedAt = now,
            ExpiresAt = now.Add(AuthRules.RefreshTokenLifetime),
            CreatedByIp = Truncate(client.IpAddress, 45),
            UserAgent = Truncate(client.UserAgent, 512)
        };
        return (entity, raw);
    }

    private static string? Truncate(string? value, int max) =>
        value is null ? null : value.Length <= max ? value : value[..max];

    /// <summary>"Chrome on Windows", "Safari on iPhone"… — good enough for members to recognise a device.</summary>
    internal static string DescribeDevice(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent)) return "Unknown device";
        var ua = userAgent;

        string browser =
            ua.Contains("Edg/") ? "Edge" :
            ua.Contains("OPR/") ? "Opera" :
            ua.Contains("SamsungBrowser") ? "Samsung Internet" :
            ua.Contains("Chrome/") ? "Chrome" :
            ua.Contains("Firefox/") ? "Firefox" :
            ua.Contains("Safari/") ? "Safari" : "Browser";

        string os =
            ua.Contains("iPhone") ? "iPhone" :
            ua.Contains("iPad") ? "iPad" :
            ua.Contains("Android") ? "Android" :
            ua.Contains("Windows") ? "Windows" :
            ua.Contains("Mac OS X") ? "Mac" :
            ua.Contains("Linux") ? "Linux" : "unknown OS";

        return $"{browser} on {os}";
    }
}
