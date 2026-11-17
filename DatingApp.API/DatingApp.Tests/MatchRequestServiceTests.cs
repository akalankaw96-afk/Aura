using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Domain.Enums;
using DatingApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Interests lifecycle (S01 errors, S03-T05 limits / withdraw / lists / notifications).</summary>
public class MatchRequestServiceTests
{
    private static MatchRequestService Service(ApplicationDbContext db) =>
        new(db, new UsageService(db), new NotificationService(db, new CapturingSmsSender()));

    [Fact]
    public async Task Sending_the_same_interest_twice_is_a_conflict()
    {
        using var db = TestDb.Create();
        var (_, amal) = await TestDb.AddApprovedMemberAsync(db, "Amal", "+94770000011");
        var (_, nimmi) = await TestDb.AddApprovedMemberAsync(db, "Nimmi", "+94770000012");
        var service = Service(db);

        await service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id });
        var ex = await Assert.ThrowsAsync<AppException>(() =>
            service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id }));

        Assert.Equal(409, ex.Status);
    }

    [Fact]
    public async Task Interest_to_yourself_an_unknown_or_unapproved_member_is_refused()
    {
        using var db = TestDb.Create();
        var (_, amal) = await TestDb.AddApprovedMemberAsync(db, "Amal", "+94770000011");
        var (_, draft) = await TestDb.AddMemberAsync(db, "Draft", "+94770000013");
        var service = Service(db);

        var self = await Assert.ThrowsAsync<AppException>(() =>
            service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = amal.Id }));
        Assert.Equal(400, self.Status);

        var unknown = await Assert.ThrowsAsync<AppException>(() =>
            service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = Guid.NewGuid() }));
        Assert.Equal(404, unknown.Status);

        var hidden = await Assert.ThrowsAsync<AppException>(() =>
            service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = draft.Id }));
        Assert.Equal(404, hidden.Status);
    }

    [Fact]
    public async Task A_member_who_is_not_approved_cannot_send()
    {
        using var db = TestDb.Create();
        var (_, draft) = await TestDb.AddMemberAsync(db, "Draft", "+94770000013");
        var (_, nimmi) = await TestDb.AddApprovedMemberAsync(db, "Nimmi", "+94770000012");

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            Service(db).SendRequestAsync(draft.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id }));
        Assert.Equal(403, ex.Status);
        Assert.Equal(ErrorCodes.KycRequired, ex.Code);
    }

    [Fact]
    public async Task Only_the_receiver_can_answer_and_only_once_and_the_sender_is_told()
    {
        using var db = TestDb.Create();
        var (amalUser, amal) = await TestDb.AddApprovedMemberAsync(db, "Amal", "+94770000011");
        var (nimmiUser, nimmi) = await TestDb.AddApprovedMemberAsync(db, "Nimmi", "+94770000012");
        var service = Service(db);
        var request = await service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id });
        Assert.True(await db.Notifications.AnyAsync(n => n.UserId == nimmiUser.Id && n.Type == "interest.received"));

        var notMine = await Assert.ThrowsAsync<AppException>(() => service.RespondRequestAsync(request.Id, amal.Id, true));
        Assert.Equal(404, notMine.Status);

        Assert.True(await service.RespondRequestAsync(request.Id, nimmi.Id, true));
        Assert.True(await db.Notifications.AnyAsync(n => n.UserId == amalUser.Id && n.Type == "interest.accepted"));

        var twice = await Assert.ThrowsAsync<AppException>(() => service.RespondRequestAsync(request.Id, nimmi.Id, false));
        Assert.Equal(409, twice.Status);

        Assert.Single(await service.ListAsync(amal.Id, "matched"));
        Assert.Single(await service.ListAsync(nimmi.Id, "matched"));
        Assert.Empty(await service.ListAsync(nimmi.Id, "received"));
    }

    [Fact]
    public async Task Free_members_send_three_interests_a_month()
    {
        using var db = TestDb.Create();
        var (_, amal) = await TestDb.AddApprovedMemberAsync(db, "Amal", "+94770000011");
        var service = Service(db);
        for (var i = 0; i < 3; i++)
        {
            var (_, other) = await TestDb.AddApprovedMemberAsync(db, $"Member {i}", $"+9477000010{i}");
            await service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = other.Id });
        }
        var (_, fourth) = await TestDb.AddApprovedMemberAsync(db, "Fourth", "+94770000109");

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = fourth.Id }));
        Assert.Equal(402, ex.Status);
        Assert.Equal("Interest", ex.Extensions["feature"]);
        Assert.Equal(3, await db.MatchRequests.CountAsync()); // nothing saved for the refused one
    }

    [Fact]
    public async Task Withdraw_hides_the_interest_and_it_can_be_sent_again()
    {
        using var db = TestDb.Create();
        var (_, amal) = await TestDb.AddApprovedMemberAsync(db, "Amal", "+94770000011");
        var (_, nimmi) = await TestDb.AddApprovedMemberAsync(db, "Nimmi", "+94770000012");
        var service = Service(db);
        var request = await service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id });

        var notSender = await Assert.ThrowsAsync<AppException>(() => service.WithdrawAsync(request.Id, nimmi.Id));
        Assert.Equal(404, notSender.Status);

        await service.WithdrawAsync(request.Id, amal.Id);
        Assert.Empty(await service.ListAsync(nimmi.Id, "received"));
        Assert.Empty(await service.ListAsync(amal.Id, "sent"));
        var answer = await Assert.ThrowsAsync<AppException>(() => service.RespondRequestAsync(request.Id, nimmi.Id, true));
        Assert.Equal(409, answer.Status);

        var again = await service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id });
        Assert.Equal(request.Id, again.Id); // same row, reopened
        Assert.Equal("Pending", again.Status);
        Assert.Single(await service.ListAsync(nimmi.Id, "received"));
    }

    [Fact]
    public async Task A_declined_interest_cannot_be_resent_and_shows_as_declined_to_the_sender()
    {
        using var db = TestDb.Create();
        var (_, amal) = await TestDb.AddApprovedMemberAsync(db, "Amal", "+94770000011");
        var (_, nimmi) = await TestDb.AddApprovedMemberAsync(db, "Nimmi", "+94770000012");
        var service = Service(db);
        var request = await service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id });
        await service.RespondRequestAsync(request.Id, nimmi.Id, false);

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id }));
        Assert.Equal(409, ex.Status);

        var sent = Assert.Single(await service.ListAsync(amal.Id, "sent"));
        Assert.Equal("Declined", sent.Status);
        Assert.Equal("Nimmi", sent.Profile.Name);
    }
}
