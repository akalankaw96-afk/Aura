using System.Text.RegularExpressions;
using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>
/// Chat between matched members (S01-T06, BUG-004/005, TD-03).
/// Every call takes the signed-in user id from the JWT — never a profile id from the client —
/// and only members with an accepted match request can see or send messages to each other.
/// </summary>
public interface IChatService
{
    Task<List<ConversationDto>> GetConversationsAsync(Guid userId, CancellationToken ct = default);
    Task<List<ChatMessageDto>> GetHistoryAsync(Guid userId, string conversationId, CancellationToken ct = default);
    Task<ChatDelivery> SendMessageAsync(Guid userId, Guid receiverProfileId, string messageText, CancellationToken ct = default);
    Task<ChatParticipants> GetParticipantsAsync(Guid userId, string conversationId, CancellationToken ct = default);
    Task<ChatReadReceipt?> MarkAsReadAsync(Guid userId, Guid messageId, CancellationToken ct = default);
    Task<ChatDelivery> RequestContactShareAsync(Guid userId, Guid partnerProfileId, CancellationToken ct = default);
    Task<ContactUnlock> AcceptContactShareAsync(Guid userId, Guid partnerProfileId, CancellationToken ct = default);
}

/// <summary>The two sides of a conversation, for routing real-time events to the right users.</summary>
public record ChatParticipants(
    string ConversationId,
    Guid MyUserId, Guid MyProfileId, string MyName,
    Guid PartnerUserId, Guid PartnerProfileId);

/// <summary>A saved message plus who must receive it. <see cref="Message"/> is from the sender's point of view.</summary>
public record ChatDelivery(ChatParticipants Participants, ChatMessageDto Message);

public record ChatReadReceipt(string ConversationId, Guid MessageId, Guid SenderUserId);

public record ContactUnlock(ChatParticipants Participants, ChatMessageDto Message, string MyPhone, string PartnerPhone);

public class ChatService : IChatService
{
    public const int MaxMessageLength = 2000;

