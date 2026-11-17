using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>The member dashboard in one call (S03-T09): usage, views, interests, shortlist, unread messages.</summary>
public interface IDashboardService
{
    Task<DashboardDto> GetAsync(Guid userId, CancellationToken ct = default);
}

public class DashboardService : IDashboardService
{
    private const int RecentViewers = 6;
    private const int RecentChats = 5;
    private readonly IApplicationDbContext _context;
    private readonly IUsageService _usage;
    private readonly IProfileViewService _views;
    private readonly IChatService _chat;

    public DashboardService(IApplicationDbContext context, IUsageService usage, IProfileViewService views, IChatService chat)
    {
        _context = context;
        _usage = usage;
        _views = views;
        _chat = chat;
    }

    public async Task<DashboardDto> GetAsync(Guid userId, CancellationToken ct = default)
    {
        var dto = new DashboardDto { Usage = await _usage.GetUsageAsync(userId, ct) };
        var me = await _context.ProfileIdOfAsync(userId, ct);
        if (!me.HasValue) return dto;
        var hidden = await _context.HiddenProfileIdsAsync(me.Value, ct);

        // who viewed me — names for paid plans only (same rule as GET /profile-views/viewers)
        var viewers = await _views.GetViewersAsync(userId, ct);
        dto.ProfileViewers = viewers.Total;
        dto.ViewersLocked = viewers.Locked;
        dto.RecentViewers = viewers.Items.Take(RecentViewers).ToList();
        var weekAgo = DateTime.UtcNow.AddDays(-7);
        var weekViewerUserIds = await _context.ProfileViews.AsNoTracking()
            .Where(v => v.ViewedProfileId == me.Value && v.ViewerUserId != userId && v.LastViewedAt >= weekAgo)
            .Select(v => v.ViewerUserId).ToListAsync(ct);
        dto.ProfileViewersThisWeek = await _context.CandidateProfiles.AsNoTracking()
            .CountAsync(p => weekViewerUserIds.Contains(p.UserId) && p.Status == ProfileStatus.Approved && !hidden.Contains(p.Id), ct);

        // interests and matches (other side still visible to me)
        var interests = await _context.MatchRequests.AsNoTracking()
            .Where(r => (r.ReceiverProfileId == me.Value || r.SenderProfileId == me.Value) && r.Status != MatchRequestStatus.Withdrawn)
            .Select(r => new
            {
                r.Status,
                Received = r.ReceiverProfileId == me.Value,
                OtherId = r.ReceiverProfileId == me.Value ? r.SenderProfileId : r.ReceiverProfileId,
                OtherApproved = (r.ReceiverProfileId == me.Value ? r.SenderProfile!.Status : r.ReceiverProfile!.Status) == ProfileStatus.Approved
            })
            .ToListAsync(ct);
        var visible = interests.Where(i => i.OtherApproved && !hidden.Contains(i.OtherId)).ToList();
        dto.InterestsReceived = visible.Count(i => i.Received);
        dto.InterestsWaiting = visible.Count(i => i.Received && i.Status == MatchRequestStatus.Pending);
        dto.InterestsSentWaiting = visible.Count(i => !i.Received && i.Status == MatchRequestStatus.Pending);
        dto.Matches = visible.Count(i => i.Status == MatchRequestStatus.Accepted);

        // members who shortlisted me
        var shortlisterUserIds = await _context.Shortlists.AsNoTracking()
            .Where(s => s.ProfileId == me.Value).Select(s => s.UserId).ToListAsync(ct);
        dto.ShortlistedBy = await _context.CandidateProfiles.AsNoTracking()
            .CountAsync(p => shortlisterUserIds.Contains(p.UserId) && p.Status == ProfileStatus.Approved && !hidden.Contains(p.Id), ct);

        // messages — blocked chats don't count
        var conversations = (await _chat.GetConversationsAsync(userId, ct)).Where(c => !c.IsBlocked).ToList();
        dto.UnreadMessages = conversations.Sum(c => c.UnreadCount);
        dto.UnreadChats = conversations.Count(c => c.UnreadCount > 0);
        dto.RecentConversations = conversations.Take(RecentChats).ToList();
        return dto;
    }
}
