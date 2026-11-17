using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using DatingApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Prices (S04-T01) and subscriptions — plan, renewal, expiry, reminders (S04-T02).</summary>
public class BillingTests
{
    private static SubscriptionService Subscriptions(ApplicationDbContext db) =>
        new(db, new NotificationService(db, new CapturingSmsSender()));

    private static async Task<User> AddAdminAsync(ApplicationDbContext db)
    {
        var admin = new User { FullName = "Admin", PhoneNumber = "+94770000100", Role = Roles.Admin };
        db.Users.Add(admin);
        await db.SaveChangesAsync();
        return admin;
    }

    [Fact]
    public async Task Default_prices_are_the_plans_page_prices_in_cents_and_the_admin_can_change_them()
    {
        using var db = TestDb.Create();
        await PricingService.EnsureDefaultsAsync(db);
        await PricingService.EnsureDefaultsAsync(db); // twice adds nothing
        var pricing = new PricingService(db);

        var prices = await pricing.GetPricesAsync();
        Assert.Equal(7, prices.Count);
        var gold3 = prices.Single(p => p.PlanId == "gold" && p.Months == 3);
        Assert.Equal(637_500, gold3.AmountCents);
        Assert.Equal(6375m, gold3.Amount);
        Assert.Equal(15, gold3.SavePercent);
        Assert.Equal(50_000, prices.Single(p => p.Product == "boost").AmountCents);

        var admin = await AddAdminAsync(db);
        var updated = await pricing.UpdatePricesAsync(admin.Id, new List<PlanPriceDto>
        {
            new() { Product = "plan", PlanId = "gold", Months = 1, AmountCents = 300_000 }
        });
        Assert.Equal(300_000, updated.Single(p => p.PlanId == "gold" && p.Months == 1).AmountCents);
        Assert.Equal(29, updated.Single(p => p.PlanId == "gold" && p.Months == 3).SavePercent); // vs 3 × 3,000

        await Assert.ThrowsAsync<AppException>(() => pricing.UpdatePricesAsync(admin.Id,
            new List<PlanPriceDto> { new() { Product = "plan", PlanId = "bronze", Months = 1, AmountCents = 1 } }));
        await Assert.ThrowsAsync<AppException>(() => pricing.UpdatePricesAsync(admin.Id,
            new List<PlanPriceDto> { new() { Product = "plan", PlanId = "gold", Months = 1, AmountCents = -5 } }));
    }

    [Fact]
    public async Task A_granted_plan_lifts_the_limits_and_shows_in_the_session_cache()
    {
        using var db = TestDb.Create();
        var (user, _) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var subs = Subscriptions(db);

        Assert.Equal("free", (await new UsageService(db).GetUsageAsync(user.Id)).PlanId);
        await subs.GrantAsync(user.Id, "gold", 1, null, null, "test");

        var usage = await new UsageService(db).GetUsageAsync(user.Id);
        Assert.Equal("gold", usage.PlanId);
        Assert.All(usage.Items, i => Assert.Null(i.Limit));

        var profile = await db.CandidateProfiles.SingleAsync(p => p.UserId == user.Id);
        Assert.True(profile.Premium);
        Assert.Equal("gold", profile.PlanId);
        Assert.True(profile.PlanEndsAt > DateTime.UtcNow.AddDays(27));
        Assert.True(await db.Notifications.AnyAsync(n => n.UserId == user.Id && n.Type == "plan.started"));
    }

    [Fact]
    public async Task Renewing_early_adds_to_the_end_and_platinum_starts_at_once()
    {
        using var db = TestDb.Create();
        var (user, _) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var subs = Subscriptions(db);

        var first = await subs.GrantAsync(user.Id, "gold", 1, null, null, null);
        var renewal = await subs.GrantAsync(user.Id, "gold", 3, null, null, null);
        Assert.Equal(first.EndsAt, renewal.StartsAt);
        Assert.Equal("Upcoming", renewal.Status);

        var mine = await subs.GetMineAsync(user.Id);
        Assert.Equal("gold", mine.PlanId);
        Assert.Equal(renewal.EndsAt, mine.EndsAt); // the paid time runs to the end of the renewal
        Assert.True(mine.DaysLeft > 110);

        var platinum = await subs.GrantAsync(user.Id, "platinum", 1, null, null, null);
        Assert.True(platinum.StartsAt <= DateTime.UtcNow.AddMinutes(1)); // a better plan doesn't wait
        Assert.Equal("platinum", (await subs.GetMineAsync(user.Id)).PlanId);
    }

