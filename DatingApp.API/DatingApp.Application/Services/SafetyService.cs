using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>Block checks shared by search, profiles, interests and chat (S03-T07).</summary>
public static class BlockRules
{
    /// <summary>Profiles hidden from this member: the ones they blocked and the ones who blocked them.</summary>
    public static async Task<List<Guid>> HiddenProfileIdsAsync(this IApplicationDbContext db, Guid myProfileId, CancellationToken ct = default)
    {
        var iBlocked = await db.Blocks.Where(b => b.BlockerProfileId == myProfileId).Select(b => b.BlockedProfileId).ToListAsync(ct);
        var blockedMe = await db.Blocks.Where(b => b.BlockedProfileId == myProfileId).Select(b => b.BlockerProfileId).ToListAsync(ct);
        return iBlocked.Concat(blockedMe).Distinct().ToList();
    }

    public static Task<bool> IsBlockedEitherWayAsync(this IApplicationDbContext db, Guid profileA, Guid profileB, CancellationToken ct = default) =>
        db.Blocks.AnyAsync(b => (b.BlockerProfileId == profileA && b.BlockedProfileId == profileB) ||
                                (b.BlockerProfileId == profileB && b.BlockedProfileId == profileA), ct);

    public static Task<Guid?> ProfileIdOfAsync(this IApplicationDbContext db, Guid userId, CancellationToken ct = default) =>
        db.CandidateProfiles.Where(p => p.UserId == userId).Select(p => (Guid?)p.Id).FirstOrDefaultAsync(ct);
}

/// <summary>Block / unblock and reports (S03-T07).</summary>
public interface ISafetyService
{
    Task BlockAsync(Guid userId, Guid profileId, string? reason, CancellationToken ct = default);
    Task UnblockAsync(Guid userId, Guid profileId, CancellationToken ct = default);
    Task<List<BlockedMemberDto>> ListBlockedAsync(Guid userId, CancellationToken ct = default);
    Task<ReportDto> ReportAsync(Guid userId, CreateReportDto dto, CancellationToken ct = default);
}

public class SafetyService : ISafetyService
{
    private readonly IApplicationDbContext _context;

    public SafetyService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task BlockAsync(Guid userId, Guid profileId, string? reason, CancellationToken ct = default)
    {
        var me = await RequireMyProfileIdAsync(userId, ct);
        if (me == profileId) throw AppException.Validation("You cannot block yourself.", "profileId");
        if (!await _context.CandidateProfiles.AnyAsync(p => p.Id == profileId, ct))
            throw AppException.NotFound("Member not found.");

        reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        if (reason?.Length > 100) reason = reason[..100];

        var existing = await _context.Blocks.FirstOrDefaultAsync(b => b.BlockerProfileId == me && b.BlockedProfileId == profileId, ct);
        if (existing != null)
        {
            existing.Reason = reason ?? existing.Reason;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
            return;
        }

        _context.Blocks.Add(new Block { BlockerProfileId = me, BlockedProfileId = profileId, Reason = reason });

        // waiting interests between the two end; an accepted match stays so unblocking restores the chat
        var now = DateTime.UtcNow;
        var pending = await _context.MatchRequests.Where(r => r.Status == MatchRequestStatus.Pending &&
            ((r.SenderProfileId == me && r.ReceiverProfileId == profileId) || (r.SenderProfileId == profileId && r.ReceiverProfileId == me)))
            .ToListAsync(ct);
        foreach (var r in pending)
        {
            r.Status = r.SenderProfileId == me ? MatchRequestStatus.Withdrawn : MatchRequestStatus.Declined;
            r.RespondedAt = now;
            r.UpdatedAt = now;
        }

        // each side drops off the other's shortlist
        var otherUserId = await _context.CandidateProfiles.Where(p => p.Id == profileId).Select(p => p.UserId).FirstAsync(ct);
        var shortlisted = await _context.Shortlists.Where(s =>
            (s.UserId == userId && s.ProfileId == profileId) || (s.UserId == otherUserId && s.ProfileId == me)).ToListAsync(ct);
        _context.Shortlists.RemoveRange(shortlisted);

        await _context.SaveChangesAsync(ct);
    }

