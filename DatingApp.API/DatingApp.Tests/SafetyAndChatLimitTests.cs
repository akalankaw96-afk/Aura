using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Domain.Enums;
using DatingApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Shortlist, saved searches, chat limits, contact share decline / cancel, block and report (S03-T06, T07).</summary>
public class SafetyAndChatLimitTests
{
    private static MatchRequestService Interests(ApplicationDbContext db) =>
        new(db, new UsageService(db), new NotificationService(db, new CapturingSmsSender()));

    [Fact]
    public async Task Shortlist_survives_and_hides_unapproved_and_duplicates()
    {
        using var db = TestDb.Create();
        var (me, _) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var (_, nimmi) = await TestDb.AddApprovedMemberAsync(db, "Nimmi", "+94770000002");
        var (_, draft) = await TestDb.AddMemberAsync(db, "Draft", "+94770000003");
        var shortlist = new ShortlistService(db);

        await shortlist.AddAsync(me.Id, nimmi.Id);
        await shortlist.AddAsync(me.Id, nimmi.Id); // twice is fine
        await Assert.ThrowsAsync<AppException>(() => shortlist.AddAsync(me.Id, draft.Id));

        Assert.Equal("Nimmi", Assert.Single(await shortlist.ListAsync(me.Id)).Profile.Name);
        await shortlist.RemoveAsync(me.Id, nimmi.Id);
        Assert.Empty(await shortlist.ListAsync(me.Id));
    }

    [Fact]
    public async Task Saved_searches_keep_their_filters_and_names_are_unique()
    {
        using var db = TestDb.Create();
        var (me, _) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var saved = new SavedSearchService(db);

        var created = await saved.CreateAsync(me.Id, new CreateSavedSearchDto
        {
            Name = " Kandy doctors ",
            Filters = new ProfileSearchDto { Gender = "female", AgeFrom = 25, AgeTo = 32, Location = "Kandy", Profession = "Doctor", Page = 4 }
        });
        Assert.Equal("Kandy doctors", created.Name);

        var dup = await Assert.ThrowsAsync<AppException>(() =>
            saved.CreateAsync(me.Id, new CreateSavedSearchDto { Name = "Kandy doctors" }));
        Assert.Equal(409, dup.Status);

        var listed = Assert.Single(await saved.ListAsync(me.Id));
        Assert.Equal("Kandy", listed.Filters.Location);
        Assert.Equal(32, listed.Filters.AgeTo);
        Assert.Equal(1, listed.Filters.Page); // always starts from page 1

        await saved.DeleteAsync(me.Id, listed.Id);
        Assert.Empty(await saved.ListAsync(me.Id));
    }

    [Fact]
    public async Task Free_members_start_two_chats_a_month_and_replies_are_free()
    {
        using var db = TestDb.Create();
        var (meUser, me) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var chat = ChatServiceTests.Chat(db);
        var partners = new List<(Guid UserId, Guid ProfileId)>();
        for (var i = 0; i < 4; i++)
        {
            var (u, p) = await TestDb.AddApprovedMemberAsync(db, $"Partner {i}", $"+9477000010{i}");
            await TestDb.MatchAsync(db, me, p);
            partners.Add((u.Id, p.Id));
        }

        await chat.SendMessageAsync(meUser.Id, partners[0].ProfileId, "Hello");
        await chat.SendMessageAsync(meUser.Id, partners[0].ProfileId, "Second message is free");
        await chat.SendMessageAsync(meUser.Id, partners[1].ProfileId, "Hello");

        // partner 2 writes first — my reply doesn't start a chat
        await chat.SendMessageAsync(partners[2].UserId, me.Id, "Hi there");
        await chat.SendMessageAsync(meUser.Id, partners[2].ProfileId, "Hi!");

        var ex = await Assert.ThrowsAsync<AppException>(() => chat.SendMessageAsync(meUser.Id, partners[3].ProfileId, "Hello"));
        Assert.Equal(402, ex.Status);
        Assert.Equal("NewChat", ex.Extensions["feature"]);
    }

