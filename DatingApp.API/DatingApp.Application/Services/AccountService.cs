using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Common.Security;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>
/// The member's own account settings (S04-T08):
///  • "Take a break" — hide the profile from search and best matches; friends, chats and the plan stay.
///  • Delete the account — confirmed with an SMS code. The profile disappears at once, sessions end, the member can't
///    sign in, and the personal data is erased after <see cref="EraseAfterDays"/> days (payment records are kept).
/// The reason is stored without any link to the member.
/// </summary>
public interface IAccountService
{
    Task SetVisibilityAsync(Guid userId, bool hidden, CancellationToken ct = default);
    Task<OtpResponseDto> SendDeleteCodeAsync(Guid userId, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, DeleteAccountDto dto, CancellationToken ct = default);
    /// <summary>Erases accounts whose 30 days are over. Returns how many were erased.</summary>
    Task<int> EraseDueAsync(DateTime utcNow, CancellationToken ct = default);
}

public class AccountService : IAccountService
{
    public const int EraseAfterDays = 30;
    public const string DeletedName = "Deleted member";

    private readonly IApplicationDbContext _context;
    private readonly IOtpService _otp;
    private readonly IFileStorage _storage;
    private readonly IPasswordHasher _passwordHasher;

    public AccountService(IApplicationDbContext context, IOtpService otp, IFileStorage storage, IPasswordHasher passwordHasher)
    {
        _context = context;
        _otp = otp;
        _storage = storage;
        _passwordHasher = passwordHasher;
    }

    public async Task SetVisibilityAsync(Guid userId, bool hidden, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw AppException.Forbidden("Save your profile details first.", ErrorCodes.ProfileRequired);
        var now = DateTime.UtcNow;
        if (hidden && profile.HiddenByMemberAt == null) profile.HiddenByMemberAt = now;
        if (!hidden) profile.HiddenByMemberAt = null;
        profile.UpdatedAt = now;
        await _context.SaveChangesAsync(ct);
    }

