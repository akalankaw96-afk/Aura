using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

public interface IProfileViewService
{
    /// <summary>
    /// Records that a signed-in member opened an approved profile and counts it against the plan (402 LIMIT_REACHED).
    /// Free of charge: your own profile, staff, a profile you already opened this month, and members you share an interest with.
    /// </summary>
    Task RecordViewAsync(Guid viewerUserId, Guid profileId, CancellationToken ct = default);
    /// <summary>Who viewed my profile — the list is for paid plans; free members get the total only.</summary>
    Task<ProfileViewersDto> GetViewersAsync(Guid userId, CancellationToken ct = default);
    /// <summary>Profiles I opened, most recent first.</summary>
    Task<List<ProfileViewItemDto>> GetRecentAsync(Guid userId, int take = 20, CancellationToken ct = default);
}

public class ProfileViewService : IProfileViewService
{
    private const int MaxItems = 50;
    private readonly IApplicationDbContext _context;
    private readonly IUsageService _usage;

    public ProfileViewService(IApplicationDbContext context, IUsageService usage)
    {
        _context = context;
        _usage = usage;
    }

    public async Task RecordViewAsync(Guid viewerUserId, Guid profileId, CancellationToken ct = default)
    {
        var viewer = await _context.Users.AsNoTracking()
            .Where(u => u.Id == viewerUserId)
            .Select(u => new { u.Role, ProfileId = u.Profile != null ? (Guid?)u.Profile.Id : null })
            .FirstOrDefaultAsync(ct);
        if (viewer == null || viewer.Role is Roles.Admin or Roles.Moderator) return; // staff are not counted or shown
        if (viewer.ProfileId == profileId) return;                                  // your own profile
        if (viewer.ProfileId.HasValue && await _context.IsBlockedEitherWayAsync(viewer.ProfileId.Value, profileId, ct))
            throw AppException.NotFound("This profile was not found.");             // blocked either way (S03-T07)

        var now = DateTime.UtcNow;
        var monthStart = UsageService.PeriodStartFor(now).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var row = await _context.ProfileViews
            .FirstOrDefaultAsync(v => v.ViewerUserId == viewerUserId && v.ViewedProfileId == profileId, ct);

        var openedThisMonth = row != null && row.LastViewedAt >= monthStart;
        var connected = viewer.ProfileId.HasValue && await _context.MatchRequests.AnyAsync(r =>
            ((r.SenderProfileId == viewer.ProfileId && r.ReceiverProfileId == profileId) ||
             (r.SenderProfileId == profileId && r.ReceiverProfileId == viewer.ProfileId)) &&
            (r.Status == MatchRequestStatus.Pending || r.Status == MatchRequestStatus.Accepted), ct);

        if (!openedThisMonth && !connected)
            await _usage.ConsumeAsync(viewerUserId, UsageFeature.ProfileView, ct); // throws 402 before anything is saved

        if (row == null)
        {
            _context.ProfileViews.Add(new ProfileView { ViewerUserId = viewerUserId, ViewedProfileId = profileId, LastViewedAt = now });
        }
        else
        {
            row.ViewCount += 1;
            row.LastViewedAt = now;
            row.UpdatedAt = now;
        }
        await _context.SaveChangesAsync(ct);
    }

    public async Task<ProfileViewersDto> GetViewersAsync(Guid userId, CancellationToken ct = default)
    {
        var plan = await _usage.GetPlanAsync(userId, ct);
        var result = new ProfileViewersDto { PlanId = plan, Locked = plan == Plans.Free };

        var myProfileId = await _context.CandidateProfiles.Where(p => p.UserId == userId)
            .Select(p => (Guid?)p.Id).FirstOrDefaultAsync(ct);
        if (!myProfileId.HasValue) return result;

        var views = await _context.ProfileViews.AsNoTracking()
            .Where(v => v.ViewedProfileId == myProfileId.Value && v.ViewerUserId != userId)
            .OrderByDescending(v => v.LastViewedAt)
            .ToListAsync(ct);

        // only viewers who are themselves visible (approved) are listed or counted
        var viewerIds = views.Select(v => v.ViewerUserId).ToList();
        var profiles = await _context.CandidateProfiles.AsNoTracking()
            .Where(p => viewerIds.Contains(p.UserId) && p.Status == ProfileStatus.Approved && !p.IsHidden)
            .ToDictionaryAsync(p => p.UserId, ct);

        var hidden = await _context.HiddenProfileIdsAsync(myProfileId.Value, ct);
        var visible = views.Where(v => profiles.ContainsKey(v.ViewerUserId) && !hidden.Contains(profiles[v.ViewerUserId].Id)).ToList();
        result.Total = visible.Count;
        if (result.Locked) return result;

        result.Items = visible.Take(MaxItems).Select(v => new ProfileViewItemDto
        {
            Profile = ProfileService.MapToDto(profiles[v.ViewerUserId], includeMemberDetails: true),
            LastViewedAt = v.LastViewedAt,
            ViewCount = v.ViewCount
        }).ToList();
        return result;
    }

    public async Task<List<ProfileViewItemDto>> GetRecentAsync(Guid userId, int take = 20, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, MaxItems);
        var views = await _context.ProfileViews.AsNoTracking()
            .Where(v => v.ViewerUserId == userId)
            .OrderByDescending(v => v.LastViewedAt)
            .Take(take * 2) // room for profiles that are no longer visible
            .ToListAsync(ct);

        var ids = views.Select(v => v.ViewedProfileId).ToList();
        var profiles = await _context.CandidateProfiles.AsNoTracking()
            .Where(p => ids.Contains(p.Id) && p.Status == ProfileStatus.Approved && !p.IsHidden)
            .ToDictionaryAsync(p => p.Id, ct);

        var me = await _context.ProfileIdOfAsync(userId, ct);
        var hidden = me.HasValue ? await _context.HiddenProfileIdsAsync(me.Value, ct) : new List<Guid>();
        return views.Where(v => profiles.ContainsKey(v.ViewedProfileId) && !hidden.Contains(v.ViewedProfileId)).Take(take).Select(v => new ProfileViewItemDto
        {
            Profile = ProfileService.MapToDto(profiles[v.ViewedProfileId], includeMemberDetails: true),
            LastViewedAt = v.LastViewedAt,
            ViewCount = v.ViewCount
        }).ToList();
    }
}
