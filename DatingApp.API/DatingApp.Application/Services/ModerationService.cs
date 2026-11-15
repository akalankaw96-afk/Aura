using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>Moderator queue and decisions (S02-T06). Callers must have the Staff policy; every decision is logged.</summary>
public interface IModerationService
{
    Task<List<ReviewQueueItemDto>> GetQueueAsync(CancellationToken ct = default);
    Task<ProfileReviewDto> GetProfileAsync(Guid profileId, CancellationToken ct = default);
    Task ApproveAsync(Guid profileId, Guid moderatorId, string? note, CancellationToken ct = default);
    Task RequestChangesAsync(Guid profileId, Guid moderatorId, RequestChangesDto dto, CancellationToken ct = default);
    Task SuspendAsync(Guid profileId, Guid moderatorId, string? note, CancellationToken ct = default);
    Task ReinstateAsync(Guid profileId, Guid moderatorId, string? note, CancellationToken ct = default);
    Task<List<PendingPhotoDto>> GetPendingPhotosAsync(CancellationToken ct = default);
    Task ApprovePhotoAsync(Guid photoId, Guid moderatorId, CancellationToken ct = default);
    Task RejectPhotoAsync(Guid photoId, Guid moderatorId, string reason, CancellationToken ct = default);
}

public class ModerationService : IModerationService
{
    /// <summary>Field keys a moderator can flag — the web app knows how to open each one.</summary>
    public static readonly string[] FlaggableFields =
    {
        "photo", "name", "dob", "gender", "about", "profession", "education", "religion", "location", "documents", "selfie", "other"
    };

    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notifications;
    private readonly IProfileService _profiles;

    public ModerationService(IApplicationDbContext context, INotificationService notifications, IProfileService profiles)
    {
        _context = context;
        _notifications = notifications;
        _profiles = profiles;
    }

    public async Task<List<ReviewQueueItemDto>> GetQueueAsync(CancellationToken ct = default)
    {
        var profiles = await _context.CandidateProfiles.AsNoTracking()
            .Where(p => p.Status == ProfileStatus.Submitted || p.Status == ProfileStatus.Resubmitted)
            .OrderBy(p => p.SubmittedAt)
            .Select(p => new
            {
                p.Id, p.Code, p.FullName, p.Gender, p.Age, p.DateOfBirth, p.Status, p.SubmittedAt, p.PhotoUrl,
                Main = p.Photos.Where(ph => ph.IsMain && ph.Status != ReviewItemStatus.Rejected).Select(ph => (Guid?)ph.Id).FirstOrDefault(),
                Pending = p.Photos.Count(ph => ph.Status == ReviewItemStatus.Pending)
            })
            .ToListAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return profiles.Select(p => new ReviewQueueItemDto
        {
            ProfileId = p.Id,
            Code = p.Code,
            FullName = p.FullName,
            Gender = p.Gender.ToString().ToLowerInvariant(),
            Age = p.DateOfBirth.HasValue ? ProfileService.AgeOn(p.DateOfBirth.Value, today) : p.Age,
            Status = p.Status.ToString(),
            SubmittedAt = p.SubmittedAt,
            MainPhotoRef = p.Main.HasValue ? $"photo:{p.Main}" : (p.PhotoUrl.Length > 0 ? p.PhotoUrl : null),
            PendingPhotos = p.Pending
        }).ToList();
    }

    public async Task<ProfileReviewDto> GetProfileAsync(Guid profileId, CancellationToken ct = default)
    {
        var p = await _context.CandidateProfiles.AsNoTracking().Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == profileId, ct) ?? throw AppException.NotFound("Profile not found.");

        var photos = await _context.ProfilePhotos.AsNoTracking().Where(x => x.ProfileId == profileId)
            .OrderBy(x => x.SortOrder).ToListAsync(ct);
        var docs = await _context.KycDocuments.AsNoTracking().Where(x => x.ProfileId == profileId)
            .OrderBy(x => x.Type).ToListAsync(ct);
        var flags = await _context.ProfileReviewFlags.AsNoTracking()
            .Where(x => x.ProfileId == profileId && x.ResolvedAt == null)
            .Select(f => new ReviewFlagDto { Field = f.Field, Reason = f.Reason, CreatedAt = f.CreatedAt }).ToListAsync(ct);
        var history = await (from l in _context.ProfileReviewLogs.AsNoTracking()
                             join u in _context.Users.AsNoTracking() on l.ModeratorUserId equals u.Id into mods
                             from m in mods.DefaultIfEmpty()
                             where l.ProfileId == profileId
                             orderby l.CreatedAt descending
                             select new ReviewLogDto
                             {
                                 Action = l.Action.ToString(),
                                 ModeratorName = m != null ? m.FullName : "Staff",
                                 Note = l.Note,
                                 CreatedAt = l.CreatedAt
                             }).Take(50).ToListAsync(ct);