    public async Task<OtpResponseDto> SendDeleteCodeAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await RequireUserAsync(userId, ct);
        if (string.IsNullOrEmpty(user.PhoneNumber) || !user.PhoneVerified)
            throw AppException.Validation("We need a verified mobile number to confirm this. Please contact support.", "phone");
        return await _otp.IssueAsync(OtpPurpose.DeleteAccount, OtpChannel.Phone, user.PhoneNumber, user.Id, deliver: true, ct);
    }

    public async Task DeleteAsync(Guid userId, DeleteAccountDto dto, CancellationToken ct = default)
    {
        var reason = (dto.Reason ?? string.Empty).Trim().ToLowerInvariant();
        if (reason.Length == 0) throw AppException.Validation("Tell us why you're leaving.", "reason");
        if (reason.Length > 50) reason = reason[..50];
        var comment = string.IsNullOrWhiteSpace(dto.Comment) ? null : dto.Comment.Trim();
        if (comment?.Length > 1000) throw AppException.Validation("Keep the comment under 1,000 characters.", "comment");

        var user = await RequireUserAsync(userId, ct);
        // throws 400 CODE_INVALID / CODE_EXPIRED / TOO_MANY_ATTEMPTS with attemptsLeft
        await _otp.VerifyAsync(OtpPurpose.DeleteAccount, user.PhoneNumber, dto.Code ?? string.Empty, ct);

        var now = DateTime.UtcNow;
        user.DeletionRequestedAt = now;
        user.IsActive = false;
        user.SecurityStamp = Guid.NewGuid().ToString("N");
        user.UpdatedAt = now;
        var profile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile != null)
        {
            profile.IsHidden = true; // gone from search, profile pages, friends' lists at once
            profile.UpdatedAt = now;
        }
        var tokens = await _context.RefreshTokens.Where(t => t.UserId == userId && t.RevokedAt == null).ToListAsync(ct);
        foreach (var t in tokens) t.RevokedAt = now;

        // pending interests either way end now
        if (profile != null)
        {
            var pending = await _context.MatchRequests
                .Where(r => (r.SenderProfileId == profile.Id || r.ReceiverProfileId == profile.Id) && r.Status == MatchRequestStatus.Pending)
                .ToListAsync(ct);
            foreach (var r in pending)
            {
                r.Status = MatchRequestStatus.Withdrawn;
                r.RespondedAt = now;
            }
        }

        _context.AccountClosureFeedback.Add(new AccountClosureFeedback { Reason = reason, Comment = comment });
        await _context.SaveChangesAsync(ct);
    }

    public async Task<int> EraseDueAsync(DateTime utcNow, CancellationToken ct = default)
    {
        var cutoff = utcNow.AddDays(-EraseAfterDays);
        var due = await _context.Users
            .Where(u => u.DeletionRequestedAt != null && u.DeletionRequestedAt <= cutoff && u.ErasedAt == null)
            .Select(u => u.Id).Take(50).ToListAsync(ct);
        foreach (var id in due) await EraseAsync(id, utcNow, ct);
        return due.Count;
    }

    /// <summary>Removes the member's personal data. Kept: payments, subscriptions, boosts, staff decision logs.</summary>
    internal async Task EraseAsync(Guid userId, DateTime now, CancellationToken ct)
    {
        var user = await _context.Users.FirstAsync(u => u.Id == userId, ct);
        var profile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var files = new List<string>();

        if (profile != null)
        {
            var pid = profile.Id;
            var photos = await _context.ProfilePhotos.Where(p => p.ProfileId == pid).ToListAsync(ct);
            files.AddRange(photos.Select(p => p.StorageKey));
            _context.ProfilePhotos.RemoveRange(photos);
            var docs = await _context.KycDocuments.Where(d => d.ProfileId == pid).ToListAsync(ct);
            files.AddRange(docs.Select(d => d.StorageKey));
            _context.KycDocuments.RemoveRange(docs);
            _context.ProfileReviewFlags.RemoveRange(await _context.ProfileReviewFlags.Where(f => f.ProfileId == pid).ToListAsync(ct));
            _context.ChatMessages.RemoveRange(await _context.ChatMessages.Where(m => m.SenderProfileId == pid || m.ReceiverProfileId == pid).ToListAsync(ct));
            _context.MatchRequests.RemoveRange(await _context.MatchRequests.Where(r => r.SenderProfileId == pid || r.ReceiverProfileId == pid).ToListAsync(ct));
            _context.Shortlists.RemoveRange(await _context.Shortlists.Where(s => s.ProfileId == pid || s.UserId == userId).ToListAsync(ct));
            _context.Blocks.RemoveRange(await _context.Blocks.Where(b => b.BlockerProfileId == pid || b.BlockedProfileId == pid).ToListAsync(ct));
            _context.ProfileViews.RemoveRange(await _context.ProfileViews.Where(v => v.ViewedProfileId == pid || v.ViewerUserId == userId).ToListAsync(ct));

            profile.FullName = DeletedName;
            profile.Bio = string.Empty;
            profile.AboutFamily = string.Empty;
            profile.PhotoUrl = string.Empty;
            profile.Interests = string.Empty;
            profile.SubmittedDetailsJson = null;
            profile.DateOfBirth = null;
            profile.Height = string.Empty;
            profile.Profession = string.Empty;
            profile.Education = string.Empty;
            profile.University = string.Empty;
            profile.Location = string.Empty;
            profile.Community = string.Empty;
            profile.IsHidden = true;
            profile.UpdatedAt = now;
        }
        else
        {
            _context.ProfileViews.RemoveRange(await _context.ProfileViews.Where(v => v.ViewerUserId == userId).ToListAsync(ct));
            _context.Shortlists.RemoveRange(await _context.Shortlists.Where(s => s.UserId == userId).ToListAsync(ct));
        }

        _context.SavedSearches.RemoveRange(await _context.SavedSearches.Where(s => s.UserId == userId).ToListAsync(ct));
        _context.Notifications.RemoveRange(await _context.Notifications.Where(n => n.UserId == userId).ToListAsync(ct));
        _context.UsageCounters.RemoveRange(await _context.UsageCounters.Where(u => u.UserId == userId).ToListAsync(ct));
        _context.OtpCodes.RemoveRange(await _context.OtpCodes.Where(o => o.UserId == userId).ToListAsync(ct));
        _context.PasswordResetTokens.RemoveRange(await _context.PasswordResetTokens.Where(t => t.UserId == userId).ToListAsync(ct));
        _context.RefreshTokens.RemoveRange(await _context.RefreshTokens.Where(t => t.UserId == userId).ToListAsync(ct));

        // receipts are payment records (kept); the member's own note on them is personal
        foreach (var p in await _context.Payments.Where(p => p.UserId == userId && p.MemberNote != null).ToListAsync(ct))
            p.MemberNote = null;

        user.FullName = DeletedName;
        user.Email = null;
        user.PhoneNumber = string.Empty; // the number can be used for a new account
        user.PhoneVerified = false;
        user.GoogleSubject = null;
        user.PasswordHash = _passwordHasher.HashPassword(SecureTokens.NewToken());
        user.StatusReason = null;
        user.ErasedAt = now;
        user.UpdatedAt = now;
        await _context.SaveChangesAsync(ct);

        foreach (var key in files) await _storage.DeleteAsync(key, ct);
    }

    private async Task<User> RequireUserAsync(Guid userId, CancellationToken ct) =>
        await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive && u.DeletionRequestedAt == null, ct)
        ?? throw AppException.Unauthenticated();
}
