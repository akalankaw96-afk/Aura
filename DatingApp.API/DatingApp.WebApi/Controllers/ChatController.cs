using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : BaseApiController
{
    private readonly IApplicationDbContext _context;

    public ChatController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("conversations")]
    public async Task<ActionResult<List<ConversationDto>>> GetConversations([FromQuery] string? profileId)
    {
        // Find profile
        CandidateProfile? currentProfile = null;
        if (!string.IsNullOrEmpty(profileId))
        {
            if (Guid.TryParse(profileId, out var gId))
                currentProfile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.Id == gId);
            else
                currentProfile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.Code == profileId);
        }

        // Default to LK-9021 if not specified
        currentProfile ??= await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.Code == "LK-9021");

        if (currentProfile == null)
        {
            return Ok(new List<ConversationDto>());
        }

        // Accepted match requests determine mutual conversations (Flow 3)
        var acceptedMatches = await _context.MatchRequests
            .Include(m => m.SenderProfile)
            .Include(m => m.ReceiverProfile)
            .Where(m => m.Status == MatchRequestStatus.Accepted &&
                        (m.SenderProfileId == currentProfile.Id || m.ReceiverProfileId == currentProfile.Id))
            .ToListAsync();

        var result = new List<ConversationDto>();

        foreach (var match in acceptedMatches)
        {
            var partner = match.SenderProfileId == currentProfile.Id
                ? match.ReceiverProfile
                : match.SenderProfile;

            if (partner == null) continue;

            var convId = $"conv_{currentProfile.Id}_{partner.Id}";
            var reverseConvId = $"conv_{partner.Id}_{currentProfile.Id}";

            var lastMessage = await _context.ChatMessages
                .Where(m => m.ConversationId == convId || m.ConversationId == reverseConvId)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync();

            var unreadCount = await _context.ChatMessages
                .CountAsync(m => (m.ConversationId == convId || m.ConversationId == reverseConvId) &&
                                 m.ReceiverProfileId == currentProfile.Id && !m.IsRead);

            var contactShared = await _context.ChatMessages
                .AnyAsync(m => (m.ConversationId == convId || m.ConversationId == reverseConvId) && m.IsContactShareAccepted);

            var userObj = await _context.Users.FirstOrDefaultAsync(u => u.Id == partner.UserId);

            result.Add(new ConversationDto
            {
                ConversationId = convId,
                PartnerProfileId = partner.Id,
                PartnerName = partner.FullName,
                PartnerPhotoUrl = partner.PhotoUrl,
                PartnerProfession = partner.Profession,
                PartnerVerified = partner.Verified,
                PartnerOnline = true,
                LastMessageText = lastMessage?.MessageText ?? "Conversation started. Say hello!",
                LastMessageTime = lastMessage?.CreatedAt ?? match.CreatedAt,
                UnreadCount = unreadCount,
                IsContactShared = contactShared,
                PartnerPhoneNumber = contactShared ? userObj?.PhoneNumber : null
            });
        }

        return Ok(result);
    }

    [HttpGet("history/{conversationId}")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetHistory(string conversationId, [FromQuery] string? currentProfileId)
    {
        Guid.TryParse(currentProfileId, out var currentId);

        string? reverseConvId = null;
        if (conversationId.StartsWith("conv_"))
        {
            var parts = conversationId.Split('_');
            if (parts.Length == 3)
            {
                reverseConvId = $"conv_{parts[2]}_{parts[1]}";
            }
        }

        var messages = await _context.ChatMessages
            .Include(m => m.SenderProfile)
            .Include(m => m.ReceiverProfile)
            .Where(m => m.ConversationId == conversationId || (reverseConvId != null && m.ConversationId == reverseConvId))
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        var dtos = messages.Select(m => new ChatMessageDto
        {
            Id = m.Id,
            SenderProfileId = m.SenderProfileId,
            SenderName = m.SenderProfile?.FullName ?? "Member",
            SenderPhotoUrl = m.SenderProfile?.PhotoUrl ?? "/brand/couple.png",
            ReceiverProfileId = m.ReceiverProfileId,
            ReceiverName = m.ReceiverProfile?.FullName ?? "Member",
            ConversationId = m.ConversationId,
            MessageText = m.MessageText,
            SentAt = m.CreatedAt,
            IsRead = m.IsRead,
            IsMe = m.SenderProfileId == currentId,
            IsFlaggedBySafety = m.IsFlaggedBySafety,
            SafetyFlagReason = m.SafetyFlagReason,
            IsContactShareRequest = m.IsContactShareRequest,
            IsContactShareAccepted = m.IsContactShareAccepted
        }).ToList();

        return Ok(dtos);
    }
}
