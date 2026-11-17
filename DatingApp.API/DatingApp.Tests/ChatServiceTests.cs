using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Services;
using DatingApp.Infrastructure.Persistence;

namespace DatingApp.Tests;

public class ChatServiceTests
{
    internal static ChatService Chat(ApplicationDbContext db) => new(db, new FakePresence(), new UsageService(db));

    [Fact]
    public async Task Members_without_an_accepted_interest_cannot_chat()
    {
        using var db = TestDb.Create();
        var (amal, _) = await TestDb.AddMemberAsync(db, "Amal", "+94770000011");
        var (_, nimmi) = await TestDb.AddMemberAsync(db, "Nimmi", "+94770000012");
        var chat = Chat(db);

        var ex = await Assert.ThrowsAsync<AppException>(() => chat.SendMessageAsync(amal.Id, nimmi.Id, "Hello"));

        Assert.Equal(403, ex.Status);
        Assert.Equal(ErrorCodes.NotMatched, ex.Code);
    }

    [Fact]
    public async Task Matched_members_share_one_conversation()
    {
        using var db = TestDb.Create();
        var (amalUser, amal) = await TestDb.AddMemberAsync(db, "Amal", "+94770000011");
        var (nimmiUser, nimmi) = await TestDb.AddMemberAsync(db, "Nimmi", "+94770000012");
        await TestDb.MatchAsync(db, amal, nimmi);
        var chat = Chat(db);

        var sent = await chat.SendMessageAsync(amalUser.Id, nimmi.Id, "Hello Nimmi");

        Assert.Equal(ChatService.ConversationIdFor(nimmi.Id, amal.Id), sent.Message.ConversationId);
        Assert.Equal(nimmiUser.Id, sent.Participants.PartnerUserId);
        Assert.True(sent.Message.IsMe);

        var nimmiView = await chat.GetHistoryAsync(nimmiUser.Id, sent.Message.ConversationId);
        var message = Assert.Single(nimmiView);
        Assert.False(message.IsMe);

        var conversations = await chat.GetConversationsAsync(nimmiUser.Id);
        Assert.Equal(1, Assert.Single(conversations).UnreadCount);
    }

    [Fact]
    public async Task Outsiders_cannot_read_a_conversation()
    {
        using var db = TestDb.Create();
        var (amalUser, amal) = await TestDb.AddMemberAsync(db, "Amal", "+94770000011");
        var (_, nimmi) = await TestDb.AddMemberAsync(db, "Nimmi", "+94770000012");
        var (outsider, _) = await TestDb.AddMemberAsync(db, "Kasun", "+94770000013");
        await TestDb.MatchAsync(db, amal, nimmi);
        var chat = Chat(db);
        var sent = await chat.SendMessageAsync(amalUser.Id, nimmi.Id, "Private");

        var ex = await Assert.ThrowsAsync<AppException>(() => chat.GetHistoryAsync(outsider.Id, sent.Message.ConversationId));

        Assert.Equal(404, ex.Status);
    }

    [Fact]
    public async Task Contact_details_unlock_only_after_the_other_member_accepts()
    {
        using var db = TestDb.Create();
        var (amalUser, amal) = await TestDb.AddMemberAsync(db, "Amal", "+94770000011");
        var (nimmiUser, nimmi) = await TestDb.AddMemberAsync(db, "Nimmi", "+94770000012");
        await TestDb.MatchAsync(db, amal, nimmi);
        await TestDb.MakePaidAsync(db, amalUser.Id); // asking for numbers is a Gold feature (S03-T07)
        var chat = Chat(db);

        // nobody asked yet → nothing to accept
        await Assert.ThrowsAsync<AppException>(() => chat.AcceptContactShareAsync(nimmiUser.Id, amal.Id));

        await chat.RequestContactShareAsync(amalUser.Id, nimmi.Id);

        // the requester cannot accept their own request
        await Assert.ThrowsAsync<AppException>(() => chat.AcceptContactShareAsync(amalUser.Id, nimmi.Id));

        var unlock = await chat.AcceptContactShareAsync(nimmiUser.Id, amal.Id);
        Assert.Equal("+94770000012", unlock.MyPhone);
        Assert.Equal("+94770000011", unlock.PartnerPhone);
    }

    [Fact]
    public async Task Phone_numbers_are_flagged_until_contact_is_shared()
    {
        using var db = TestDb.Create();
        var (amalUser, amal) = await TestDb.AddMemberAsync(db, "Amal", "+94770000011");
        var (_, nimmi) = await TestDb.AddMemberAsync(db, "Nimmi", "+94770000012");
        await TestDb.MatchAsync(db, amal, nimmi);
        var chat = Chat(db);

        var sent = await chat.SendMessageAsync(amalUser.Id, nimmi.Id, "Call me on 077 123 4567");

        Assert.True(sent.Message.IsFlaggedBySafety);
    }

    [Fact]
    public async Task Empty_and_overlong_messages_are_rejected()
    {
        using var db = TestDb.Create();
        var (amalUser, amal) = await TestDb.AddMemberAsync(db, "Amal", "+94770000011");
        var (_, nimmi) = await TestDb.AddMemberAsync(db, "Nimmi", "+94770000012");
        await TestDb.MatchAsync(db, amal, nimmi);
        var chat = Chat(db);

        await Assert.ThrowsAsync<AppException>(() => chat.SendMessageAsync(amalUser.Id, nimmi.Id, "   "));
        await Assert.ThrowsAsync<AppException>(() =>
            chat.SendMessageAsync(amalUser.Id, nimmi.Id, new string('a', ChatService.MaxMessageLength + 1)));
    }
}
