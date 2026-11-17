using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using DatingApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Paged search, plan limits and usage counters (Sprint 03 — T01–T03).</summary>
public class SearchAndUsageTests
{
    private static async Task<CandidateProfile> AddApprovedAsync(ApplicationDbContext db, string name, Gender gender, int age, string religion = "Buddhist")
    {
        var (_, profile) = await TestDb.AddMemberAsync(db, name, $"+9477{Random.Shared.Next(1000000, 9999999)}");
        profile.Gender = gender;
        profile.DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-age).AddDays(-10);
        profile.Age = age;
        profile.Religion = religion;
        profile.Status = ProfileStatus.Approved;
        await db.SaveChangesAsync();
        return profile;
    }

    [Fact]
    public async Task Search_filters_pages_and_hides_drafts_and_the_searcher()
    {
        using var db = TestDb.Create();
        var (me, mine) = await TestDb.AddMemberAsync(db, "Me", "+94770000001");
        mine.Status = ProfileStatus.Approved;
        for (var i = 0; i < 5; i++) await AddApprovedAsync(db, $"Bride {i}", Gender.Female, 25 + i);
        await AddApprovedAsync(db, "Hindu bride", Gender.Female, 27, "Hindu");
        await AddApprovedAsync(db, "Groom", Gender.Male, 30);
        var (_, draft) = await TestDb.AddMemberAsync(db, "Draft bride", "+94770000002");
        draft.Gender = Gender.Female;
        await db.SaveChangesAsync();

        var search = new SearchService(db, new UsageService(db));
        var result = await search.SearchAsync(me.Id, new ProfileSearchDto { Gender = "female", Religion = "Buddhist", AgeFrom = 25, AgeTo = 28, PageSize = 2 });

        Assert.Equal(4, result.Total); // ages 25–28, Buddhist, approved, not me, not the draft
        Assert.Equal(2, result.Items.Count);
        Assert.Equal(2, result.TotalPages);
        Assert.DoesNotContain(result.Items, p => p.Name == "Me" || p.Name == "Draft bride");
    }

    [Fact]
    public async Task Free_members_get_three_searches_then_402_with_the_reset_date()
    {
        using var db = TestDb.Create();
        var (me, _) = await TestDb.AddMemberAsync(db, "Me", "+94770000001");
        var search = new SearchService(db, new UsageService(db));

        // plain browsing (gender only, newest first) is free
        for (var i = 0; i < 5; i++) await search.SearchAsync(me.Id, new ProfileSearchDto { Gender = "female" });

        for (var i = 0; i < 3; i++) await search.SearchAsync(me.Id, new ProfileSearchDto { Religion = "Buddhist" });
        // later pages of the same search are free
        await search.SearchAsync(me.Id, new ProfileSearchDto { Religion = "Buddhist", Page = 2 });

        // filters the app applies itself count too
        var ex = await Assert.ThrowsAsync<AppException>(() => search.SearchAsync(me.Id, new ProfileSearchDto { Gender = "female", Filtered = true }));
        Assert.Equal(402, ex.Status);
        Assert.Equal(ErrorCodes.LimitReached, ex.Code);
        Assert.Equal(3, ex.Extensions["limit"]);
        Assert.True(ex.Extensions.ContainsKey("resetsAt"));

        var usage = await new UsageService(db).GetUsageAsync(me.Id);
        var searches = usage.Items.Single(i => i.Feature == "Search");
        Assert.Equal(3, searches.Used);
        Assert.Equal(0, searches.Remaining);
    }

    [Fact]
    public async Task Paid_members_and_staff_are_unlimited()
    {
        using var db = TestDb.Create();
        var (gold, goldProfile) = await TestDb.AddMemberAsync(db, "Gold", "+94770000001");
        goldProfile.Premium = true;
        var staff = new User { FullName = "Mod", PhoneNumber = "+94770000099", Role = Roles.Moderator };
        db.Users.Add(staff);
        await db.SaveChangesAsync();
        var usage = new UsageService(db);

        for (var i = 0; i < 10; i++)
        {
            await usage.ConsumeAsync(gold.Id, UsageFeature.Interest);
            await usage.ConsumeAsync(staff.Id, UsageFeature.ProfileView);
            await db.SaveChangesAsync(); // callers save after each consume
        }
        Assert.False(await db.UsageCounters.AnyAsync(u => u.UserId == staff.Id)); // staff are not counted

        var goldUsage = await usage.GetUsageAsync(gold.Id);
        Assert.Equal("gold", goldUsage.PlanId);
        Assert.Null(goldUsage.Items.Single(i => i.Feature == "Interest").Limit);
    }

    [Fact]
    public async Task The_admin_can_change_a_limit_and_it_applies_at_once()
    {
        using var db = TestDb.Create();
        var (me, _) = await TestDb.AddMemberAsync(db, "Me", "+94770000001");
        var admin = new User { FullName = "Admin", PhoneNumber = "+94770000100", Role = Roles.Admin };
        db.Users.Add(admin);
        await db.SaveChangesAsync();
        var usage = new UsageService(db);

        await usage.UpdatePlanLimitsAsync(admin.Id, new List<PlanLimitDto>
        {
            new() { PlanId = "free", Feature = "NewChat", MonthlyLimit = 0 }
        });

        var ex = await Assert.ThrowsAsync<AppException>(() => usage.ConsumeAsync(me.Id, UsageFeature.NewChat));
        Assert.Equal(402, ex.Status);

        var limits = await usage.GetPlanLimitsAsync();
        Assert.Equal(0, limits.Single(l => l.PlanId == "free" && l.Feature == "NewChat").MonthlyLimit);
        Assert.Equal(5, limits.Single(l => l.PlanId == "free" && l.Feature == "ProfileView").MonthlyLimit); // default kept
        Assert.Null(limits.Single(l => l.PlanId == "gold" && l.Feature == "Search").MonthlyLimit);

        await Assert.ThrowsAsync<AppException>(() =>
            usage.UpdatePlanLimitsAsync(admin.Id, new List<PlanLimitDto> { new() { PlanId = "bronze", Feature = "Search", MonthlyLimit = 1 } }));
    }
}
