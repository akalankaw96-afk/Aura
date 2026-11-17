using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using DatingApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Staff reports queue (S03-T08) and the dashboard summary (S03-T09).</summary>
public class ReportsAndDashboardTests
{
    private static ReportQueueService Queue(ApplicationDbContext db)
    {
        var notifications = new NotificationService(db, new CapturingSmsSender());
        return new ReportQueueService(db, new ModerationService(db, notifications, new ProfileService(db)), notifications);
    }

    private static async Task<User> AddModeratorAsync(ApplicationDbContext db)
    {
        var mod = new User { FullName = "Mod", PhoneNumber = "+94770000099", Role = Roles.Moderator };
        db.Users.Add(mod);
        await db.SaveChangesAsync();
        return mod;
    }

    [Fact]
    public async Task Staff_can_dismiss_a_report_and_the_reporter_is_told_it_was_reviewed()
    {
        using var db = TestDb.Create();
        var (reporter, _) = await TestDb.AddApprovedMemberAsync(db, "Reporter", "+94770000001");
        var (_, member) = await TestDb.AddApprovedMemberAsync(db, "Member", "+94770000002");
        var mod = await AddModeratorAsync(db);
        var report = await new SafetyService(db).ReportAsync(reporter.Id, new CreateReportDto { ProfileId = member.Id, Reason = "Inappropriate" });
        var queue = Queue(db);

        var open = Assert.Single(await queue.ListAsync("open"));
        Assert.Equal("Member", open.ReportedName);
        Assert.Equal("Reporter", open.ReporterName);
        Assert.Equal(1, open.OpenReportsOnProfile);

        var done = await queue.ResolveAsync(mod.Id, report.Id, new ResolveReportDto { Action = "dismiss", Note = "No breach" });
        Assert.Equal("Dismissed", done.Status);
        Assert.Equal("Mod", done.ReviewedByName);
        Assert.Empty(await queue.ListAsync("open"));
        Assert.Single(await queue.ListAsync("closed"));
        Assert.True(await db.Notifications.AnyAsync(n => n.UserId == reporter.Id && n.Type == "report.reviewed"));
        Assert.True(await db.ProfileReviewLogs.AnyAsync(l => l.ProfileId == member.Id && l.Action == ReviewAction.ReportDismissed));
        Assert.Equal(ProfileStatus.Approved, (await db.CandidateProfiles.SingleAsync(p => p.Id == member.Id)).Status);

        var twice = await Assert.ThrowsAsync<AppException>(() => queue.ResolveAsync(mod.Id, report.Id, new ResolveReportDto { Action = "action" }));
        Assert.Equal(409, twice.Status);
    }

    [Fact]
    public async Task Suspending_from_a_report_suspends_the_member_and_closes_all_their_open_reports()
    {
        using var db = TestDb.Create();
        var (r1, _) = await TestDb.AddApprovedMemberAsync(db, "Reporter one", "+94770000001");
        var (r2, _) = await TestDb.AddApprovedMemberAsync(db, "Reporter two", "+94770000003");
        var (_, scammer) = await TestDb.AddApprovedMemberAsync(db, "Scammer", "+94770000002");
        var mod = await AddModeratorAsync(db);
        var safety = new SafetyService(db);
        var first = await safety.ReportAsync(r1.Id, new CreateReportDto { ProfileId = scammer.Id, Reason = "Scam", Details = "Asked for money" });
        await safety.ReportAsync(r2.Id, new CreateReportDto { ProfileId = scammer.Id, Reason = "Scam", Details = "Bank details" });
        var queue = Queue(db);
        Assert.Equal(2, (await queue.ListAsync("open")).First().OpenReportsOnProfile);

        var noNote = await Assert.ThrowsAsync<AppException>(() => queue.ResolveAsync(mod.Id, first.Id, new ResolveReportDto { Action = "suspend" }));
        Assert.Equal(400, noNote.Status);

        await queue.ResolveAsync(mod.Id, first.Id, new ResolveReportDto { Action = "suspend", Note = "Two scam reports" });

        Assert.Equal(ProfileStatus.Suspended, (await db.CandidateProfiles.SingleAsync(p => p.Id == scammer.Id)).Status);
        Assert.Empty(await queue.ListAsync("open"));
        Assert.All(await db.Reports.ToListAsync(), r => Assert.Equal(ReportStatus.Actioned, r.Status));
        Assert.Equal(2, await db.Notifications.CountAsync(n => n.Type == "report.reviewed"));
        Assert.True(await db.ProfileReviewLogs.AnyAsync(l => l.ProfileId == scammer.Id && l.Action == ReviewAction.Suspended));
    }

    [Fact]
    public async Task The_dashboard_counts_views_interests_shortlists_and_unread_messages()
    {
        using var db = TestDb.Create();
        var (meUser, me) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var (aUser, a) = await TestDb.AddApprovedMemberAsync(db, "Amal", "+94770000002");
        var (bUser, b) = await TestDb.AddApprovedMemberAsync(db, "Bimal", "+94770000003");
        var (_, c) = await TestDb.AddApprovedMemberAsync(db, "Chamal", "+94770000004");
        var usage = new UsageService(db);
        var views = new ProfileViewService(db, usage);
        var chat = ChatServiceTests.Chat(db);
        var interests = new MatchRequestService(db, usage, new NotificationService(db, new CapturingSmsSender()));

        await views.RecordViewAsync(aUser.Id, me.Id);
        await views.RecordViewAsync(bUser.Id, me.Id);
        await interests.SendRequestAsync(a.Id, new CreateMatchRequestDto { ReceiverProfileId = me.Id }); // waiting for me
        await interests.SendRequestAsync(me.Id, new CreateMatchRequestDto { ReceiverProfileId = c.Id });  // I'm waiting
        await TestDb.MatchAsync(db, b, me);                                                               // matched
        await new ShortlistService(db).AddAsync(aUser.Id, me.Id);
        await chat.SendMessageAsync(bUser.Id, me.Id, "Hello");
        await chat.SendMessageAsync(bUser.Id, me.Id, "Are you there?");

        var service = new DashboardService(db, usage, views, chat);
        var free = await service.GetAsync(meUser.Id);
        Assert.Equal(2, free.ProfileViewers);
        Assert.Equal(2, free.ProfileViewersThisWeek);
        Assert.True(free.ViewersLocked);
        Assert.Empty(free.RecentViewers);
        Assert.Equal(2, free.InterestsReceived); // Amal's (waiting) + Bimal's (accepted)
        Assert.Equal(1, free.InterestsWaiting);
        Assert.Equal(1, free.InterestsSentWaiting);
        Assert.Equal(1, free.Matches);
        Assert.Equal(1, free.ShortlistedBy);
        Assert.Equal(2, free.UnreadMessages);
        Assert.Equal(1, free.UnreadChats);
        Assert.Equal("Bimal", Assert.Single(free.RecentConversations).PartnerName);
        Assert.Equal("free", free.Usage.PlanId);

        me.Premium = true;
        await db.SaveChangesAsync();
        var gold = await service.GetAsync(meUser.Id);
        Assert.False(gold.ViewersLocked);
        Assert.Equal(2, gold.RecentViewers.Count);

        // a blocked member drops out of every count
        await new SafetyService(db).BlockAsync(meUser.Id, b.Id, null);
        var afterBlock = await service.GetAsync(meUser.Id);
        Assert.Equal(1, afterBlock.ProfileViewers);
        Assert.Equal(0, afterBlock.Matches);
        Assert.Equal(0, afterBlock.UnreadMessages);
    }
}
