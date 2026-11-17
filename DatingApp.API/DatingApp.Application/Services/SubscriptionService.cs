using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>
/// Gold / Platinum periods (S04-T02). The member's plan is the best subscription running now; plans don't auto-renew,
/// so buying again adds a period that starts when the current one ends. Expiry and the 3-day reminder run hourly.
/// </summary>
public interface ISubscriptionService
{
    Task<MySubscriptionDto> GetMineAsync(Guid userId, CancellationToken ct = default);
    /// <summary>Adds a period (after a payment is approved, or by staff). Saves.</summary>
    Task<SubscriptionDto> GrantAsync(Guid userId, string planId, int months, Guid? paymentId, Guid? staffUserId, string? note, CancellationToken ct = default);
    Task CancelAsync(Guid subscriptionId, Guid staffUserId, string? note, CancellationToken ct = default);
    /// <summary>Expires ended periods, sends "ends in 3 days" reminders, refreshes plan caches. Returns (expired, reminded).</summary>
    Task<(int Expired, int Reminded)> RunMaintenanceAsync(DateTime utcNow, CancellationToken ct = default);
}

/// <summary>Plan rules shared with UsageService and SessionService.</summary>
public static class SubscriptionRules
{
    public static int Rank(string planId) => planId switch { Plans.Platinum => 2, Plans.Gold => 1, _ => 0 };

    /// <summary>The member's plan right now, from their subscriptions ("free" when none is running).</summary>
    public static async Task<string> CurrentPlanAsync(IApplicationDbContext context, Guid userId, DateTime? utcNow = null, CancellationToken ct = default)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var running = await context.Subscriptions.AsNoTracking()
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active && s.StartsAt <= now && s.EndsAt > now)
            .Select(s => s.PlanId)
            .ToListAsync(ct);
        return running.OrderByDescending(Rank).FirstOrDefault() ?? Plans.Free;
    }
}

public class SubscriptionService : ISubscriptionService
{
    public const int ReminderDays = 3;
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notifications;

    public SubscriptionService(IApplicationDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task<MySubscriptionDto> GetMineAsync(Guid userId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var subs = await _context.Subscriptions.AsNoTracking().Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartsAt).ToListAsync(ct);
        var plan = Current(subs, now);
        var ends = plan == Plans.Free ? (DateTime?)null : ChainEnd(subs, plan, now);
        return new MySubscriptionDto
        {
            PlanId = plan,
            EndsAt = ends,
            DaysLeft = ends.HasValue ? Math.Max(0, (int)Math.Ceiling((ends.Value - now).TotalDays)) : 0,
            Items = subs.Select(s => ToDto(s, now)).ToList()
        };
    }

    public async Task<SubscriptionDto> GrantAsync(Guid userId, string planId, int months, Guid? paymentId, Guid? staffUserId, string? note, CancellationToken ct = default)
    {
        planId = (planId ?? string.Empty).Trim().ToLowerInvariant();
        if (planId is not (Plans.Gold or Plans.Platinum)) throw AppException.Validation("Plan must be gold or platinum.", "planId");
        if (months is < 1 or > 24) throw AppException.Validation("A plan lasts 1 to 24 months.", "months");
        note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        if (note?.Length > 500) note = note[..500];

        var profile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw AppException.NotFound("This member has no profile yet.");
        // a payment starts one period only (S04-T04); the unique index on PaymentId backs this up
        if (paymentId.HasValue && await _context.Subscriptions.AnyAsync(s => s.PaymentId == paymentId, ct))
            throw AppException.Conflict("This payment has already started a plan.", ErrorCodes.PaymentAlreadyUsed);

        var now = DateTime.UtcNow;
        // a new period starts now, or when the running periods of the same or a better plan end (renewing early adds time)
        var blocking = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active && s.EndsAt > now)
            .ToListAsync(ct);
        var startsAt = blocking.Where(s => SubscriptionRules.Rank(s.PlanId) >= SubscriptionRules.Rank(planId))
            .Select(s => s.EndsAt).DefaultIfEmpty(now).Max();
        if (startsAt < now) startsAt = now;

        var sub = new Subscription
        {
            UserId = userId,
            PlanId = planId,
            StartsAt = startsAt,
            EndsAt = startsAt.AddMonths(months),
            PaymentId = paymentId,
            GrantedByUserId = staffUserId,
            Note = note
        };
        _context.Subscriptions.Add(sub);
        await _context.SaveChangesAsync(ct);
        await SyncCacheAsync(profile, now, ct);