    public async Task UnblockAsync(Guid userId, Guid profileId, CancellationToken ct = default)
    {
        var me = await RequireMyProfileIdAsync(userId, ct);
        var block = await _context.Blocks.FirstOrDefaultAsync(b => b.BlockerProfileId == me && b.BlockedProfileId == profileId, ct);
        if (block == null) return; // already unblocked
        _context.Blocks.Remove(block);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<List<BlockedMemberDto>> ListBlockedAsync(Guid userId, CancellationToken ct = default)
    {
        var me = await _context.ProfileIdOfAsync(userId, ct);
        if (!me.HasValue) return new List<BlockedMemberDto>();

        var blocks = await _context.Blocks.AsNoTracking().Where(b => b.BlockerProfileId == me.Value)
            .OrderByDescending(b => b.CreatedAt).ToListAsync(ct);
        var ids = blocks.Select(b => b.BlockedProfileId).ToList();
        var profiles = await _context.CandidateProfiles.AsNoTracking().Where(p => ids.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, ct);

        return blocks.Where(b => profiles.ContainsKey(b.BlockedProfileId)).Select(b => new BlockedMemberDto
        {
            ProfileId = b.BlockedProfileId,
            Name = profiles[b.BlockedProfileId].FullName,
            PhotoUrl = profiles[b.BlockedProfileId].Status == ProfileStatus.Approved ? profiles[b.BlockedProfileId].PhotoUrl : string.Empty,
            Reason = b.Reason,
            BlockedAt = b.CreatedAt
        }).ToList();
    }

    public async Task<ReportDto> ReportAsync(Guid userId, CreateReportDto dto, CancellationToken ct = default)
    {
        if (!Enum.TryParse<ReportReason>(dto.Reason, true, out var reason) || !Enum.IsDefined(reason))
            throw AppException.Validation("Reason must be Scam, Inappropriate, FakeProfile or Other.", "reason");

        var details = string.IsNullOrWhiteSpace(dto.Details) ? null : dto.Details.Trim();
        if (details?.Length > 1000) throw AppException.Validation("Details can be up to 1,000 characters.", "details");
        if (reason == ReportReason.Other && details == null)
            throw AppException.Validation("Tell us briefly what happened.", "details");

        var reported = await _context.CandidateProfiles.Where(p => p.Id == dto.ProfileId)
            .Select(p => new { p.Id, p.UserId }).FirstOrDefaultAsync(ct)
            ?? throw AppException.NotFound("Member not found.");
        if (reported.UserId == userId) throw AppException.Validation("You cannot report yourself.", "profileId");

        var open = await _context.Reports.AnyAsync(r =>
            r.ReporterUserId == userId && r.ReportedProfileId == reported.Id && r.Status == ReportStatus.Open, ct);
        if (open) throw AppException.Conflict("You have already reported this member. Our safety team is looking into it.");

        var conversationId = string.IsNullOrWhiteSpace(dto.ConversationId) ? null : dto.ConversationId.Trim();
        if (conversationId?.Length > 100) conversationId = null;

        var report = new Report
        {
            ReporterUserId = userId,
            ReportedProfileId = reported.Id,
            Reason = reason,
            Details = details,
            ConversationId = conversationId
        };
        _context.Reports.Add(report);
        await _context.SaveChangesAsync(ct);

        return new ReportDto
        {
            Id = report.Id,
            ReportedProfileId = report.ReportedProfileId,
            Reason = report.Reason.ToString(),
            Status = report.Status.ToString(),
            CreatedAt = report.CreatedAt
        };
    }

    private async Task<Guid> RequireMyProfileIdAsync(Guid userId, CancellationToken ct) =>
        await _context.ProfileIdOfAsync(userId, ct)
        ?? throw AppException.Forbidden("Create your profile first.", ErrorCodes.ProfileRequired);
}
