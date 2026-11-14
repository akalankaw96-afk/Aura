using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Common.Security;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>
/// Forgot / reset / change password (S01-T16). Responses never reveal whether an account exists.
/// After any password change every other session is signed out and the member is told by e-mail or SMS.
/// </summary>
public interface IPasswordService
{
    Task RequestResetAsync(ForgotPasswordDto dto, CancellationToken ct = default);
    Task<ResetTokenResponseDto> VerifyResetCodeAsync(VerifyResetCodeDto dto, CancellationToken ct = default);
    Task ResetPasswordAsync(ResetPasswordDto dto, CancellationToken ct = default);
    Task ChangePasswordAsync(Guid userId, Guid? currentSessionId, ChangePasswordDto dto, CancellationToken ct = default);
}

public class PasswordService : IPasswordService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IOtpService _otp;
    private readonly ISessionService _sessions;
    private readonly ISmsSender _sms;
    private readonly IEmailSender _email;

    public PasswordService(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IOtpService otp,
        ISessionService sessions,
        ISmsSender sms,
        IEmailSender email)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _otp = otp;
        _sessions = sessions;
        _sms = sms;
        _email = email;
    }

    public async Task RequestResetAsync(ForgotPasswordDto dto, CancellationToken ct = default)
    {
        var (channel, destination) = ParseDestination(dto);
        var user = await FindUserAsync(channel, destination, ct);

        // Unknown or suspended accounts get a code record too (never sent), so timing and limits look the same.
        await _otp.IssueAsync(OtpPurpose.ResetPassword, channel, destination, user?.Id,
            deliver: user is { IsActive: true }, ct);
    }

    public async Task<ResetTokenResponseDto> VerifyResetCodeAsync(VerifyResetCodeDto dto, CancellationToken ct = default)
    {
        var (_, destination) = ParseDestination(dto);
        var otp = await _otp.VerifyAsync(OtpPurpose.ResetPassword, destination, dto.Code, ct);

        // A code issued for an unknown account was never sent; treat a lucky guess as wrong.
        if (otp.UserId is not Guid userId)
        {
            throw new AppException(400, ErrorCodes.CodeInvalid, "That code isn't right.",
                new Dictionary<string, object?> { ["attemptsLeft"] = 0 });
        }

        var raw = SecureTokens.NewToken();
        _context.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = userId,
            TokenHash = SecureTokens.Hash(raw),
            ExpiresAt = DateTime.UtcNow.Add(AuthRules.ResetTokenLifetime)
        });
        await _context.SaveChangesAsync(ct);

        return new ResetTokenResponseDto
        {
            ResetToken = raw,
            ExpiresInSeconds = (int)AuthRules.ResetTokenLifetime.TotalSeconds
        };
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto, CancellationToken ct = default)
    {
        Identifiers.EnsureStrongPassword(dto.NewPassword, "newPassword");

        var now = DateTime.UtcNow;
        var hash = SecureTokens.Hash(dto.ResetToken);
        var token = await _context.PasswordResetTokens.Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (token?.User == null || token.UsedAt != null || token.ExpiresAt <= now || !token.User.IsActive)
        {
            throw new AppException(400, ErrorCodes.ResetTokenInvalid,
                "This reset link has expired. Please start again.");
        }

        token.UsedAt = now;
        SetPassword(token.User, dto.NewPassword, now);
        token.User.LockoutEndsAt = null;
        token.User.FailedLoginCount = 0;
        await _sessions.RevokeAllAsync(token.User.Id, exceptSessionId: null, ct);
        await _context.SaveChangesAsync(ct);

        await NotifyPasswordChangedAsync(token.User, ct);
    }

    public async Task ChangePasswordAsync(Guid userId, Guid? currentSessionId, ChangePasswordDto dto, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw AppException.Unauthenticated();

        if (!_passwordHasher.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
        {
            throw AppException.Validation("Your current password isn't right.", "currentPassword");
        }
        if (dto.CurrentPassword == dto.NewPassword)
        {
            throw AppException.Validation("Choose a password you haven't used here before.", "newPassword");
        }
        Identifiers.EnsureStrongPassword(dto.NewPassword, "newPassword");

        SetPassword(user, dto.NewPassword, DateTime.UtcNow);
        await _sessions.RevokeAllAsync(user.Id, exceptSessionId: currentSessionId, ct); // keep this device signed in
        await _context.SaveChangesAsync(ct);

        await NotifyPasswordChangedAsync(user, ct);
    }

    private void SetPassword(User user, string newPassword, DateTime now)
    {
        user.PasswordHash = _passwordHasher.HashPassword(newPassword);
        user.PasswordChangedAt = now;
        user.SecurityStamp = Guid.NewGuid().ToString("N");
        user.UpdatedAt = now;
    }

    private static (OtpChannel Channel, string Destination) ParseDestination(ForgotPasswordDto dto) =>
        dto.Channel == "phone"
            ? (OtpChannel.Phone, Identifiers.RequirePhone(dto.Value, "value"))
            : (OtpChannel.Email, Identifiers.RequireEmail(dto.Value, "value"));

    private Task<User?> FindUserAsync(OtpChannel channel, string destination, CancellationToken ct) =>
        channel == OtpChannel.Phone
            ? _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == destination, ct)
            : _context.Users.FirstOrDefaultAsync(u => u.Email == destination, ct);

    /// <summary>"Your password was changed" — so a member notices if it wasn't them.</summary>
    private Task NotifyPasswordChangedAsync(User user, CancellationToken ct)
    {
        const string text = "Your Vikasitha password was just changed and other devices were signed out. " +
                            "If this wasn't you, reset your password now and contact support.";

        var hasRealEmail = !user.Email.StartsWith("phone_", StringComparison.Ordinal);
        if (hasRealEmail) return _email.SendAsync(user.Email, "Your password was changed", text, ct);
        return string.IsNullOrEmpty(user.PhoneNumber) ? Task.CompletedTask : _sms.SendAsync(user.PhoneNumber, text, ct);
    }
}
