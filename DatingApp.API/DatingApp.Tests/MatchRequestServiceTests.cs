using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;

namespace DatingApp.Tests;

public class MatchRequestServiceTests
{
    [Fact]
    public async Task Sending_the_same_interest_twice_is_a_conflict()
    {
        using var db = TestDb.Create();
        var (_, amal) = await TestDb.AddMemberAsync(db, "Amal", "+94770000011");
        var (_, nimmi) = await TestDb.AddMemberAsync(db, "Nimmi", "+94770000012");
        var service = new MatchRequestService(db);

        await service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id });
        var ex = await Assert.ThrowsAsync<AppException>(() =>
            service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id }));

        Assert.Equal(409, ex.Status);
    }

    [Fact]
    public async Task Interest_to_yourself_or_an_unknown_member_is_refused()
    {
        using var db = TestDb.Create();
        var (_, amal) = await TestDb.AddMemberAsync(db, "Amal", "+94770000011");
        var service = new MatchRequestService(db);

        var self = await Assert.ThrowsAsync<AppException>(() =>
            service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = amal.Id }));
        Assert.Equal(400, self.Status);

        var unknown = await Assert.ThrowsAsync<AppException>(() =>
            service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = Guid.NewGuid() }));
        Assert.Equal(404, unknown.Status);
    }

    [Fact]
    public async Task Only_the_receiver_can_answer_and_only_once()
    {
        using var db = TestDb.Create();
        var (_, amal) = await TestDb.AddMemberAsync(db, "Amal", "+94770000011");
        var (_, nimmi) = await TestDb.AddMemberAsync(db, "Nimmi", "+94770000012");
        var service = new MatchRequestService(db);
        var request = await service.SendRequestAsync(amal.Id, new CreateMatchRequestDto { ReceiverProfileId = nimmi.Id });

        var notMine = await Assert.ThrowsAsync<AppException>(() => service.RespondRequestAsync(request.Id, amal.Id, true));
        Assert.Equal(404, notMine.Status);

        Assert.True(await service.RespondRequestAsync(request.Id, nimmi.Id, true));

        var twice = await Assert.ThrowsAsync<AppException>(() => service.RespondRequestAsync(request.Id, nimmi.Id, false));
        Assert.Equal(409, twice.Status);
    }
}
