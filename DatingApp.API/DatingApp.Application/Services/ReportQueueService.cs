using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>Staff side of reports (S03-T08): the queue, and dismiss / action / suspend with an audit trail.</summary>
public interface IReportQueueService
{
    /// <summary>status = open (default, oldest first) · closed (newest decisions first) · all.</summary>
    Task<List<ReportQueueItemDto>> ListAsync(string? status, CancellationToken ct = default);
    Task<ReportQueueItemDto> ResolveAsync(Guid staffUserId, Guid reportId, ResolveReportDto dto, CancellationToken ct = default);
}

public class ReportQueueService : IReportQueueService
{
    private const int MaxItems = 200;
    private readonly IApplicationDbContext _context;
    private readonly IModerationService _moderation;
    private readonly INotificationService _notifications;

    public ReportQueueService(IApplicationDbContext context, IModerationService moderation, INotificationService notifications)
    {
        _context = context;
        _moderation = moderation;
        _notifications = notifications;
    }

    public async Task<List<ReportQueueItemDto>> ListAsync(string? status, CancellationToken ct = default)
    {
        var box = (status ?? "open").Trim().ToLowerInvariant();
        IQueryable<Report> query = _context.Reports.AsNoTracking();
        query = box switch
        {
            "open" => query.Where(r => r.Status == ReportStatus.Open).OrderBy(r => r.CreatedAt),
            "closed" => query.Where(r => r.Status != ReportStatus.Open).OrderByDescending(r => r.ReviewedAt),
            "all" => query.OrderByDescending(r => r.CreatedAt),
            _ => throw AppException.Validation("Status must be open, closed or all.", "status")
        };
        var reports = await query.Take(MaxItems).ToListAsync(ct);
        return await MapAsync(reports, ct);
    }

    public async Task<ReportQueueItemDto> ResolveAsync(Guid staffUserId, Guid reportId, ResolveReportDto dto, CancellationToken ct = default)
    {
        var action = (dto.Action ?? string.Empty).Trim().ToLowerInvariant();
        if (action is not ("dismiss" or "action" or "suspend"))
            throw AppException.Validation("Action must be dismiss, action or suspend.", "action");
        var note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim();
        if (note?.Length > 1000) throw AppException.Validation("Notes can be up to 1,000 characters.", "note");
        if (action == "suspend" && note == null) throw AppException.Validation("Give a reason for the suspension.", "note");

        var report = await _context.Reports.FirstOrDefaultAsync(r => r.Id == reportId, ct)
            ?? throw AppException.NotFound("Report not found.");
        if (report.Status != ReportStatus.Open) throw AppException.Conflict("This report has already been handled.");

        var now = DateTime.UtcNow;
        // suspending closes every open report about the member; dismiss / action close this one
        var closing = action == "suspend"
            ? await _context.Reports.Where(r => r.ReportedProfileId == report.ReportedProfileId && r.Status == ReportStatus.Open).ToListAsync(ct)
            : new List<Report> { report };

        foreach (var r in closing)
        {
            r.Status = action == "dismiss" ? ReportStatus.Dismissed : ReportStatus.Actioned;
            r.ReviewedByUserId = staffUserId;
            r.ReviewedAt = now;
            r.StaffNote = note;
            r.UpdatedAt = now;
            // reporters hear that it was looked at — never what was decided about the other member
            await _notifications.NotifyAsync(r.ReporterUserId, "report.reviewed", "We reviewed your report",
                "Thank you — our safety team has reviewed the member you reported.", null, sms: false, ct);
        }

        var logNote = $"{report.Reason} report{(closing.Count > 1 ? $" (+{closing.Count - 1} more)" : "")}{(note != null ? ": " + note : "")}";
        _context.ProfileReviewLogs.Add(new ProfileReviewLog
        {
            ProfileId = report.ReportedProfileId,
            ModeratorUserId = staffUserId,
            Action = action == "dismiss" ? ReviewAction.ReportDismissed : ReviewAction.ReportActioned,
            Note = logNote.Length > 500 ? logNote[..500] : logNote
        });

        if (action == "suspend")
            await _moderation.SuspendAsync(report.ReportedProfileId, staffUserId, note, ct); // logs + tells the member + saves
        await _context.SaveChangesAsync(ct);

        return (await MapAsync(new List<Report> { report }, ct)).Single();
    }

    private async Task<List<ReportQueueItemDto>> MapAsync(List<Report> reports, CancellationToken ct)
    {
        if (reports.Count == 0) return new List<ReportQueueItemDto>();
        var profileIds = reports.Select(r => r.ReportedProfileId).Distinct().ToList();
        var userIds = reports.Select(r => r.ReporterUserId).Concat(reports.Where(r => r.ReviewedByUserId.HasValue).Select(r => r.ReviewedByUserId!.Value)).Distinct().ToList();

        var profiles = await _context.CandidateProfiles.AsNoTracking().Where(p => profileIds.Contains(p.Id))
            .Select(p => new { p.Id, p.FullName, p.Code, p.PhotoUrl, p.Status }).ToDictionaryAsync(p => p.Id, ct);
        var users = await _context.Users.AsNoTracking().Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName, ProfileId = u.Profile != null ? (Guid?)u.Profile.Id : null }).ToDictionaryAsync(u => u.Id, ct);
        var counts = await _context.Reports.AsNoTracking().Where(r => profileIds.Contains(r.ReportedProfileId))
            .GroupBy(r => r.ReportedProfileId)
            .Select(g => new { ProfileId = g.Key, Open = g.Count(r => r.Status == ReportStatus.Open), Total = g.Count() })
            .ToDictionaryAsync(g => g.ProfileId, ct);

        return reports.Select(r =>
        {
            profiles.TryGetValue(r.ReportedProfileId, out var p);
            users.TryGetValue(r.ReporterUserId, out var reporter);
            var reviewer = r.ReviewedByUserId.HasValue && users.TryGetValue(r.ReviewedByUserId.Value, out var rv) ? rv.FullName : null;
            counts.TryGetValue(r.ReportedProfileId, out var c);
            return new ReportQueueItemDto
            {
                Id = r.Id,
                Reason = r.Reason.ToString(),
                Details = r.Details,
                ConversationId = r.ConversationId,
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt,
                ReviewedAt = r.ReviewedAt,
                ReviewedByName = reviewer,
                StaffNote = r.StaffNote,
                ReporterName = reporter?.FullName ?? "Member",
                ReporterProfileId = reporter?.ProfileId,
                ReportedProfileId = r.ReportedProfileId,
                ReportedName = p?.FullName ?? "Member",
                ReportedCode = p?.Code ?? string.Empty,
                ReportedPhotoUrl = p?.PhotoUrl ?? string.Empty,
                ReportedStatus = p?.Status.ToString() ?? string.Empty,
                OpenReportsOnProfile = c?.Open ?? 0,
                TotalReportsOnProfile = c?.Total ?? 0
            };
        }).ToList();
    }
}
