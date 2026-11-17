using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Services;
using DatingApp.Domain.Entities;
using DatingApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Profile views (S03-T04).</summary>
public class ProfileViewTests
{
    private static ProfileViewService Service(ApplicationDbContext db) => new(db, new UsageService(db));

    [Fact]
    public async Task Free_members_open_five_new_profiles_a_month_and_reopening_is_free()
    {
        using var db = TestDb.Create();
        var (me, _) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var views = Service(db);
        var others = new List<CandidateProfile>();
        for (var i = 0; i < 6; i++) others.Add((await TestDb.AddApprovedMemberAsync(db, $"Member {i}", $"+9477000010{i}")).Profile);

        for (var i = 0; i < 5; i++) await views.RecordViewAsync(me.Id, others[i].Id);
        await views.RecordViewAsync(me.Id, others[0].Id); // again this month: free

        var ex = await Assert.ThrowsAsync<AppException>(() => views.RecordViewAsync(me.Id, others[5].Id));
        Assert.Equal(402, ex.Status);
        Assert.Equal("ProfileView", ex.Extensions["feature"]);

        var row = await db.ProfileViews.SingleAsync(v => v.ViewerUserId == me.Id && v.ViewedProfileId == others[0].Id);
        Assert.Equal(2, row.ViewCount);
        Assert.Equal(5, await db.ProfileViews.CountAsync());
    }

    [Fact]
    public async Task Own_profile_staff_and_members_you_share_an_interest_with_are_not_counted()
    {
        using var db = TestDb.Create();
        var (me, mine) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var (_, partner) = await TestDb.AddApprovedMemberAsync(db, "Partner", "+94770000002");
        await TestDb.MatchAsync(db, mine, partner);
        var staff = new User { FullName = "Mod", PhoneNumber = "+94770000099", Role = Roles.Moderator };
        db.Users.Add(staff);
        await db.SaveChangesAsync();
        var views = Service(db);

        await views.RecordViewAsync(me.Id, mine.Id);
        await views.RecordViewAsync(staff.Id, partner.Id);
        for (var i = 0; i < 8; i++) await views.RecordViewAsync(me.Id, partner.Id); // matched: never charged

        Assert.False(await db.ProfileViews.AnyAsync(v => v.ViewedProfileId == mine.Id || v.ViewerUserId == staff.Id));
        Assert.False(await db.UsageCounters.AnyAsync());
    }

    [Fact]
    public async Task Who_viewed_me_is_a_paid_list_free_members_see_the_count()
    {
        using var db = TestDb.Create();
        var (me, mine) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var (viewer, _) = await TestDb.AddApprovedMemberAsync(db, "Viewer", "+94770000002");
        var views = Service(db);
        await views.RecordViewAsync(viewer.Id, mine.Id);

        var free = await views.GetViewersAsync(me.Id);
        Assert.True(free.Locked);
        Assert.Equal(1, free.Total);
        Assert.Empty(free.Items);

        mine.Premium = true;
        await db.SaveChangesAsync();
        var gold = await views.GetViewersAsync(me.Id);
        Assert.False(gold.Locked);
        Assert.Equal("Viewer", Assert.Single(gold.Items).Profile.Name);

        var recent = await views.GetRecentAsync(viewer.Id);
        Assert.Equal("Me", Assert.Single(recent).Profile.Name);
    }
}
