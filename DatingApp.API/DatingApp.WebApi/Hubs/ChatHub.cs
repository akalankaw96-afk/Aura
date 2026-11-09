using System.Text.RegularExpressions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.WebApi.Hubs;

public class ChatHub : Hub
{
    private readonly IApplicationDbContext _context;

    public ChatHub(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, conversationId);
        if (conversationId.StartsWith("conv_"))
        {
            var parts = conversationId.Split('_');
            if (parts.Length == 3)
            {
                var reverseConvId = $"conv_{parts[2]}_{parts[1]}";
                await Groups.AddToGroupAsync(Context.ConnectionId, reverseConvId);
            }
        }
        await Clients.Caller.SendAsync("JoinedConversation", conversationId);
    }

    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationId);
        if (conversationId.StartsWith("conv_"))
        {
            var parts = conversationId.Split('_');
            if (parts.Length == 3)
            {
                var reverseConvId = $"conv_{parts[2]}_{parts[1]}";
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, reverseConvId);
            }
        }
    }

    public async Task SendMessage(string senderProfileIdStr, string receiverProfileIdStr, string messageText, string? conversationId)
    {
        if (string.IsNullOrWhiteSpace(messageText)) return;

        if (!Guid.TryParse(senderProfileIdStr, out var senderProfileId))
        {
            // Try lookup by profile Code (e.g. LK-9021)
            var senderProf = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.Code == senderProfileIdStr);
            if (senderProf != null) senderProfileId = senderProf.Id;
            else senderProfileId = Guid.NewGuid();
        }

        if (!Guid.TryParse(receiverProfileIdStr, out var receiverProfileId))
        {
            var receiverProf = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.Code == receiverProfileIdStr);
            if (receiverProf != null) receiverProfileId = receiverProf.Id;
            else receiverProfileId = Guid.NewGuid();
        }

        var convId = string.IsNullOrWhiteSpace(conversationId)
            ? $"conv_{senderProfileId}_{receiverProfileId}"
            : conversationId;

        // Flow 3 Anti-Scam & Safety Scanner
        bool isFlagged = false;
        string? flagReason = null;

        var scamMoneyRegex = new Regex(@"\b(money|transfer|bank\s*account|cash|rupees|rs\.?|lkr|emergency\s*fund|crypto|usdt|bitcoin)\b", RegexOptions.IgnoreCase);
        var phoneRegex = new Regex(@"(\+?\d[\d\s-]{7,}\d)");
        var linkRegex = new Regex(@"(https?:\/\/|www\.|\.com|\.lk|\.net)", RegexOptions.IgnoreCase);

        if (scamMoneyRegex.IsMatch(messageText))
        {
            isFlagged = true;
            flagReason = "Safety Alert: Potential financial solicitation or scam phrase detected. Never send money to individuals online.";
        }
        else if (phoneRegex.IsMatch(messageText) || linkRegex.IsMatch(messageText))
        {
            // Check if contact sharing has been mutually unlocked
            var contactShareExists = await _context.ChatMessages.AnyAsync(m =>
                m.ConversationId == convId && m.IsContactShareAccepted);

            if (!contactShareExists)
            {
                isFlagged = true;
                flagReason = "Notice: Direct contact numbers and links are hidden until mutual contact exchange is requested and accepted.";
            }
        }

        var entity = new ChatMessage
        {
            SenderProfileId = senderProfileId,
            ReceiverProfileId = receiverProfileId,
            ConversationId = convId,
            MessageText = messageText,
            IsRead = false,
            IsFlaggedBySafety = isFlagged,
            SafetyFlagReason = flagReason,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            _context.ChatMessages.Add(entity);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Persist message error (non-fatal): {ex.Message}");
        }

        var senderName = (await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.Id == senderProfileId))?.FullName ?? "Member";
        var senderPhoto = (await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.Id == senderProfileId))?.PhotoUrl ?? "/brand/couple.png";
        var receiverName = (await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.Id == receiverProfileId))?.FullName ?? "Member";

        var dto = new ChatMessageDto
        {
            Id = entity.Id,
            SenderProfileId = senderProfileId,
            SenderName = senderName,
            SenderPhotoUrl = senderPhoto,
            ReceiverProfileId = receiverProfileId,
            ReceiverName = receiverName,
            ConversationId = convId,
            MessageText = messageText,
            SentAt = entity.CreatedAt,
            IsRead = false,
            IsMe = false,
            IsFlaggedBySafety = isFlagged,
            SafetyFlagReason = flagReason
        };

        // Broadcast to conversation group and caller
        await Clients.Group(convId).SendAsync("ReceiveMessage", dto);
        await Clients.Caller.SendAsync("MessageSentConfirmation", dto);
    }

    public async Task SendTyping(string conversationId, string userName, bool isTyping)
    {
        await Clients.OthersInGroup(conversationId).SendAsync("UserTyping", new TypingIndicatorDto
        {
            ConversationId = conversationId,
            UserName = userName,
            IsTyping = isTyping
        });
    }

    public async Task MarkAsRead(string conversationId, string messageIdStr)
    {
        if (Guid.TryParse(messageIdStr, out var messageId))
        {
            var msg = await _context.ChatMessages.FirstOrDefaultAsync(m => m.Id == messageId);
            if (msg != null && !msg.IsRead)
            {
                msg.IsRead = true;
                msg.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        await Clients.OthersInGroup(conversationId).SendAsync("MessageRead", conversationId, messageIdStr);
    }

    public async Task RequestContactShare(string conversationId, string senderProfileIdStr, string receiverProfileIdStr)
    {
        Guid.TryParse(senderProfileIdStr, out var senderProfileId);
        Guid.TryParse(receiverProfileIdStr, out var receiverProfileId);

        var requestMsg = new ChatMessage
        {
            SenderProfileId = senderProfileId,
            ReceiverProfileId = receiverProfileId,
            ConversationId = conversationId,
            MessageText = "📱 Request to exchange direct phone number and WhatsApp contact details.",
            IsContactShareRequest = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(requestMsg);
        await _context.SaveChangesAsync();

        await Clients.Group(conversationId).SendAsync("ContactShareRequested", conversationId, senderProfileIdStr);
    }

    public async Task AcceptContactShare(string conversationId, string accepterProfileIdStr, string partnerProfileIdStr)
    {
        Guid.TryParse(accepterProfileIdStr, out var accepterProfileId);
        Guid.TryParse(partnerProfileIdStr, out var partnerProfileId);

        var accepterProf = await _context.CandidateProfiles.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == accepterProfileId);
        var partnerProf = await _context.CandidateProfiles.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == partnerProfileId);

        var unlockMsg = new ChatMessage
        {
            SenderProfileId = accepterProfileId,
            ReceiverProfileId = partnerProfileId,
            ConversationId = conversationId,
            MessageText = $"🎉 Mutual contact details unlocked! {accepterProf?.FullName}'s Contact: {accepterProf?.User?.PhoneNumber ?? "+94 77 123 4567"}",
            IsContactShareAccepted = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(unlockMsg);
        await _context.SaveChangesAsync();

        await Clients.Group(conversationId).SendAsync("ContactUnlocked", new
        {
            conversationId,
            unlockedBy = accepterProfileIdStr,
            phoneNumber = accepterProf?.User?.PhoneNumber ?? "+94 77 123 4567",
            partnerPhoneNumber = partnerProf?.User?.PhoneNumber ?? "+94 71 987 6543"
        });
    }
}
