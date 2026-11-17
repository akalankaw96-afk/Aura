using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>Plan ids. Until subscriptions arrive (Sprint 04) a premium profile counts as Gold.</summary>
public static class Plans
{
    public const string Free = "free";
    public const string Gold = "gold";
    public const string Platinum = "platinum";
    public static readonly string[] All = { Free, Gold, Platinum };

    /// <summary>Starting limits (owner, 2026-11-14): Free 3 searches · 5 views · 3 interests · 2 new chats; paid unlimited.</summary>
    public static readonly IReadOnlyDictionary<UsageFeature, int?> FreeDefaults = new Dictionary<UsageFeature, int?>
    {
        [UsageFeature.Search] = 3,
        [UsageFeature.ProfileView] = 5,
        [UsageFeature.Interest] = 3,
        [UsageFeature.NewChat] = 2
    };
}

/// <summary>
/// Monthly allowances (S03-T02 / T03). The server decides — the web app only shows what this returns.
/// Over the limit → 402 LIMIT_REACHED with the limit and the reset date.
/// </summary>
public interface IUsageService
{
    Task<UsageDto> GetUsageAsync(Guid userId, CancellationToken ct = default);
    /// <summary>Counts one use, or throws 402 LIMIT_REACHED. The caller saves the context.</summary>
    Task ConsumeAsync(Guid userId, UsageFeature feature, CancellationToken ct = default);
    Task<List<PlanLimitDto>> GetPlanLimitsAsync(CancellationToken ct = default);
    /// <summary>"free", "gold" or "platinum" for this member.</summary>
    Task<string> GetPlanAsync(Guid userId, CancellationToken ct = default);
    Task<List<PlanLimitDto>> UpdatePlanLimitsAsync(Guid adminUserId, List<PlanLimitDto> limits, CancellationToken ct = default);
}

public class UsageService : IUsageService
{
    private readonly IApplicationDbContext _context;

    public UsageService(IApplicationDbContext context)
    {
        _context = context;
    }

    public static DateOnly PeriodStartFor(DateTime utcNow) => new(utcNow.Year, utcNow.Month, 1);

