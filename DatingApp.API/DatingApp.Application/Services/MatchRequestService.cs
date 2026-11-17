using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>Interests between members (S03-T05): send (plan-limited), withdraw, accept / decline, lists.</summary>
public interface IMatchRequestService
{
    Task<MatchRequestDto> SendRequestAsync(Guid senderProfileId, CreateMatchRequestDto dto, CancellationToken ct = default);
    Task<List<MatchRequestDto>> GetMyRequestsAsync(Guid profileId, CancellationToken ct = default);
    Task<bool> RespondRequestAsync(Guid requestId, Guid receiverProfileId, bool accept, CancellationToken ct = default);
    Task WithdrawAsync(Guid requestId, Guid senderProfileId, CancellationToken ct = default);
    /// <summary>box = "received" (waiting for my answer) · "sent" (mine, not withdrawn) · "matched" (accepted either way).</summary>
    Task<List<InterestDto>> ListAsync(Guid profileId, string box, CancellationToken ct = default);
}

public class MatchRequestService : IMatchRequestService
{
    public static readonly string[] Boxes = { "received", "sent", "matched" };

    private readonly IApplicationDbContext _context;
    private readonly IUsageService _usage;
    private readonly INotificationService _notifications;

    public MatchRequestService(IApplicationDbContext context, IUsageService usage, INotificationService notifications)
    {
        _context = context;
        _usage = usage;
        _notifications = notifications;
    }

    public async Task<MatchRequestDto> SendRequestAsync(Guid senderProfileId, CreateMatchRequestDto dto, CancellationToken ct = default)
    {
        if (senderProfileId == dto.ReceiverProfileId)
            throw AppException.Validation("You cannot send an interest to your own profile.", "receiverProfileId");

        var note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim();
        if (note?.Length > 500)
            throw AppException.Validation("Notes can be up to 500 characters.", "note");

        var sender = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.Id == senderProfileId, ct)
            ?? throw AppException.Forbidden("Create your profile before you send interests.", ErrorCodes.ProfileRequired);
        if (sender.Status != ProfileStatus.Approved)
            throw AppException.Forbidden("Your profile must be approved before you can send interests.", ErrorCodes.KycRequired);

        var receiver = await _context.CandidateProfiles
            .FirstOrDefaultAsync(p => p.Id == dto.ReceiverProfileId && p.Status == ProfileStatus.Approved && !p.IsHidden, ct)
            ?? throw AppException.NotFound("This member is no longer available.");
        if (await _context.IsBlockedEitherWayAsync(senderProfileId, receiver.Id, ct))
            throw AppException.NotFound("This member is no longer available.");

        var existing = await _context.MatchRequests
            .FirstOrDefaultAsync(r => r.SenderProfileId == senderProfileId && r.ReceiverProfileId == receiver.Id, ct);
        switch (existing?.Status)
        {
            case MatchRequestStatus.Pending:
                throw AppException.Conflict("You have already sent an interest to this member.");
            case MatchRequestStatus.Accepted:
                throw AppException.Conflict("You are already matched with this member.");
            case MatchRequestStatus.Declined:
                throw AppException.Conflict("This member has declined your interest.");
        }

        var reverse = await _context.MatchRequests
            .FirstOrDefaultAsync(r => r.SenderProfileId == receiver.Id && r.ReceiverProfileId == senderProfileId, ct);
        if (reverse?.Status == MatchRequestStatus.Accepted)
            throw AppException.Conflict("You are already matched with this member.");
        if (reverse?.Status == MatchRequestStatus.Pending)
            throw AppException.Conflict("This member has already sent you an interest. Answer it from your requests.");

        await _usage.ConsumeAsync(sender.UserId, UsageFeature.Interest, ct); // 402 when this month's interests are used

        var request = existing ?? new MatchRequest { SenderProfileId = senderProfileId, ReceiverProfileId = receiver.Id };
        request.Status = MatchRequestStatus.Pending;
        request.Note = note;
        request.RespondedAt = null;
        if (existing == null) _context.MatchRequests.Add(request);
        else
        {
            // a withdrawn interest sent again starts over
            request.CreatedAt = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;
        }

        await _notifications.NotifyAsync(receiver.UserId, "interest.received", "New interest",
            $"{sender.FullName} sent you an interest.", "/friends", sms: false, ct);
        await _context.SaveChangesAsync(ct);

