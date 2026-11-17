using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>
/// Profile boosts (S04-T05). Approved profiles on Gold / Platinum can buy one (bank transfer, staff approve). A boost
/// starts now, or when the current boost ends (extending). The profile's <c>PromotedUntil</c> is the cache search uses.
/// </summary>
public interface IBoostService
{
    Task<BoostStatusDto> GetMineAsync(Guid userId, CancellationToken ct = default);
    /// <summary>Throws 403 KYC_REQUIRED / 402 PLAN_REQUIRED when the member can't buy a boost.</summary>
    Task EnsureCanBuyAsync(Guid userId, CancellationToken ct = default);
    Task<Boost> GrantAsync(Guid userId, int days, Guid? paymentId, Guid? staffUserId, string? note, CancellationToken ct = default);
}

public class BoostService : IBoostService
{
    public const int MaxDays = 90;
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notifications;

    public BoostService(IApplicationDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task<BoostStatusDto> GetMineAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile == null) return new BoostStatusDto();

        var now = DateTime.UtcNow;
        var running = await _context.Boosts.AsNoTracking()
            .Where(b => b.ProfileId == profile.Id && b.EndsAt > now)
            .ToListAsync(ct);
        var canBuy = profile.Status == ProfileStatus.Approved && await SubscriptionRules.CurrentPlanAsync(_context, userId, now, ct) != Plans.Free;
        var active = running.Any(b => b.StartsAt <= now);
        if (!active) return new BoostStatusDto { CanBuy = canBuy };

        var start = running.Min(b => b.StartsAt);
        var end = running.Max(b => b.EndsAt);
        var views = await _context.ProfileViews.CountAsync(v => v.ViewedProfileId == profile.Id && v.LastViewedAt >= start, ct);
        var interests = await _context.MatchRequests.CountAsync(r => r.ReceiverProfileId == profile.Id && r.CreatedAt >= start, ct);
        return new BoostStatusDto
        {
            Active = true,
            StartsAt = start,
            EndsAt = end,
            DaysLeft = Math.Max(1, (int)Math.Ceiling((end - now).TotalDays)),
            TotalDays = Math.Max(1, (int)Math.Round((end - start).TotalDays)),
            Views = views,
            Interests = interests,
            CanBuy = canBuy
        };
    }

    public async Task EnsureCanBuyAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw AppException.Forbidden("Save your profile details first.", ErrorCodes.ProfileRequired);
        if (profile.Status != ProfileStatus.Approved)
            throw AppException.Forbidden("Your profile must be approved before you can promote it.", ErrorCodes.KycRequired);
        var plan = await SubscriptionRules.CurrentPlanAsync(_context, userId, DateTime.UtcNow, ct);
        if (plan == Plans.Free)
            throw new AppException(402, ErrorCodes.PlanRequired, "Promoting your profile is part of Gold and Platinum. Upgrade first.",
                new Dictionary<string, object?> { ["feature"] = "Boost", ["planId"] = plan });
    }

    public async Task<Boost> GrantAsync(Guid userId, int days, Guid? paymentId, Guid? staffUserId, string? note, CancellationToken ct = default)
    {
        if (days is < 1 or > MaxDays) throw AppException.Validation($"A boost lasts 1 to {MaxDays} days.", "days");
        var profile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw AppException.NotFound("This member has no profile yet.");
        if (paymentId.HasValue && await _context.Boosts.AnyAsync(b => b.PaymentId == paymentId, ct))
            throw AppException.Conflict("This payment has already started a boost.", ErrorCodes.PaymentAlreadyUsed);
        note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        if (note?.Length > 500) note = note[..500];

        var now = DateTime.UtcNow;
        var currentEnd = await _context.Boosts.Where(b => b.ProfileId == profile.Id && b.EndsAt > now)
            .Select(b => (DateTime?)b.EndsAt).MaxAsync(ct);
        var startsAt = currentEnd ?? now;

        var boost = new Boost
        {
            UserId = userId,
            ProfileId = profile.Id,
            StartsAt = startsAt,
            EndsAt = startsAt.AddDays(days),
            PaymentId = paymentId,
            GrantedByUserId = staffUserId,
            Note = note
        };
        _context.Boosts.Add(boost);
        profile.PromotedUntil = boost.EndsAt;
        profile.UpdatedAt = now;
        await _context.SaveChangesAsync(ct);

        var extended = currentEnd.HasValue;
        await _notifications.NotifyAsync(userId, "boost.started",
            extended ? "Promotion extended" : "Your profile is promoted",
            $"{(paymentId.HasValue ? "Payment confirmed. " : string.Empty)}You're at the top of matching searches until {boost.EndsAt:d MMM yyyy}.",
            "/dashboard", sms: paymentId.HasValue, ct);
        await _context.SaveChangesAsync(ct);
        return boost;
    }
}
