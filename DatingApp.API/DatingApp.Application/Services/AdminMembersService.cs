using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Common.Security;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>
/// Staff back office (S04-T07): dashboard counts, members list / search, block / deactivate, password reset.
/// Every change is written to the audit log with the staff member and the reason.
/// Status: Blocked (can't sign in, or profile suspended) · Deactivated (hidden; signing in brings it back) ·
/// Incomplete (no profile or draft) · PendingReview (submitted / changes requested / resubmitted) · Active (approved).
/// </summary>
public interface IAdminMembersService
{
    Task<AdminStatsDto> GetStatsAsync(CancellationToken ct = default);
    Task<PagedResult<AdminMemberDto>> ListAsync(string? search, string? status, int page, int pageSize, CancellationToken ct = default);
    Task SetStatusAsync(Guid staffUserId, Guid userId, MemberStatusDto dto, CancellationToken ct = default);
    Task ResetPasswordAsync(Guid staffUserId, Guid userId, CancellationToken ct = default);
}

public class AdminMembersService : IAdminMembersService
{
    public const int MaxPageSize = 100;
    public const int ActiveDays = 30;
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ISmsSender _sms;

    public AdminMembersService(IApplicationDbContext context, IPasswordHasher passwordHasher, ISmsSender sms)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _sms = sms;
    }

    private IQueryable<User> Members => _context.Users.AsNoTracking().Where(u => u.Role == Roles.Member);

    public async Task<AdminStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var activeSince = now.AddDays(-ActiveDays);
        var weekAgo = now.AddDays(-7);
        var members = Members;

        return new AdminStatsDto
        {
            TotalMembers = await members.CountAsync(ct),
            NewThisWeek = await members.CountAsync(u => u.CreatedAt >= weekAgo, ct),
            ActiveMembers = await members.CountAsync(u => u.IsActive && u.DeactivatedAt == null &&
                _context.RefreshTokens.Any(t => t.UserId == u.Id && t.CreatedAt >= activeSince), ct),
            PendingReviews = await members.CountAsync(u => u.Profile != null && u.Profile.Status == ProfileStatus.Submitted, ct),
            KycUpdates = await members.CountAsync(u => u.Profile != null && u.Profile.Status == ProfileStatus.Resubmitted, ct),
            IncompleteRegistrations = await members.CountAsync(u => u.IsActive && u.DeactivatedAt == null &&
                (u.Profile == null || u.Profile.Status == ProfileStatus.Draft), ct),
            Blocked = await members.CountAsync(u => u.DeletionRequestedAt == null && (!u.IsActive || (u.Profile != null && u.Profile.Status == ProfileStatus.Suspended)), ct),
            PaidMembers = await members.CountAsync(u => _context.Subscriptions.Any(s =>
                s.UserId == u.Id && s.Status == SubscriptionStatus.Active && s.StartsAt <= now && s.EndsAt > now), ct)
        };
    }

    public async Task<PagedResult<AdminMemberDto>> ListAsync(string? search, string? status, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize <= 0 ? 10 : pageSize, 1, MaxPageSize);
        var query = Members;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            var lower = s.ToLowerInvariant();
            var digits = new string(s.Where(char.IsDigit).ToArray());
            if (digits.StartsWith('0')) digits = digits[1..]; // 077… → matches +9477…
            var byPhone = digits.Length >= 3;
            query = query.Where(u =>
                u.FullName.Contains(s) ||
                (u.Email != null && u.Email.Contains(lower)) ||
                (byPhone && u.PhoneNumber.Contains(digits)) ||
                (u.Profile != null && (u.Profile.FullName.Contains(s) || u.Profile.Code.Contains(s))));
        }

        query = (status ?? "all").Trim().ToLowerInvariant() switch
        {
            "all" or "" => query,
            "blocked" => query.Where(u => u.DeletionRequestedAt == null && (!u.IsActive || (u.Profile != null && u.Profile.Status == ProfileStatus.Suspended))),
            "deactivated" => query.Where(u => u.DeletionRequestedAt != null ||
                (u.IsActive && u.DeactivatedAt != null && (u.Profile == null || u.Profile.Status != ProfileStatus.Suspended))),
            "incomplete" => query.Where(u => u.IsActive && u.DeactivatedAt == null && (u.Profile == null || u.Profile.Status == ProfileStatus.Draft)),
            "pendingreview" => query.Where(u => u.IsActive && u.DeactivatedAt == null && u.Profile != null &&
                (u.Profile.Status == ProfileStatus.Submitted || u.Profile.Status == ProfileStatus.Resubmitted || u.Profile.Status == ProfileStatus.ChangesRequested)),
            "active" => query.Where(u => u.IsActive && u.DeactivatedAt == null && u.Profile != null && u.Profile.Status == ProfileStatus.Approved),
            _ => throw AppException.Validation("Status must be Active, PendingReview, Incomplete, Deactivated or Blocked.", "status")
        };

        var total = await query.CountAsync(ct);
        var rows = await query.OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.PhoneNumber,
                u.Email,
                u.IsActive,
                u.DeactivatedAt,
                u.DeletionRequestedAt,
                u.StatusReason,
                u.CreatedAt,
                ProfileId = u.Profile != null ? (Guid?)u.Profile.Id : null,
                ProfileName = u.Profile != null ? u.Profile.FullName : null,
                Code = u.Profile != null ? u.Profile.Code : null,
                Gender = u.Profile != null ? (Gender?)u.Profile.Gender : null,
                ProfileStatus = u.Profile != null ? (ProfileStatus?)u.Profile.Status : null
            })
            .ToListAsync(ct);

        var ids = rows.Select(r => r.Id).ToList();
        var now = DateTime.UtcNow;
        var lastActive = await _context.RefreshTokens.AsNoTracking().Where(t => ids.Contains(t.UserId))
            .GroupBy(t => t.UserId).Select(g => new { UserId = g.Key, At = g.Max(t => t.CreatedAt) })
            .ToDictionaryAsync(x => x.UserId, x => x.At, ct);
        var plans = await _context.Subscriptions.AsNoTracking()
            .Where(s => ids.Contains(s.UserId) && s.Status == SubscriptionStatus.Active && s.StartsAt <= now && s.EndsAt > now)
            .Select(s => new { s.UserId, s.PlanId }).ToListAsync(ct);

        return new PagedResult<AdminMemberDto>
        {
            Items = rows.Select(r =>
            {
                var plan = plans.Where(p => p.UserId == r.Id).Select(p => p.PlanId).OrderByDescending(SubscriptionRules.Rank).FirstOrDefault() ?? Plans.Free;
                return new AdminMemberDto
                {
                    UserId = r.Id,
                    ProfileId = r.ProfileId,
                    Code = string.IsNullOrWhiteSpace(r.Code) ? null : r.Code,
                    FullName = !string.IsNullOrWhiteSpace(r.ProfileName) ? r.ProfileName : r.FullName,
                    PhoneNumber = r.PhoneNumber,
                    Email = r.Email,
                    Gender = r.Gender?.ToString(),
                    Plan = plan switch { Plans.Platinum => "Platinum", Plans.Gold => "Gold", _ => "Free" },
                    Status = r.DeletionRequestedAt != null ? "Deactivated" : StatusOf(r.IsActive, r.DeactivatedAt, r.ProfileStatus),
                    StatusReason = r.DeletionRequestedAt != null
                        ? $"Deleted by the member on {r.DeletionRequestedAt:d MMM yyyy}; data erased after {AccountService.EraseAfterDays} days"
                        : r.StatusReason,
                    JoinedAt = r.CreatedAt,
                    LastActiveAt = lastActive.TryGetValue(r.Id, out var at) ? at : null
                };
            }).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    internal static string StatusOf(bool isActive, DateTime? deactivatedAt, ProfileStatus? profile) =>
        !isActive || profile == ProfileStatus.Suspended ? "Blocked"
        : deactivatedAt != null ? "Deactivated"
        : profile is null or ProfileStatus.Draft ? "Incomplete"
        : profile == ProfileStatus.Approved ? "Active"
        : "PendingReview";

    public async Task SetStatusAsync(Guid staffUserId, Guid userId, MemberStatusDto dto, CancellationToken ct = default)
    {
        var action = (dto.Action ?? string.Empty).Trim().ToLowerInvariant();
        if (action is not ("activate" or "deactivate" or "block" or "unblock"))
            throw AppException.Validation("Action must be activate, deactivate, block or unblock.", "action");
        var reason = string.IsNullOrWhiteSpace(dto.Reason) ? null : dto.Reason.Trim();
        if (reason?.Length > 500) throw AppException.Validation("Keep the reason under 500 characters.", "reason");
        if (action is "deactivate" or "block" && reason == null)
            throw AppException.Validation("Give a reason. It is kept in the member's history.", "reason");
        if (userId == staffUserId) throw AppException.Forbidden("You can't change your own account here.");

        var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw AppException.NotFound("Member not found.");
        if (user.Role != Roles.Member) throw AppException.Forbidden("Staff accounts are managed in Roles & staff.");
        if (user.DeletionRequestedAt != null) throw AppException.Conflict("This member deleted their account. It can't be changed.");
        var profile = user.Profile;
        var now = DateTime.UtcNow;

        switch (action)
        {
            case "block":
                if (!user.IsActive) throw AppException.Conflict("This member is already blocked.");
                user.IsActive = false;
                user.StatusReason = reason;
                await EndSessionsAsync(user, now, ct);
                break;
            case "unblock":
                var suspended = profile?.Status == ProfileStatus.Suspended;
                if (user.IsActive && !suspended) throw AppException.Conflict("This member isn't blocked.");
                user.IsActive = true;
                user.StatusReason = user.DeactivatedAt != null ? user.StatusReason : null;
                if (suspended && profile != null)
                {
                    // a profile suspended by moderators comes back too (same as Reinstate on the review screen)
                    profile.Status = ProfileStatus.Approved;
                    profile.UpdatedAt = now;
                    _context.ProfileReviewLogs.Add(new ProfileReviewLog
                    {
                        ProfileId = profile.Id,
                        ModeratorUserId = staffUserId,
                        Action = ReviewAction.Reinstated,
                        Note = reason ?? "Unblocked in the members list"
                    });
                }
                break;
            case "deactivate":
                if (user.DeactivatedAt != null) throw AppException.Conflict("This account is already deactivated.");
                user.DeactivatedAt = now;
                user.StatusReason = reason;
                await EndSessionsAsync(user, now, ct);
                break;
            case "activate":
                if (!user.IsActive) throw AppException.Conflict("This member is blocked. Unblock them instead.");
                if (user.DeactivatedAt == null) throw AppException.Conflict("This account is already active.");
                user.DeactivatedAt = null;
                user.StatusReason = null;
                break;
        }

        if (profile != null) profile.IsHidden = !user.IsActive || user.DeactivatedAt != null;
        user.UpdatedAt = now;
        Audit(staffUserId, $"member.{action}", user.Id, reason);
        await _context.SaveChangesAsync(ct);
    }

    public async Task ResetPasswordAsync(Guid staffUserId, Guid userId, CancellationToken ct = default)
    {
        if (userId == staffUserId) throw AppException.Forbidden("Change your own password in your account settings.");
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw AppException.NotFound("Member not found.");
        if (user.Role != Roles.Member) throw AppException.Forbidden("Staff accounts are managed in Roles & staff.");

        var now = DateTime.UtcNow;
        // nobody knows the new password: the member sets one through "Forgot password" (SMS code)
        user.PasswordHash = _passwordHasher.HashPassword(SecureTokens.NewToken());
        user.PasswordChangedAt = now;
        user.FailedLoginCount = 0;
        user.LockoutEndsAt = null;
        user.UpdatedAt = now;
        await EndSessionsAsync(user, now, ct);
        Audit(staffUserId, "member.resetPassword", user.Id, null);
        await _context.SaveChangesAsync(ct);

        if (user.IsActive && !string.IsNullOrEmpty(user.PhoneNumber))
            await _sms.SendAsync(user.PhoneNumber,
                "Vikasitha: our support team reset your password. Open Vikasitha, tap \"Forgot password\" and set a new one with the SMS code.", ct);
    }

    private async Task EndSessionsAsync(User user, DateTime now, CancellationToken ct)
    {
        user.SecurityStamp = Guid.NewGuid().ToString("N");
        var tokens = await _context.RefreshTokens.Where(t => t.UserId == user.Id && t.RevokedAt == null).ToListAsync(ct);
        foreach (var t in tokens) t.RevokedAt = now;
    }

    private void Audit(Guid actor, string action, Guid target, string? detail) =>
        _context.AuditLogs.Add(new AuditLog { ActorUserId = actor, Action = action, TargetUserId = target, Detail = detail });
}