        return ToLegacyDto(request, sender, receiver);
    }

    public async Task WithdrawAsync(Guid requestId, Guid senderProfileId, CancellationToken ct = default)
    {
        var request = await _context.MatchRequests.FirstOrDefaultAsync(r => r.Id == requestId && r.SenderProfileId == senderProfileId, ct)
            ?? throw AppException.NotFound("Interest not found.");
        if (request.Status != MatchRequestStatus.Pending)
            throw AppException.Conflict("Only an interest that is still waiting for an answer can be withdrawn.");

        request.Status = MatchRequestStatus.Withdrawn;
        request.RespondedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    public async Task<bool> RespondRequestAsync(Guid requestId, Guid receiverProfileId, bool accept, CancellationToken ct = default)
    {
        var request = await _context.MatchRequests
            .Include(r => r.SenderProfile)
            .Include(r => r.ReceiverProfile)
            .FirstOrDefaultAsync(r => r.Id == requestId && r.ReceiverProfileId == receiverProfileId, ct)
            ?? throw AppException.NotFound("Request not found.");

        if (request.Status == MatchRequestStatus.Withdrawn)
            throw AppException.Conflict("This member withdrew the interest.");
        if (request.Status != MatchRequestStatus.Pending)
            throw AppException.Conflict("You have already answered this request.");

        request.Status = accept ? MatchRequestStatus.Accepted : MatchRequestStatus.Declined;
        request.RespondedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        // a decline is not announced — the sender sees it in their sent list
        if (accept && request.SenderProfile != null)
        {
            await _notifications.NotifyAsync(request.SenderProfile.UserId, "interest.accepted", "Interest accepted",
                $"{request.ReceiverProfile?.FullName ?? "A member"} accepted your interest. You can chat now.", "/messages", sms: false, ct);
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<InterestDto>> ListAsync(Guid profileId, string box, CancellationToken ct = default)
    {
        box = (box ?? string.Empty).Trim().ToLowerInvariant();
        IQueryable<MatchRequest> query = _context.MatchRequests.AsNoTracking()
            .Include(r => r.SenderProfile)
            .Include(r => r.ReceiverProfile);

        query = box switch
        {
            "received" => query.Where(r => r.ReceiverProfileId == profileId && r.Status == MatchRequestStatus.Pending),
            "sent" => query.Where(r => r.SenderProfileId == profileId && r.Status != MatchRequestStatus.Withdrawn),
            "matched" => query.Where(r => (r.SenderProfileId == profileId || r.ReceiverProfileId == profileId) && r.Status == MatchRequestStatus.Accepted),
            _ => throw AppException.Validation("Choose received, sent or matched.", "box")
        };

        var rows = await query.OrderByDescending(r => r.RespondedAt ?? r.CreatedAt).ToListAsync(ct);
        var hidden = await _context.HiddenProfileIdsAsync(profileId, ct);

        return rows
            .Select(r => new { Request = r, Sent = r.SenderProfileId == profileId, Other = r.SenderProfileId == profileId ? r.ReceiverProfile : r.SenderProfile })
            .Where(x => x.Other != null && x.Other.Status == ProfileStatus.Approved && !x.Other.IsHidden && !hidden.Contains(x.Other.Id)) // suspended / blocked drop out
            .Select(x => new InterestDto
            {
                Id = x.Request.Id,
                Direction = x.Sent ? "sent" : "received",
                Status = x.Request.Status.ToString(),
                Note = x.Request.Note,
                CreatedAt = x.Request.CreatedAt,
                RespondedAt = x.Request.RespondedAt,
                Profile = ProfileService.MapToDto(x.Other!, includeMemberDetails: true)
            })
            .ToList();
    }

    public async Task<List<MatchRequestDto>> GetMyRequestsAsync(Guid profileId, CancellationToken ct = default)
    {
        var list = await _context.MatchRequests.AsNoTracking()
            .Include(r => r.SenderProfile)
            .Include(r => r.ReceiverProfile)
            .Where(r => (r.ReceiverProfileId == profileId || r.SenderProfileId == profileId) && r.Status != MatchRequestStatus.Withdrawn)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

        return list.Select(r => ToLegacyDto(r, r.SenderProfile, r.ReceiverProfile)).ToList();
    }

    private static MatchRequestDto ToLegacyDto(MatchRequest r, CandidateProfile? sender, CandidateProfile? receiver) => new()
    {
        Id = r.Id,
        SenderProfileId = r.SenderProfileId,
        SenderName = sender?.FullName ?? "Unknown",
        SenderProfession = sender?.Profession ?? "",
        SenderPhotoUrl = sender?.PhotoUrl ?? "",
        ReceiverProfileId = r.ReceiverProfileId,
        ReceiverName = receiver?.FullName ?? "Unknown",
        Status = r.Status.ToString(),
        Note = r.Note,
        CreatedAt = r.CreatedAt
    };
}