    [Fact]
    public async Task Free_members_cannot_ask_for_numbers_but_can_answer_decline_and_the_asker_can_cancel()
    {
        using var db = TestDb.Create();
        var (amalUser, amal) = await TestDb.AddApprovedMemberAsync(db, "Amal", "+94770000011");
        var (nimmiUser, nimmi) = await TestDb.AddApprovedMemberAsync(db, "Nimmi", "+94770000012");
        await TestDb.MatchAsync(db, amal, nimmi);
        var chat = ChatServiceTests.Chat(db);

        var free = await Assert.ThrowsAsync<AppException>(() => chat.RequestContactShareAsync(nimmiUser.Id, amal.Id));
        Assert.Equal(402, free.Status);
        Assert.Equal(ErrorCodes.PlanRequired, free.Code);

        amal.Premium = true;
        await db.SaveChangesAsync();

        await chat.RequestContactShareAsync(amalUser.Id, nimmi.Id);
        var twice = await Assert.ThrowsAsync<AppException>(() => chat.RequestContactShareAsync(amalUser.Id, nimmi.Id));
        Assert.Equal(409, twice.Status);

        var declined = await chat.DeclineContactShareAsync(nimmiUser.Id, amal.Id); // free member can answer
        Assert.True(declined.Message.IsContactShareDeclined);
        await Assert.ThrowsAsync<AppException>(() => chat.AcceptContactShareAsync(nimmiUser.Id, amal.Id)); // closed

        await chat.RequestContactShareAsync(amalUser.Id, nimmi.Id); // may ask again later
        var cancelled = await chat.CancelContactShareAsync(amalUser.Id, nimmi.Id);
        Assert.True(cancelled.Message.IsContactShareCancelled);
        Assert.Equal("none", Assert.Single(await chat.GetConversationsAsync(nimmiUser.Id)).ContactShareState);

        await chat.RequestContactShareAsync(amalUser.Id, nimmi.Id);
        Assert.Equal("received", Assert.Single(await chat.GetConversationsAsync(nimmiUser.Id)).ContactShareState);
        await chat.AcceptContactShareAsync(nimmiUser.Id, amal.Id);
        Assert.True(Assert.Single(await chat.GetConversationsAsync(amalUser.Id)).IsContactShared);
    }

    [Fact]
    public async Task Blocking_hides_both_sides_stops_messages_and_ends_waiting_interests()
    {
        using var db = TestDb.Create();
        var (amalUser, amal) = await TestDb.AddApprovedMemberAsync(db, "Amal", "+94770000011");
        var (nimmiUser, nimmi) = await TestDb.AddApprovedMemberAsync(db, "Nimmi", "+94770000012");
        var (_, kasun) = await TestDb.AddApprovedMemberAsync(db, "Kasun", "+94770000013");
        await TestDb.MatchAsync(db, amal, nimmi);
        var pending = await Interests(db).SendRequestAsync(kasun.Id, new CreateMatchRequestDto { ReceiverProfileId = amal.Id });
        var safety = new SafetyService(db);
        var chat = ChatServiceTests.Chat(db);
        await chat.SendMessageAsync(amalUser.Id, nimmi.Id, "Hello");

        await safety.BlockAsync(amalUser.Id, nimmi.Id, "Rude or inappropriate messages");
        await safety.BlockAsync(amalUser.Id, kasun.Id, null);

        // messages stop both ways; the blocker is told why, the blocked member isn't
        var mine = await Assert.ThrowsAsync<AppException>(() => chat.SendMessageAsync(amalUser.Id, nimmi.Id, "Hi"));
        Assert.Equal(ErrorCodes.Blocked, mine.Code);
        var theirs = await Assert.ThrowsAsync<AppException>(() => chat.SendMessageAsync(nimmiUser.Id, amal.Id, "Hi"));
        Assert.Equal(404, theirs.Status);

        Assert.True(Assert.Single(await chat.GetConversationsAsync(amalUser.Id)).IsBlocked);
        Assert.Empty(await chat.GetConversationsAsync(nimmiUser.Id));

        // search and profile views
        var search = new SearchService(db, new UsageService(db));
        var found = await search.SearchAsync(nimmiUser.Id, new ProfileSearchDto());
        Assert.DoesNotContain(found.Items, p => p.Name == "Amal");
        await Assert.ThrowsAsync<AppException>(() => new ProfileViewService(db, new UsageService(db)).RecordViewAsync(nimmiUser.Id, amal.Id));

        // Kasun's waiting interest ended
        Assert.Equal(MatchRequestStatus.Declined, (await db.MatchRequests.SingleAsync(r => r.Id == pending.Id)).Status);
        Assert.Equal(2, (await safety.ListBlockedAsync(amalUser.Id)).Count);

        // unblock restores the chat
        await safety.UnblockAsync(amalUser.Id, nimmi.Id);
        await chat.SendMessageAsync(nimmiUser.Id, amal.Id, "Thanks");
    }

    [Fact]
    public async Task Reports_are_stored_once_per_open_case()
    {
        using var db = TestDb.Create();
        var (me, _) = await TestDb.AddApprovedMemberAsync(db, "Me", "+94770000001");
        var (_, scammer) = await TestDb.AddApprovedMemberAsync(db, "Scammer", "+94770000002");
        var safety = new SafetyService(db);

        var report = await safety.ReportAsync(me.Id, new CreateReportDto { ProfileId = scammer.Id, Reason = "scam", Details = "Asked for LKR 50,000" });
        Assert.Equal("Scam", report.Reason);
        Assert.Equal("Open", report.Status);

        var again = await Assert.ThrowsAsync<AppException>(() =>
            safety.ReportAsync(me.Id, new CreateReportDto { ProfileId = scammer.Id, Reason = "FakeProfile" }));
        Assert.Equal(409, again.Status);

        var noDetails = await Assert.ThrowsAsync<AppException>(() =>
            safety.ReportAsync(me.Id, new CreateReportDto { ProfileId = Guid.NewGuid(), Reason = "Other" }));
        Assert.Equal(400, noDetails.Status);
    }
}