        var profileDto = await _profiles.GetProfileByUserIdAsync(p.UserId, ct) ?? new ProfileDto();
        return new ProfileReviewDto
        {
            Profile = profileDto,
            Status = p.Status.ToString(),
            SubmittedAt = p.SubmittedAt,
            PhoneNumber = p.User?.PhoneNumber ?? string.Empty,
            Email = p.User?.Email,
            DateOfBirth = p.DateOfBirth?.ToString("yyyy-MM-dd"),
            Photos = photos.Select(MediaService.ToDto).ToList(),
            Documents = docs.Select(MediaService.ToDto).ToList(),
            OpenFlags = flags,
            History = history
        };
    }

    public async Task ApproveAsync(Guid profileId, Guid moderatorId, string? note, CancellationToken ct = default)
    {
        var profile = await LoadForDecisionAsync(profileId, ct);
        if (profile.Status is not (ProfileStatus.Submitted or ProfileStatus.Resubmitted))
            throw AppException.Conflict("Only profiles waiting for review can be approved.");

        var now = DateTime.UtcNow;
        var photos = await _context.ProfilePhotos.Where(p => p.ProfileId == profileId).ToListAsync(ct);
        foreach (var photo in photos.Where(p => p.Status == ReviewItemStatus.Pending))
        {
            photo.Status = ReviewItemStatus.Approved;
            photo.ReviewedAt = now;
            photo.ReviewedByUserId = moderatorId;
        }
        var docs = await _context.KycDocuments.Where(d => d.ProfileId == profileId && d.Status == ReviewItemStatus.Pending).ToListAsync(ct);
        foreach (var d in docs) d.Status = ReviewItemStatus.Approved;

        profile.Status = ProfileStatus.Approved;
        profile.ReviewedAt = now;
        profile.ReviewedByUserId = moderatorId;
        MediaService.SyncPublicPhoto(profile, photos);

        Log(profileId, moderatorId, ReviewAction.Approved, note);
        await _notifications.NotifyAsync(profile.UserId, "kyc.approved", "Your profile is approved",
            "Your profile is approved. You can now view profiles, send interests and chat.", "/dashboard", sms: true, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task RequestChangesAsync(Guid profileId, Guid moderatorId, RequestChangesDto dto, CancellationToken ct = default)
    {
        var profile = await LoadForDecisionAsync(profileId, ct);
        if (profile.Status is not (ProfileStatus.Submitted or ProfileStatus.Resubmitted))
            throw AppException.Conflict("Only profiles waiting for review can be sent back.");

        var flags = (dto.Flags ?? new List<ReviewFlagInputDto>())
            .Select(f => new { Field = (f.Field ?? string.Empty).Trim().ToLowerInvariant(), Reason = (f.Reason ?? string.Empty).Trim() })
            .Where(f => f.Field.Length > 0)
            .ToList();
        if (flags.Count == 0) throw AppException.Validation("Pick at least one field to change.", "flags");
        if (flags.Any(f => !FlaggableFields.Contains(f.Field)))
            throw AppException.Validation($"Fields can be: {string.Join(", ", FlaggableFields)}.", "flags");
        if (flags.Any(f => f.Reason.Length == 0 || f.Reason.Length > 300))
            throw AppException.Validation("Give a reason (up to 300 characters) for every field.", "flags");

        var now = DateTime.UtcNow;
        var old = await _context.ProfileReviewFlags.Where(f => f.ProfileId == profileId && f.ResolvedAt == null).ToListAsync(ct);
        foreach (var o in old) o.ResolvedAt = now;
        foreach (var f in flags.DistinctBy(f => f.Field))
        {
            _context.ProfileReviewFlags.Add(new ProfileReviewFlag
            {
                ProfileId = profileId,
                Field = f.Field,
                Reason = f.Reason,
                CreatedByUserId = moderatorId
            });
        }

        profile.Status = ProfileStatus.ChangesRequested;
        profile.ReviewedAt = now;
        profile.ReviewedByUserId = moderatorId;

        Log(profileId, moderatorId, ReviewAction.ChangesRequested, dto.Note ?? string.Join("; ", flags.Select(f => $"{f.Field}: {f.Reason}")));
        await _notifications.NotifyAsync(profile.UserId, "kyc.changes", "A few changes needed",
            $"Please update {flags.Count} field{(flags.Count == 1 ? "" : "s")} on your profile and submit again.", "/dashboard", sms: true, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task SuspendAsync(Guid profileId, Guid moderatorId, string? note, CancellationToken ct = default)
    {
        var profile = await LoadForDecisionAsync(profileId, ct);
        if (profile.Status == ProfileStatus.Suspended) return;
        if (string.IsNullOrWhiteSpace(note)) throw AppException.Validation("Give a reason for the suspension.", "note");

        profile.Status = ProfileStatus.Suspended;
        profile.ReviewedAt = DateTime.UtcNow;
        profile.ReviewedByUserId = moderatorId;
        Log(profileId, moderatorId, ReviewAction.Suspended, note);
        await _notifications.NotifyAsync(profile.UserId, "kyc.suspended", "Your profile is suspended",
            "Your profile has been suspended. Please contact support.", "/support", sms: true, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task ReinstateAsync(Guid profileId, Guid moderatorId, string? note, CancellationToken ct = default)
    {
        var profile = await LoadForDecisionAsync(profileId, ct);
        if (profile.Status != ProfileStatus.Suspended) throw AppException.Conflict("Only suspended profiles can be reinstated.");

        profile.Status = ProfileStatus.Approved;
        profile.ReviewedAt = DateTime.UtcNow;
        profile.ReviewedByUserId = moderatorId;
        Log(profileId, moderatorId, ReviewAction.Reinstated, note);
        await _notifications.NotifyAsync(profile.UserId, "kyc.reinstated", "Your profile is active again",
            "Your profile is active again.", "/dashboard", sms: true, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<List<PendingPhotoDto>> GetPendingPhotosAsync(CancellationToken ct = default)
    {
        // photos added after approval — profiles still in the queue are reviewed as a whole
        var rows = await _context.ProfilePhotos.AsNoTracking()
            .Where(ph => ph.Status == ReviewItemStatus.Pending && ph.Profile!.Status == ProfileStatus.Approved)
            .OrderBy(ph => ph.CreatedAt)
            .Select(ph => new { ph.Id, ph.ProfileId, ph.Profile!.Code, ph.Profile.FullName, ph.CreatedAt })
            .Take(200)
            .ToListAsync(ct);
        return rows.Select(r => new PendingPhotoDto
        {
            PhotoId = r.Id,
            Ref = $"photo:{r.Id}",
            ProfileId = r.ProfileId,
            ProfileCode = r.Code,
            FullName = r.FullName,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public async Task ApprovePhotoAsync(Guid photoId, Guid moderatorId, CancellationToken ct = default)
    {
        var photo = await _context.ProfilePhotos.Include(p => p.Profile).FirstOrDefaultAsync(p => p.Id == photoId, ct)
            ?? throw AppException.NotFound("Photo not found.");
        photo.Status = ReviewItemStatus.Approved;
        photo.RejectReason = null;
        photo.ReviewedAt = DateTime.UtcNow;
        photo.ReviewedByUserId = moderatorId;

        var all = await _context.ProfilePhotos.Where(p => p.ProfileId == photo.ProfileId).ToListAsync(ct);
        if (photo.Profile != null) MediaService.SyncPublicPhoto(photo.Profile, all);
        Log(photo.ProfileId, moderatorId, ReviewAction.PhotoApproved, null);
        await _context.SaveChangesAsync(ct);
    }

    public async Task RejectPhotoAsync(Guid photoId, Guid moderatorId, string reason, CancellationToken ct = default)
    {
        reason = (reason ?? string.Empty).Trim();
        if (reason.Length == 0 || reason.Length > 300) throw AppException.Validation("Give a reason (up to 300 characters).", "reason");

        var photo = await _context.ProfilePhotos.Include(p => p.Profile).FirstOrDefaultAsync(p => p.Id == photoId, ct)
            ?? throw AppException.NotFound("Photo not found.");
        photo.Status = ReviewItemStatus.Rejected;
        photo.RejectReason = reason;
        photo.ReviewedAt = DateTime.UtcNow;
        photo.ReviewedByUserId = moderatorId;

        var all = await _context.ProfilePhotos.Where(p => p.ProfileId == photo.ProfileId).ToListAsync(ct);
        if (photo.IsMain)
        {
            photo.IsMain = false;
            var next = all.Where(p => p.Id != photo.Id && p.Status == ReviewItemStatus.Approved).OrderBy(p => p.SortOrder).FirstOrDefault();
            if (next != null) next.IsMain = true;
        }
        if (photo.Profile != null)
        {
            MediaService.SyncPublicPhoto(photo.Profile, all);
            await _notifications.NotifyAsync(photo.Profile.UserId, "photo.rejected", "A photo wasn't approved",
                $"One of your photos wasn't approved: {reason}", "/dashboard", sms: false, ct);
        }
        Log(photo.ProfileId, moderatorId, ReviewAction.PhotoRejected, reason);
        await _context.SaveChangesAsync(ct);
    }

    private async Task<CandidateProfile> LoadForDecisionAsync(Guid profileId, CancellationToken ct) =>
        await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.Id == profileId, ct)
        ?? throw AppException.NotFound("Profile not found.");

    private void Log(Guid profileId, Guid moderatorId, ReviewAction action, string? note) =>
        _context.ProfileReviewLogs.Add(new ProfileReviewLog
        {
            ProfileId = profileId,
            ModeratorUserId = moderatorId,
            Action = action,
            Note = note is { Length: > 500 } ? note[..500] : note
        });
}