    [Fact]
    public async Task Ended_periods_expire_and_the_member_is_back_on_free()
    {
        using var db = TestDb.Create();
        var (user, profile) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        db.Subscriptions.Add(new Subscription { UserId = user.Id, PlanId = "gold", StartsAt = DateTime.UtcNow.AddMonths(-1), EndsAt = DateTime.UtcNow.AddMinutes(-5) });
        profile.Premium = true;
        profile.PlanId = "gold";
        profile.PlanEndsAt = DateTime.UtcNow.AddMinutes(-5);
        await db.SaveChangesAsync();

        // the plan is free even before the hourly job runs
        Assert.Equal("free", await SubscriptionRules.CurrentPlanAsync(db, user.Id));

        var (expired, _) = await Subscriptions(db).RunMaintenanceAsync(DateTime.UtcNow);
        Assert.Equal(1, expired);
        Assert.Equal(SubscriptionStatus.Expired, (await db.Subscriptions.SingleAsync()).Status);
        var after = await db.CandidateProfiles.AsNoTracking().SingleAsync(p => p.UserId == user.Id);
        Assert.False(after.Premium);
        Assert.Equal("free", after.PlanId);
        Assert.Null(after.PlanEndsAt);
    }

    [Fact]
    public async Task The_3_day_reminder_goes_once_and_not_when_a_renewal_follows()
    {
        using var db = TestDb.Create();
        var (ending, _) = await TestDb.AddApprovedMemberAsync(db, "Ending", "+94770000001");
        var (renewed, _) = await TestDb.AddApprovedMemberAsync(db, "Renewed", "+94770000002");
        var now = DateTime.UtcNow;
        db.Subscriptions.Add(new Subscription { UserId = ending.Id, PlanId = "gold", StartsAt = now.AddDays(-28), EndsAt = now.AddDays(2) });
        db.Subscriptions.Add(new Subscription { UserId = renewed.Id, PlanId = "gold", StartsAt = now.AddDays(-28), EndsAt = now.AddDays(2) });
        db.Subscriptions.Add(new Subscription { UserId = renewed.Id, PlanId = "gold", StartsAt = now.AddDays(2), EndsAt = now.AddDays(32) });
        await db.SaveChangesAsync();
        var subs = Subscriptions(db);

        var (_, reminded) = await subs.RunMaintenanceAsync(now);
        Assert.Equal(1, reminded);
        var (_, again) = await subs.RunMaintenanceAsync(now.AddHours(1));
        Assert.Equal(0, again);

        Assert.Equal(1, await db.Notifications.CountAsync(n => n.UserId == ending.Id && n.Type == "plan.ending"));
        Assert.False(await db.Notifications.AnyAsync(n => n.UserId == renewed.Id && n.Type == "plan.ending"));
    }

    [Fact]
    public async Task Staff_can_cancel_a_period_with_a_reason()
    {
        using var db = TestDb.Create();
        var (user, _) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var admin = await AddAdminAsync(db);
        var subs = Subscriptions(db);
        var period = await subs.GrantAsync(user.Id, "gold", 1, null, admin.Id, "Complimentary");

        await Assert.ThrowsAsync<AppException>(() => subs.CancelAsync(period.Id, admin.Id, null));
        await subs.CancelAsync(period.Id, admin.Id, "Refunded");

        Assert.Equal("free", (await subs.GetMineAsync(user.Id)).PlanId);
        Assert.False((await db.CandidateProfiles.AsNoTracking().SingleAsync(p => p.UserId == user.Id)).Premium);
        var conflict = await Assert.ThrowsAsync<AppException>(() => subs.CancelAsync(period.Id, admin.Id, "again"));
        Assert.Equal(409, conflict.Status);
    }
}
