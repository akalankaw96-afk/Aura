using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Common.Security;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>
/// 6-digit codes by SMS or e-mail (BUG-001). Stored hashed; 5-minute lifetime; 5 tries; 60 s between sends;
/// 3 resends per hour. The code is never returned by the API.
/// </summary>
public interface IOtpService
{
    /// <param name="deliver">False when no account matches (forgot password): same response, nothing sent.</param>
    Task<OtpResponseDto> IssueAsync(OtpPurpose purpose, OtpChannel channel, string destination, Guid? userId,
        bool deliver, CancellationToken ct = default);

    /// <summary>Checks and consumes the code. Throws <see cref="AppException"/> (400) when it doesn't match.</summary>
    Task<OtpCode> VerifyAsync(OtpPurpose purpose, string destination, string code, CancellationToken ct = default);
}

public class OtpService : IOtpService
{
    private readonly IApplicationDbContext _context;
    private readonly ISmsSender _sms;
    private readonly IEmailSender _email;

    public OtpService(IApplicationDbContext context, ISmsSender sms, IEmailSender email)
    {
        _context = context;
        _sms = sms;
        _email = email;
    }

    public async Task<OtpResponseDto> IssueAsync(OtpPurpose purpose, OtpChannel channel, string destination, Guid? userId,
        bool deliver, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var current = await LatestAsync(purpose, destination, now, ct);

        if (current != null)
        {
            var wait = current.LastSentAt.Add(AuthRules.CodeResendWait) - now;
            if (wait > TimeSpan.Zero)
            {
                throw AppException.RateLimited("Please wait before requesting another code.", (int)Math.Ceiling(wait.TotalSeconds));
            }
            if (current.ResendCount >= AuthRules.CodeMaxResends)
            {
                var retry = current.CreatedAt.Add(AuthRules.CodeWindow) - now;
                throw AppException.RateLimited("Too many codes requested. Please try again later.", (int)Math.Ceiling(retry.TotalSeconds));
            }
        }

        var code = SecureTokens.NewCode();
        if (current == null)
        {
            current = new OtpCode
            {
                Purpose = purpose,
                Channel = channel,
                Destination = destination,
                UserId = userId,
                CreatedAt = now
            };
            _context.OtpCodes.Add(current);
        }
        else
        {
            current.ResendCount += 1;
            current.UpdatedAt = now;
        }

        current.CodeHash = SecureTokens.HashCode(destination, code);
        current.ExpiresAt = now.Add(AuthRules.CodeLifetime);
        current.LastSentAt = now;
        current.FailedAttempts = 0;
        await _context.SaveChangesAsync(ct);

        if (deliver)
        {
            await DeliverAsync(purpose, channel, destination, code, ct);
        }

        return new OtpResponseDto
        {
            Success = true,
            Message = channel == OtpChannel.Phone ? "We sent a 6-digit code by SMS." : "We sent a 6-digit code by email.",
            ExpiresInSeconds = (int)AuthRules.CodeLifetime.TotalSeconds,
            ResendAvailableInSeconds = (int)AuthRules.CodeResendWait.TotalSeconds,
            ResendsLeft = AuthRules.CodeMaxResends - current.ResendCount
        };
    }

    public async Task<OtpCode> VerifyAsync(OtpPurpose purpose, string destination, string code, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var current = await LatestAsync(purpose, destination, now, ct);

        if (current == null || current.ExpiresAt <= now)
        {
            throw new AppException(400, ErrorCodes.CodeExpired, "This code has expired. Request a new one.",
                AttemptsLeft(0));
        }
        if (current.FailedAttempts >= AuthRules.CodeMaxAttempts)
        {
            throw new AppException(400, ErrorCodes.TooManyAttempts, "Too many incorrect tries. Request a new code.",
                AttemptsLeft(0));
        }

        var matches = SecureTokens.HashEquals(current.CodeHash, SecureTokens.HashCode(destination, (code ?? string.Empty).Trim()));
        if (!matches)
        {
            current.FailedAttempts += 1;
            await _context.SaveChangesAsync(ct);

            var left = Math.Max(0, AuthRules.CodeMaxAttempts - current.FailedAttempts);
            throw left == 0
                ? new AppException(400, ErrorCodes.TooManyAttempts, "Too many incorrect tries. Request a new code.", AttemptsLeft(0))
                : new AppException(400, ErrorCodes.CodeInvalid, "That code isn't right.", AttemptsLeft(left));
        }

        current.ConsumedAt = now;
        await _context.SaveChangesAsync(ct);
        return current;
    }

    /// <summary>The newest unused code for this destination inside the current window (covers resends).</summary>
    private Task<OtpCode?> LatestAsync(OtpPurpose purpose, string destination, DateTime now, CancellationToken ct)
    {
        var windowStart = now - AuthRules.CodeWindow;
        return _context.OtpCodes
            .Where(o => o.Purpose == purpose && o.Destination == destination && o.ConsumedAt == null && o.CreatedAt > windowStart)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);
    }

    private Task DeliverAsync(OtpPurpose purpose, OtpChannel channel, string destination, string code, CancellationToken ct)
    {
        var minutes = (int)AuthRules.CodeLifetime.TotalMinutes;
        var text = purpose == OtpPurpose.ResetPassword
            ? $"Your Vikasitha password reset code is {code}. It expires in {minutes} minutes. Never share this code."
            : $"Your Vikasitha verification code is {code}. It expires in {minutes} minutes. Never share this code.";

        return channel == OtpChannel.Phone
            ? _sms.SendAsync(destination, text, ct)
            : _email.SendAsync(destination, "Your Vikasitha code", text, ct);
    }

    private static Dictionary<string, object?> AttemptsLeft(int left) => new() { ["attemptsLeft"] = left };
}