    public async Task<UsageDto> GetUsageAsync(Guid userId, CancellationToken ct = default)
    {
        var plan = await PlanOfAsync(userId, ct);
        var period = PeriodStartFor(DateTime.UtcNow);
        var limits = await LimitsForAsync(plan, ct);
        var counters = await _context.UsageCounters.AsNoTracking()
            .Where(u => u.UserId == userId && u.PeriodStart == period)
            .ToDictionaryAsync(u => u.Feature, u => u.Count, ct);

        return new UsageDto
        {
            PlanId = plan,
            PeriodStart = period.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            ResetsAt = period.AddMonths(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            Items = Enum.GetValues<UsageFeature>().Select(f =>
            {
                var used = counters.GetValueOrDefault(f);
                var limit = limits.GetValueOrDefault(f);
                return new UsageItemDto
                {
                    Feature = f.ToString(),
                    Used = used,
                    Limit = limit,
                    Remaining = limit.HasValue ? Math.Max(0, limit.Value - used) : null
                };
            }).ToList()
        };
    }

    public async Task ConsumeAsync(Guid userId, UsageFeature feature, CancellationToken ct = default)
    {
        // staff work across many profiles — they are not members on a plan
        var role = await _context.Users.Where(u => u.Id == userId).Select(u => u.Role).FirstOrDefaultAsync(ct);
        if (role is Roles.Admin or Roles.Moderator) return;

        var plan = await PlanOfAsync(userId, ct);
        var limits = await LimitsForAsync(plan, ct);
        var limit = limits.GetValueOrDefault(feature);
        var now = DateTime.UtcNow;
        var period = PeriodStartFor(now);

        var counter = await _context.UsageCounters
            .FirstOrDefaultAsync(u => u.UserId == userId && u.Feature == feature && u.PeriodStart == period, ct);

        if (limit.HasValue && (counter?.Count ?? 0) >= limit.Value)
        {
            var resetsAt = period.AddMonths(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            throw new AppException(402, ErrorCodes.LimitReached, LimitMessage(feature, limit.Value),
                new Dictionary<string, object?>
                {
                    ["feature"] = feature.ToString(),
                    ["limit"] = limit.Value,
                    ["planId"] = plan,
                    ["resetsAt"] = resetsAt
                });
        }

        if (counter == null)
        {
            _context.UsageCounters.Add(new UsageCounter { UserId = userId, Feature = feature, PeriodStart = period, Count = 1 });
        }
        else
        {
            counter.Count += 1;
            counter.UpdatedAt = now;
        }
    }

    public async Task<List<PlanLimitDto>> GetPlanLimitsAsync(CancellationToken ct = default)
    {
        var rows = await _context.PlanLimits.AsNoTracking().ToListAsync(ct);
        var result = new List<PlanLimitDto>();
        foreach (var plan in Plans.All)
        {
            foreach (var feature in Enum.GetValues<UsageFeature>())
            {
                var row = rows.FirstOrDefault(r => r.PlanId == plan && r.Feature == feature);
                result.Add(new PlanLimitDto
                {
                    PlanId = plan,
                    Feature = feature.ToString(),
                    MonthlyLimit = row != null ? row.MonthlyLimit : DefaultFor(plan, feature),
                    UpdatedAt = row?.UpdatedAt ?? row?.CreatedAt
                });
            }
        }
        return result;
    }

    public async Task<List<PlanLimitDto>> UpdatePlanLimitsAsync(Guid adminUserId, List<PlanLimitDto> limits, CancellationToken ct = default)
    {
        var rows = await _context.PlanLimits.ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var item in limits ?? new List<PlanLimitDto>())
        {
            var plan = (item.PlanId ?? string.Empty).Trim().ToLowerInvariant();
            if (!Plans.All.Contains(plan)) throw AppException.Validation("Plan must be free, gold or platinum.", "planId");
            if (!Enum.TryParse<UsageFeature>(item.Feature, true, out var feature) || !Enum.IsDefined(feature))
                throw AppException.Validation("Feature must be Search, ProfileView, Interest or NewChat.", "feature");
            if (item.MonthlyLimit is < 0 or > 100_000)
                throw AppException.Validation("A limit is between 0 and 100,000, or empty for unlimited.", "monthlyLimit");

            var row = rows.FirstOrDefault(r => r.PlanId == plan && r.Feature == feature);
            if (row == null)
            {
                row = new PlanLimit { PlanId = plan, Feature = feature };
                _context.PlanLimits.Add(row);
                rows.Add(row);
            }
            row.MonthlyLimit = item.MonthlyLimit;
            row.UpdatedAt = now;
            row.UpdatedByUserId = adminUserId;
        }
        await _context.SaveChangesAsync(ct);
        return await GetPlanLimitsAsync(ct);
    }

    public Task<string> GetPlanAsync(Guid userId, CancellationToken ct = default) => PlanOfAsync(userId, ct);

    // ---- helpers ----

    // the plan comes from the member's subscriptions (S04-T02) — never from a flag the client could influence
    private Task<string> PlanOfAsync(Guid userId, CancellationToken ct) =>
        SubscriptionRules.CurrentPlanAsync(_context, userId, null, ct);

    private async Task<Dictionary<UsageFeature, int?>> LimitsForAsync(string plan, CancellationToken ct)
    {
        var rows = await _context.PlanLimits.AsNoTracking().Where(p => p.PlanId == plan).ToListAsync(ct);
        return Enum.GetValues<UsageFeature>().ToDictionary(
            f => f,
            f => rows.FirstOrDefault(r => r.Feature == f) is { } row ? row.MonthlyLimit : DefaultFor(plan, f));
    }

    private static int? DefaultFor(string plan, UsageFeature feature) =>
        plan == Plans.Free ? Plans.FreeDefaults.GetValueOrDefault(feature) : null;

    private static string LimitMessage(UsageFeature feature, int limit) => feature switch
    {
        UsageFeature.Search => $"Your plan includes {limit} searches a month. Upgrade to Gold for unlimited searches.",
        UsageFeature.ProfileView => $"Your plan includes {limit} profile views a month. Upgrade to Gold to see more profiles.",
        UsageFeature.Interest => $"Your plan includes {limit} interests a month. Upgrade to Gold to send more.",
        UsageFeature.NewChat => $"Your plan includes {limit} new chats a month. Upgrade to Gold to start more conversations.",
        _ => "You've reached your plan's limit for this month."
    };
}