    private static readonly Regex ScamMoney = new(
        @"\b(money|transfer|bank\s*account|cash|rupees|rs\.?|lkr|emergency\s*fund|crypto|usdt|bitcoin)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, TimeSpan.FromMilliseconds(200));
    private static readonly Regex Phone = new(@"(\+?\d[\d\s-]{7,}\d)", RegexOptions.Compiled, TimeSpan.FromMilliseconds(200));
    private static readonly Regex Link = new(@"(https?:\/\/|www\.|\.com|\.lk|\.net)", RegexOptions.IgnoreCase | RegexOptions.Compiled, TimeSpan.FromMilliseconds(200));

    private readonly IApplicationDbContext _context;
    private readonly IPresenceTracker _presence;

    public ChatService(IApplicationDbContext context, IPresenceTracker presence)
    {
        _context = context;
        _presence = presence;
    }

    /// <summary>One id per pair, whichever side asks: conv_{smaller}_{larger}.</summary>
    public static string ConversationIdFor(Guid a, Guid b)
    {
        var (first, second) = a.CompareTo(b) <= 0 ? (a, b) : (b, a);
        return $"conv_{first}_{second}";
    }

    /// <summary>Both spellings a pair's messages may have been saved under (older rows used sender_receiver).</summary>
    private static (string Canonical, string Other) ConversationIds(Guid a, Guid b) =>
        (ConversationIdFor(a, b), ConversationIdFor(a, b) == $"conv_{a}_{b}" ? $"conv_{b}_{a}" : $"conv_{a}_{b}");

    private static bool TryParseConversationId(string conversationId, out Guid a, out Guid b)
    {
        a = b = Guid.Empty;
        var parts = (conversationId ?? string.Empty).Split('_');
        return parts.Length == 3 && parts[0] == "conv" && Guid.TryParse(parts[1], out a) && Guid.TryParse(parts[2], out b);
    }

    public async Task<List<ConversationDto>> GetConversationsAsync(Guid userId, CancellationToken ct = default)
    {
        var me = await _context.CandidateProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (me == null) return new List<ConversationDto>();

        var matches = await _context.MatchRequests.AsNoTracking()
            .Include(m => m.SenderProfile)
            .Include(m => m.ReceiverProfile)
            .Where(m => m.Status == MatchRequestStatus.Accepted &&
                        (m.SenderProfileId == me.Id || m.ReceiverProfileId == me.Id))
            .ToListAsync(ct);

        var result = new List<ConversationDto>();
        var seen = new HashSet<Guid>();

        foreach (var match in matches)
        {
            var partner = match.SenderProfileId == me.Id ? match.ReceiverProfile : match.SenderProfile;
            if (partner == null || !seen.Add(partner.Id)) continue;

            var (convId, otherId) = ConversationIds(me.Id, partner.Id);

            var lastMessage = await _context.ChatMessages.AsNoTracking()
                .Where(m => m.ConversationId == convId || m.ConversationId == otherId)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync(ct);

            var unreadCount = await _context.ChatMessages
                .CountAsync(m => (m.ConversationId == convId || m.ConversationId == otherId) &&
                                 m.ReceiverProfileId == me.Id && !m.IsRead, ct);

            var contactShared = await _context.ChatMessages
                .AnyAsync(m => (m.ConversationId == convId || m.ConversationId == otherId) && m.IsContactShareAccepted, ct);

            string? partnerPhone = null;
            if (contactShared)
            {
                partnerPhone = await _context.Users.Where(u => u.Id == partner.UserId)
                    .Select(u => u.PhoneNumber).FirstOrDefaultAsync(ct);
            }

            result.Add(new ConversationDto
            {
                ConversationId = convId,
                PartnerProfileId = partner.Id,
                PartnerName = partner.FullName,
                PartnerPhotoUrl = partner.PhotoUrl,
                PartnerProfession = partner.Profession,
                PartnerVerified = partner.Status == ProfileStatus.Approved,
                PartnerOnline = _presence.IsOnline(partner.UserId),
                LastMessageText = lastMessage?.MessageText ?? string.Empty,
                LastMessageTime = lastMessage?.CreatedAt ?? match.RespondedAt ?? match.CreatedAt,
                UnreadCount = unreadCount,
                IsContactShared = contactShared,
                PartnerPhoneNumber = partnerPhone
            });
        }

        return result.OrderByDescending(c => c.LastMessageTime).ToList();
    }

    public async Task<List<ChatMessageDto>> GetHistoryAsync(Guid userId, string conversationId, CancellationToken ct = default)
    {
        var participants = await GetParticipantsAsync(userId, conversationId, ct);
        var (convId, otherId) = ConversationIds(participants.MyProfileId, participants.PartnerProfileId);

        var messages = await _context.ChatMessages.AsNoTracking()
            .Include(m => m.SenderProfile)
            .Include(m => m.ReceiverProfile)
            .Where(m => m.ConversationId == convId || m.ConversationId == otherId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(ct);

        return messages.Select(m => ToDto(m, convId, participants.MyProfileId)).ToList();
    }

    public async Task<ChatParticipants> GetParticipantsAsync(Guid userId, string conversationId, CancellationToken ct = default)
    {
        if (!TryParseConversationId(conversationId, out var a, out var b))
            throw AppException.NotFound("Conversation not found.");

        var me = await RequireProfileAsync(userId, ct);
        if (me.Id != a && me.Id != b) throw AppException.NotFound("Conversation not found.");

        return await RequireMatchAsync(me, me.Id == a ? b : a, ct);
    }

    public async Task<ChatDelivery> SendMessageAsync(Guid userId, Guid receiverProfileId, string messageText, CancellationToken ct = default)
    {
        var text = (messageText ?? string.Empty).Trim();
        if (text.Length == 0) throw AppException.Validation("Type a message first.", "messageText");
        if (text.Length > MaxMessageLength)
            throw AppException.Validation($"Messages can be up to {MaxMessageLength} characters.", "messageText");

        var me = await RequireProfileAsync(userId, ct);
        var participants = await RequireMatchAsync(me, receiverProfileId, ct);
        var (convId, otherId) = ConversationIds(me.Id, receiverProfileId);

        // Flow 3 anti-scam & safety scanner
        bool flagged = false;
        string? reason = null;
        if (ScamMoney.IsMatch(text))
        {
            flagged = true;
            reason = "Safety Alert: Potential financial solicitation or scam phrase detected. Never send money to individuals online.";
        }
        else if (Phone.IsMatch(text) || Link.IsMatch(text))
        {
            var contactShared = await _context.ChatMessages.AnyAsync(m =>
                (m.ConversationId == convId || m.ConversationId == otherId) && m.IsContactShareAccepted, ct);
            if (!contactShared)
            {
                flagged = true;
                reason = "Notice: Direct contact numbers and links are hidden until mutual contact exchange is requested and accepted.";
            }
        }

        var entity = new ChatMessage
        {
            SenderProfileId = me.Id,
            ReceiverProfileId = receiverProfileId,
            ConversationId = convId,
            MessageText = text,
            IsFlaggedBySafety = flagged,
            SafetyFlagReason = reason,
            CreatedAt = DateTime.UtcNow
        };
        _context.ChatMessages.Add(entity);
        await _context.SaveChangesAsync(ct);

        return new ChatDelivery(participants, await LoadDtoAsync(entity.Id, convId, me.Id, ct));
    }

    public async Task<ChatReadReceipt?> MarkAsReadAsync(Guid userId, Guid messageId, CancellationToken ct = default)
    {
        var me = await RequireProfileAsync(userId, ct);
        var msg = await _context.ChatMessages.Include(m => m.SenderProfile)
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ReceiverProfileId == me.Id, ct);
        if (msg == null) return null; // only the receiver can mark a message read

        if (!msg.IsRead)
        {
            msg.IsRead = true;
            msg.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
        }

        var senderUserId = msg.SenderProfile?.UserId ?? Guid.Empty;
        return new ChatReadReceipt(ConversationIdFor(msg.SenderProfileId, msg.ReceiverProfileId), msg.Id, senderUserId);
    }

    public async Task<ChatDelivery> RequestContactShareAsync(Guid userId, Guid partnerProfileId, CancellationToken ct = default)
    {
        var me = await RequireProfileAsync(userId, ct);
        var participants = await RequireMatchAsync(me, partnerProfileId, ct);
        var (convId, otherId) = ConversationIds(me.Id, partnerProfileId);

        var alreadyShared = await _context.ChatMessages.AnyAsync(m =>
            (m.ConversationId == convId || m.ConversationId == otherId) && m.IsContactShareAccepted, ct);
        if (alreadyShared) throw AppException.Conflict("You have already shared contact details.");

        var entity = new ChatMessage
        {
            SenderProfileId = me.Id,
            ReceiverProfileId = partnerProfileId,
            ConversationId = convId,
            MessageText = "📱 Request to exchange direct phone number and WhatsApp contact details.",
            IsContactShareRequest = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ChatMessages.Add(entity);
        await _context.SaveChangesAsync(ct);

        return new ChatDelivery(participants, await LoadDtoAsync(entity.Id, convId, me.Id, ct));
    }

    public async Task<ContactUnlock> AcceptContactShareAsync(Guid userId, Guid partnerProfileId, CancellationToken ct = default)
    {
        var me = await RequireProfileAsync(userId, ct);
        var participants = await RequireMatchAsync(me, partnerProfileId, ct);
        var (convId, otherId) = ConversationIds(me.Id, partnerProfileId);

        // Only the person who was asked can accept — that is what makes it mutual
        var requested = await _context.ChatMessages.AnyAsync(m =>
            (m.ConversationId == convId || m.ConversationId == otherId) &&
            m.IsContactShareRequest && m.SenderProfileId == partnerProfileId && m.ReceiverProfileId == me.Id, ct);
        if (!requested)
            throw AppException.Forbidden("There is no contact-sharing request to accept.");

        var entity = new ChatMessage
        {
            SenderProfileId = me.Id,
            ReceiverProfileId = partnerProfileId,
            ConversationId = convId,
            MessageText = "🎉 Contact details shared. You can now call or WhatsApp each other.",
            IsContactShareAccepted = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ChatMessages.Add(entity);
        await _context.SaveChangesAsync(ct);

        var phones = await _context.Users.AsNoTracking()
            .Where(u => u.Id == participants.MyUserId || u.Id == participants.PartnerUserId)
            .Select(u => new { u.Id, u.PhoneNumber })
            .ToListAsync(ct);

        return new ContactUnlock(
            participants,
            await LoadDtoAsync(entity.Id, convId, me.Id, ct),
            phones.FirstOrDefault(p => p.Id == participants.MyUserId)?.PhoneNumber ?? string.Empty,
            phones.FirstOrDefault(p => p.Id == participants.PartnerUserId)?.PhoneNumber ?? string.Empty);
    }

    // ---- helpers ----

    private async Task<CandidateProfile> RequireProfileAsync(Guid userId, CancellationToken ct)
    {
        var me = await _context.CandidateProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, ct);
        return me ?? throw AppException.Forbidden("Create your profile before you start chatting.", ErrorCodes.ProfileRequired);
    }

    private async Task<ChatParticipants> RequireMatchAsync(CandidateProfile me, Guid partnerProfileId, CancellationToken ct)
    {
        if (partnerProfileId == me.Id) throw AppException.Validation("You cannot message yourself.", "receiverProfileId");

        var matched = await _context.MatchRequests.AnyAsync(m =>
            m.Status == MatchRequestStatus.Accepted &&
            ((m.SenderProfileId == me.Id && m.ReceiverProfileId == partnerProfileId) ||
             (m.SenderProfileId == partnerProfileId && m.ReceiverProfileId == me.Id)), ct);
        if (!matched)
            throw AppException.Forbidden("You can chat once your interest has been accepted.", ErrorCodes.NotMatched);

        var partnerUserId = await _context.CandidateProfiles.Where(p => p.Id == partnerProfileId)
            .Select(p => p.UserId).FirstOrDefaultAsync(ct);
        if (partnerUserId == Guid.Empty) throw AppException.NotFound("This member is no longer available.");

        return new ChatParticipants(ConversationIdFor(me.Id, partnerProfileId),
            me.UserId, me.Id, me.FullName, partnerUserId, partnerProfileId);
    }

    private async Task<ChatMessageDto> LoadDtoAsync(Guid messageId, string convId, Guid viewerProfileId, CancellationToken ct)
    {
        var m = await _context.ChatMessages.AsNoTracking()
            .Include(x => x.SenderProfile)
            .Include(x => x.ReceiverProfile)
            .FirstAsync(x => x.Id == messageId, ct);
        return ToDto(m, convId, viewerProfileId);
    }

    private static ChatMessageDto ToDto(ChatMessage m, string convId, Guid viewerProfileId) => new()
    {
        Id = m.Id,
        SenderProfileId = m.SenderProfileId,
        SenderName = m.SenderProfile?.FullName ?? "Member",
        SenderPhotoUrl = m.SenderProfile?.PhotoUrl ?? string.Empty,
        ReceiverProfileId = m.ReceiverProfileId,
        ReceiverName = m.ReceiverProfile?.FullName ?? "Member",
        ConversationId = convId,
        MessageText = m.MessageText,
        SentAt = m.CreatedAt,
        IsRead = m.IsRead,
        IsMe = m.SenderProfileId == viewerProfileId,
        IsFlaggedBySafety = m.IsFlaggedBySafety,
        SafetyFlagReason = m.SafetyFlagReason,
        IsContactShareRequest = m.IsContactShareRequest,
        IsContactShareAccepted = m.IsContactShareAccepted
    };
}