        var name = planId == Plans.Platinum ? "Platinum" : "Gold";
        var upcoming = startsAt > now.AddMinutes(1);
        // a confirmed bank payment also goes out by SMS (S04-T04); staff grants stay in-app only
        var paid = paymentId.HasValue ? "Payment confirmed. " : string.Empty;
        await _notifications.NotifyAsync(userId, "plan.started",
            upcoming ? $"{name} renewed" : $"You're on {name}",
            upcoming
                ? $"{paid}Your {name} plan continues until {sub.EndsAt:d MMM yyyy}."
                : $"{paid}{name} is active until {sub.EndsAt:d MMM yyyy}. Enjoy unlimited searches, views, interests and chats.",
            "/dashboard", sms: paymentId.HasValue, ct);
        await _context.SaveChangesAsync(ct);
        return ToDto(sub, now);
    }

    public async Task CancelAsync(Guid subscriptionId, Guid staffUserId, string? note, CancellationToken ct = default)
    {
        var sub = await _context.Subscriptions.FirstOrDefaultAsync(s => s.Id == subscriptionId, ct)
            ?? throw AppException.NotFound("Subscription not found.");
        if (sub.Status != SubscriptionStatus.Active) throw AppException.Conflict("This plan period has already ended.");
        if (string.IsNullOrWhiteSpace(note)) throw AppException.Validation("Give a reason for cancelling.", "note");

        sub.Status = SubscriptionStatus.Cancelled;
        sub.Note = $"{(sub.Note != null ? sub.Note + " · " : "")}Cancelled: {note.Trim()}";
        if (sub.Note.Length > 500) sub.Note = sub.Note[..500];
        sub.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        var profile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == sub.UserId, ct);
        if (profile != null) await SyncCacheAsync(profile, DateTime.UtcNow, ct);
    }

    public async Task<(int Expired, int Reminded)> RunMaintenanceAsync(DateTime utcNow, CancellationToken ct = default)
    {
        // 1. ended periods
        var ended = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active && s.EndsAt <= utcNow).ToListAsync(ct);
        foreach (var s in ended)
        {
            s.Status = SubscriptionStatus.Expired;
            s.UpdatedAt = utcNow;
        }
        await _context.SaveChangesAsync(ct);

        // 2. "ends in 3 days" — once per period, and only when nothing follows it
        var soon = utcNow.AddDays(ReminderDays);
        var ending = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active && s.ReminderSentAt == null && s.StartsAt <= utcNow && s.EndsAt > utcNow && s.EndsAt <= soon)
            .ToListAsync(ct);
        var reminded = 0;
        foreach (var s in ending)
        {
            var continues = await _context.Subscriptions.AnyAsync(n =>
                n.UserId == s.UserId && n.Id != s.Id && n.Status == SubscriptionStatus.Active && n.StartsAt <= s.EndsAt && n.EndsAt > s.EndsAt, ct);
            s.ReminderSentAt = utcNow;
            if (continues) continue;
            var name = s.PlanId == Plans.Platinum ? "Platinum" : "Gold";
            await _notifications.NotifyAsync(s.UserId, "plan.ending", $"{name} ends soon",
                $"Your {name} plan ends on {s.EndsAt:d MMM yyyy}. Renew to keep unlimited access.", "/plans", sms: true, ct);
            reminded++;
        }
        await _context.SaveChangesAsync(ct);

        // 3. plan caches of everyone whose plan may have changed
        var userIds = ended.Select(s => s.UserId).Distinct().ToList();
        var stale = await _context.CandidateProfiles
            .Where(p => userIds.Contains(p.UserId) || (p.PlanId != Plans.Free && (p.PlanEndsAt == null || p.PlanEndsAt <= utcNow)))
            .ToListAsync(ct);
        foreach (var p in stale) await SyncCacheAsync(p, utcNow, ct, save: false);
        await _context.SaveChangesAsync(ct);

        return (ended.Count, reminded);
    }

    // ---- helpers ----

    /// <summary>Copies the plan running now (and when it ends) onto the profile, with the Premium flag.</summary>
    private async Task SyncCacheAsync(CandidateProfile profile, DateTime now, CancellationToken ct, bool save = true)
    {
        var subs = await _context.Subscriptions.AsNoTracking()
            .Where(s => s.UserId == profile.UserId && s.Status == SubscriptionStatus.Active && s.EndsAt > now).ToListAsync(ct);
        var plan = Current(subs, now);
        profile.PlanId = plan;
        profile.PlanEndsAt = plan == Plans.Free ? null : ChainEnd(subs, plan, now);
        profile.Premium = plan != Plans.Free;
        if (save) await _context.SaveChangesAsync(ct);
    }

    private static string Current(IEnumerable<Subscription> subs, DateTime now) =>
        subs.Where(s => s.Status == SubscriptionStatus.Active && s.StartsAt <= now && s.EndsAt > now)
            .Select(s => s.PlanId).OrderByDescending(SubscriptionRules.Rank).FirstOrDefault() ?? Plans.Free;

    /// <summary>When the paid plan really ends: follows renewals that start as the previous period ends.</summary>
    private static DateTime ChainEnd(IEnumerable<Subscription> subs, string plan, DateTime now)
    {
        var active = subs.Where(s => s.Status == SubscriptionStatus.Active && s.EndsAt > now && SubscriptionRules.Rank(s.PlanId) >= 1)
            .OrderBy(s => s.StartsAt).ToList();
        var end = active.Where(s => s.StartsAt <= now).Select(s => s.EndsAt).DefaultIfEmpty(now).Max();
        foreach (var s in active.Where(s => s.StartsAt > now))
        {
            if (s.StartsAt > end.AddMinutes(1)) break;
            if (s.EndsAt > end) end = s.EndsAt;
        }
        return end;
    }

    private static SubscriptionDto ToDto(Subscription s, DateTime now) => new()
    {
        Id = s.Id,
        PlanId = s.PlanId,
        Status = s.Status == SubscriptionStatus.Active && s.StartsAt > now ? "Upcoming" : s.Status.ToString(),
        StartsAt = s.StartsAt,
        EndsAt = s.EndsAt,
        Source = s.PaymentId.HasValue ? "payment" : "staff",
        Note = s.Note
    };
}
