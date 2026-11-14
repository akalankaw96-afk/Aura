using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace DatingApp.WebApi.Hubs;

/// <summary>
/// Real-time chat (S01-T06). Signed-in members only: the identity comes from the access token
/// (sent as ?access_token=… on the WebSocket, see Program.cs), never from method arguments.
/// Events go to users (Clients.User → the NameIdentifier claim), so nobody can listen in by
/// joining someone else's conversation.
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chat;
    private readonly IPresenceTracker _presence;

    public ChatHub(IChatService chat, IPresenceTracker presence)
    {
        _chat = chat;
        _presence = presence;
    }

    private Guid UserId =>
        Guid.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new HubException("Please log in to continue.");

    public override async Task OnConnectedAsync()
    {
        _presence.Connected(UserId, Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (Guid.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
            _presence.Disconnected(id, Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>Checks the caller belongs to the conversation. Kept for the web client's flow; events are routed per user.</summary>
    public Task JoinConversation(string conversationId) => Guard(async () =>
    {
        var p = await _chat.GetParticipantsAsync(UserId, conversationId, Context.ConnectionAborted);
        await Clients.Caller.SendAsync("JoinedConversation", p.ConversationId);
    });

    public Task LeaveConversation(string conversationId) => Task.CompletedTask;

    public Task SendMessage(string receiverProfileId, string messageText) => Guard(async () =>
    {
        var delivery = await _chat.SendMessageAsync(UserId, ParseId(receiverProfileId), messageText, Context.ConnectionAborted);
        await Deliver(delivery, "ReceiveMessage");
    });

    public Task SendTyping(string conversationId, bool isTyping) => Guard(async () =>
    {
        var p = await _chat.GetParticipantsAsync(UserId, conversationId, Context.ConnectionAborted);
        await Clients.User(p.PartnerUserId.ToString()).SendAsync("UserTyping", new TypingIndicatorDto
        {
            ConversationId = p.ConversationId,
            UserName = p.MyName,
            IsTyping = isTyping
        });
    });

    public Task MarkAsRead(string messageId) => Guard(async () =>
    {
        var receipt = await _chat.MarkAsReadAsync(UserId, ParseId(messageId), Context.ConnectionAborted);
        if (receipt == null) return;
        await Clients.Users(receipt.SenderUserId.ToString(), UserId.ToString())
            .SendAsync("MessageRead", receipt.ConversationId, receipt.MessageId.ToString());
    });

    public Task RequestContactShare(string partnerProfileId) => Guard(async () =>
    {
        var delivery = await _chat.RequestContactShareAsync(UserId, ParseId(partnerProfileId), Context.ConnectionAborted);
        await Deliver(delivery, "ReceiveMessage");
        var p = delivery.Participants;
        await Clients.Users(p.MyUserId.ToString(), p.PartnerUserId.ToString())
            .SendAsync("ContactShareRequested", p.ConversationId, p.MyProfileId.ToString());
    });

    public Task AcceptContactShare(string partnerProfileId) => Guard(async () =>
    {
        var unlock = await _chat.AcceptContactShareAsync(UserId, ParseId(partnerProfileId), Context.ConnectionAborted);
        await Deliver(new ChatDelivery(unlock.Participants, unlock.Message), "ReceiveMessage");

        // Each side receives the OTHER person's number
        var p = unlock.Participants;
        await Clients.User(p.MyUserId.ToString()).SendAsync("ContactUnlocked", new
        {
            conversationId = p.ConversationId,
            unlockedBy = p.MyProfileId.ToString(),
            phoneNumber = unlock.PartnerPhone,
            partnerPhoneNumber = unlock.PartnerPhone
        });
        await Clients.User(p.PartnerUserId.ToString()).SendAsync("ContactUnlocked", new
        {
            conversationId = p.ConversationId,
            unlockedBy = p.MyProfileId.ToString(),
            phoneNumber = unlock.MyPhone,
            partnerPhoneNumber = unlock.MyPhone
        });
    });

    // ---- helpers ----

    /// <summary>Sender gets the message as "mine" (MessageSentConfirmation), the receiver as theirs.</summary>
    private async Task Deliver(ChatDelivery delivery, string receiverEvent)
    {
        var p = delivery.Participants;
        var mine = delivery.Message;
        mine.IsMe = true;
        await Clients.User(p.MyUserId.ToString()).SendAsync("MessageSentConfirmation", mine);

        var theirs = Clone(mine);
        theirs.IsMe = false;
        await Clients.User(p.PartnerUserId.ToString()).SendAsync(receiverEvent, theirs);
    }

    private static ChatMessageDto Clone(ChatMessageDto m) => new()
    {
        Id = m.Id,
        SenderProfileId = m.SenderProfileId,
        SenderName = m.SenderName,
        SenderPhotoUrl = m.SenderPhotoUrl,
        ReceiverProfileId = m.ReceiverProfileId,
        ReceiverName = m.ReceiverName,
        ConversationId = m.ConversationId,
        MessageText = m.MessageText,
        SentAt = m.SentAt,
        IsRead = m.IsRead,
        IsMe = m.IsMe,
        IsFlaggedBySafety = m.IsFlaggedBySafety,
        SafetyFlagReason = m.SafetyFlagReason,
        IsContactShareRequest = m.IsContactShareRequest,
        IsContactShareAccepted = m.IsContactShareAccepted
    };

    private static Guid ParseId(string value) =>
        Guid.TryParse(value, out var id) ? id : throw new HubException("Member not found.");

    /// <summary>Expected failures reach the client as a HubException with a safe message.</summary>
    private static async Task Guard(Func<Task> action)
    {
        try
        {
            await action();
        }
        catch (AppException ex)
        {
            throw new HubException($"{ex.Code}: {ex.Message}");
        }
    }
}
