using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

public interface IMatchRequestService
{
    Task<MatchRequestDto> SendRequestAsync(Guid senderProfileId, CreateMatchRequestDto dto, CancellationToken ct = default);
    Task<List<MatchRequestDto>> GetMyRequestsAsync(Guid profileId, CancellationToken ct = default);
    Task<bool> RespondRequestAsync(Guid requestId, Guid receiverProfileId, bool accept, CancellationToken ct = default);
}

public class MatchRequestService : IMatchRequestService
{
    private readonly IApplicationDbContext _context;

    public MatchRequestService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MatchRequestDto> SendRequestAsync(Guid senderProfileId, CreateMatchRequestDto dto, CancellationToken ct = default)
    {
        if (senderProfileId == dto.ReceiverProfileId)
        {
            throw AppException.Validation("You cannot send an interest to your own profile.", "receiverProfileId");
        }

        var receiverExists = await _context.CandidateProfiles.AnyAsync(p => p.Id == dto.ReceiverProfileId, ct);
        if (!receiverExists)
        {
            throw AppException.NotFound("This member is no longer available.");
        }

        if (dto.Note?.Length > 500)
        {
            throw AppException.Validation("Notes can be up to 500 characters.", "note");
        }

        var existing = await _context.MatchRequests
            .FirstOrDefaultAsync(r => r.SenderProfileId == senderProfileId && r.ReceiverProfileId == dto.ReceiverProfileId, ct);

        if (existing != null)
        {
            throw AppException.Conflict("You have already sent an interest to this member.");
        }

        var reverse = await _context.MatchRequests
            .FirstOrDefaultAsync(r => r.SenderProfileId == dto.ReceiverProfileId && r.ReceiverProfileId == senderProfileId, ct);

        if (reverse != null)
        {
            throw AppException.Conflict(reverse.Status == MatchRequestStatus.Accepted
                ? "You are already matched with this member."
                : "This member has already sent you an interest. Answer it from your requests.");
        }

        var request = new MatchRequest
        {
            SenderProfileId = senderProfileId,
            ReceiverProfileId = dto.ReceiverProfileId,
            Status = MatchRequestStatus.Pending,
            Note = dto.Note
        };

        _context.MatchRequests.Add(request);
        await _context.SaveChangesAsync(ct);

        var sender = await _context.CandidateProfiles.FindAsync(new object[] { senderProfileId }, ct);
        var receiver = await _context.CandidateProfiles.FindAsync(new object[] { dto.ReceiverProfileId }, ct);

        return new MatchRequestDto
        {
            Id = request.Id,
            SenderProfileId = senderProfileId,
            SenderName = sender?.FullName ?? "Unknown",
            SenderProfession = sender?.Profession ?? "",
            SenderPhotoUrl = sender?.PhotoUrl ?? "",
            ReceiverProfileId = dto.ReceiverProfileId,
            ReceiverName = receiver?.FullName ?? "Unknown",
            Status = request.Status.ToString(),
            Note = request.Note,
            CreatedAt = request.CreatedAt
        };
    }

    public async Task<List<MatchRequestDto>> GetMyRequestsAsync(Guid profileId, CancellationToken ct = default)
    {
        var list = await _context.MatchRequests
            .Include(r => r.SenderProfile)
            .Include(r => r.ReceiverProfile)
            .Where(r => r.ReceiverProfileId == profileId || r.SenderProfileId == profileId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

        return list.Select(r => new MatchRequestDto
        {
            Id = r.Id,
            SenderProfileId = r.SenderProfileId,
            SenderName = r.SenderProfile?.FullName ?? "Unknown",
            SenderProfession = r.SenderProfile?.Profession ?? "",
            SenderPhotoUrl = r.SenderProfile?.PhotoUrl ?? "",
            ReceiverProfileId = r.ReceiverProfileId,
            ReceiverName = r.ReceiverProfile?.FullName ?? "Unknown",
            Status = r.Status.ToString(),
            Note = r.Note,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public async Task<bool> RespondRequestAsync(Guid requestId, Guid receiverProfileId, bool accept, CancellationToken ct = default)
    {
        var request = await _context.MatchRequests.FirstOrDefaultAsync(r => r.Id == requestId && r.ReceiverProfileId == receiverProfileId, ct);
        if (request == null)
        {
            throw AppException.NotFound("Request not found.");
        }

        if (request.Status != MatchRequestStatus.Pending)
        {
            throw AppException.Conflict("You have already answered this request.");
        }

        request.Status = accept ? MatchRequestStatus.Accepted : MatchRequestStatus.Declined;
        request.RespondedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return true;
    }
}
