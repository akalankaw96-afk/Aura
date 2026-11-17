using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using DatingApp.Infrastructure.Persistence;
using DatingApp.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Staff back office (S04-T07): counts, members list, block / deactivate, password reset.</summary>
public class AdminMembersTests
{
    private static readonly ClientInfo Client = new("127.0.0.1", "tests");

    private static async Task<User> AddAdminAsync(ApplicationDbContext db)
    {
        var admin = new User { FullName = "Admin", PhoneNumber = "+94770000100", Role = Roles.Admin };
        db.Users.Add(admin);
        await db.SaveChangesAsync();
        return admin;
    }

    [Fact]
    public async Task Stats_and_list_count_members_only_with_status_plan_and_search()
    {
        using var db = TestDb.Create();
        var admin = await AddAdminAsync(db);
        var (approved, _) = await TestDb.AddApprovedMemberAsync(db, "Nimal Perera", "+94771234567");
        var (submitted, sp) = await TestDb.AddMemberAsync(db, "Kamala Silva", "+94770000002");
        sp.Status = ProfileStatus.Submitted;
        sp.Code = "MP-24100";
        var noProfile = new User { FullName = "Half Done", PhoneNumber = "+94770000003", Email = "half@example.test" };
        db.Users.Add(noProfile);
        await db.SaveChangesAsync();
        await TestDb.MakePaidAsync(db, approved.Id, "platinum");
        var service = new AdminMembersService(db, new PasswordHasher(), new CapturingSmsSender());

        var stats = await service.GetStatsAsync();
        Assert.Equal(3, stats.TotalMembers); // admin not counted
        Assert.Equal(1, stats.PendingReviews);
        Assert.Equal(1, stats.IncompleteRegistrations);
        Assert.Equal(1, stats.PaidMembers);
        Assert.Equal(3, stats.NewThisWeek);

        var all = await service.ListAsync(null, null, 1, 10);
        Assert.Equal(3, all.Total);
        Assert.DoesNotContain(all.Items, m => m.UserId == admin.Id);
        var nimal = all.Items.Single(m => m.UserId == approved.Id);
        Assert.Equal("Active", nimal.Status);
        Assert.Equal("Platinum", nimal.Plan);
        Assert.Equal("Incomplete", all.Items.Single(m => m.UserId == noProfile.Id).Status);
        Assert.Equal("PendingReview", all.Items.Single(m => m.UserId == submitted.Id).Status);

        Assert.Equal(approved.Id, Assert.Single((await service.ListAsync("0771234567", null, 1, 10)).Items).UserId); // local mobile format
        Assert.Equal(noProfile.Id, Assert.Single((await service.ListAsync("half@", null, 1, 10)).Items).UserId);
        Assert.Equal(submitted.Id, Assert.Single((await service.ListAsync("MP-241", null, 1, 10)).Items).UserId);
        Assert.Equal(submitted.Id, Assert.Single((await service.ListAsync(null, "PendingReview", 1, 10)).Items).UserId);
        Assert.Equal(2, (await service.ListAsync(null, null, 1, 2)).Items.Count);
    }

    [Fact]
    public async Task Blocking_hides_the_profile_ends_sessions_and_stops_sign_in_until_unblocked()
    {
        using var db = TestDb.Create();
        var admin = await AddAdminAsync(db);
        var (member, profile) = await TestDb.AddApprovedMemberAsync(db, "Nimal", "+94770000001");
        var (viewer, _) = await TestDb.AddApprovedMemberAsync(db, "Viewer", "+94770000002");
        var sessions = new SessionService(db, new FakeJwt());
        var start = await sessions.StartAsync(member, Client);
        var service = new AdminMembersService(db, new PasswordHasher(), new CapturingSmsSender());
        var search = new SearchService(db, new UsageService(db));

        await Assert.ThrowsAsync<AppException>(() => service.SetStatusAsync(admin.Id, member.Id, new MemberStatusDto { Action = "block" })); // reason needed
        await Assert.ThrowsAsync<AppException>(() => service.SetStatusAsync(admin.Id, admin.Id, new MemberStatusDto { Action = "block", Reason = "x" }));
        await service.SetStatusAsync(admin.Id, member.Id, new MemberStatusDto { Action = "block", Reason = "Scam reports" });

        Assert.True(profile.IsHidden);
        Assert.Equal("Blocked", (await service.ListAsync(null, "Blocked", 1, 10)).Items.Single().Status);
        Assert.Equal(1, (await service.GetStatsAsync()).Blocked);
        Assert.DoesNotContain((await search.SearchAsync(viewer.Id, new ProfileSearchDto())).Items, p => p.Id == profile.Id);
        await Assert.ThrowsAsync<AppException>(() => sessions.RefreshAsync(start.RefreshToken, Client));
        Assert.True(await db.AuditLogs.AnyAsync(a => a.Action == "member.block" && a.TargetUserId == member.Id && a.Detail == "Scam reports"));

        await service.SetStatusAsync(admin.Id, member.Id, new MemberStatusDto { Action = "unblock" });
        Assert.False(profile.IsHidden);
        Assert.Contains((await search.SearchAsync(viewer.Id, new ProfileSearchDto())).Items, p => p.Id == profile.Id);
    }

    [Fact]
    public async Task A_deactivated_account_is_hidden_and_comes_back_when_the_member_signs_in()
    {
        using var db = TestDb.Create();
        var admin = await AddAdminAsync(db);
        var (member, profile) = await TestDb.AddApprovedMemberAsync(db, "Nimal", "+94770000001");
        var service = new AdminMembersService(db, new PasswordHasher(), new CapturingSmsSender());

        await service.SetStatusAsync(admin.Id, member.Id, new MemberStatusDto { Action = "deactivate", Reason = "Member asked by phone" });
        Assert.True(profile.IsHidden);
        Assert.Equal("Deactivated", (await service.ListAsync(null, null, 1, 10)).Items.Single().Status);

        await new SessionService(db, new FakeJwt()).StartAsync(member, Client);
        Assert.Null(member.DeactivatedAt);
        Assert.False(profile.IsHidden);
        Assert.Equal("Active", (await service.ListAsync(null, null, 1, 10)).Items.Single().Status);
    }

    [Fact]
    public async Task Resetting_a_password_ends_sessions_stops_the_old_password_and_sends_an_sms()
    {
        using var db = TestDb.Create();
        var admin = await AddAdminAsync(db);
        var (member, _) = await TestDb.AddApprovedMemberAsync(db, "Nimal", "+94770000001");
        var hasher = new PasswordHasher();
        member.PasswordHash = hasher.HashPassword("Secret123");
        await db.SaveChangesAsync();
        var sessions = new SessionService(db, new FakeJwt());
        var start = await sessions.StartAsync(member, Client);
        var sms = new CapturingSmsSender();

        await new AdminMembersService(db, hasher, sms).ResetPasswordAsync(admin.Id, member.Id);

        Assert.False(hasher.VerifyPassword("Secret123", member.PasswordHash));
        Assert.Contains("Forgot password", sms.LastMessage);
        await Assert.ThrowsAsync<AppException>(() => sessions.RefreshAsync(start.RefreshToken, Client));
        Assert.True(await db.AuditLogs.AnyAsync(a => a.Action == "member.resetPassword"));
    }
}
