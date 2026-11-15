using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>The member's side of the review (S02-T02 / T07): see the status, submit, resubmit after changes.</summary>
public interface IReviewService
{
    Task<ProfileStatusDto> GetStatusAsync(Guid userId, CancellationToken ct = default);
    Task<ProfileStatusDto> SubmitAsync(Guid userId, CancellationToken ct = default);
}

public class ReviewService : IReviewService
{
    private readonly IApplicationDbContext _context;

    public ReviewService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProfileStatusDto> GetStatusAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile == null)
        {
            return new ProfileStatusDto { Status = "None", Missing = new() { "profile" } };
        }
        return await BuildStatusAsync(profile, ct);
    }

    public async Task<ProfileStatusDto> SubmitAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw AppException.Forbidden("Save your profile details first.", ErrorCodes.ProfileRequired);

        var status = await BuildStatusAsync(profile, ct);
        switch (profile.Status)
        {
            case ProfileStatus.Submitted:
            case ProfileStatus.Resubmitted:
                return status; // already waiting — submitting twice is harmless
            case ProfileStatus.Approved:
                throw AppException.Conflict("Your profile is already approved.");
            case ProfileStatus.Suspended:
                throw AppException.Forbidden("This profile is suspended. Please contact support.");
        }

        if (!status.CanSubmit)
        {
            throw new AppException(400, ErrorCodes.ValidationFailed, "A few things are still missing before you can submit.",
                new Dictionary<string, object?> { ["missing"] = status.Missing });
        }

        var now = DateTime.UtcNow;
        if (profile.Status == ProfileStatus.ChangesRequested)
        {
            // the member has gone through the flagged fields; the moderator checks them again
            var open = await _context.ProfileReviewFlags.Where(f => f.ProfileId == profile.Id && f.ResolvedAt == null).ToListAsync(ct);
            foreach (var f in open) f.ResolvedAt = now;
            profile.Status = ProfileStatus.Resubmitted;
        }
        else
        {
            profile.Status = ProfileStatus.Submitted;
        }
        profile.SubmittedAt = now;
        profile.UpdatedAt = now;
        await _context.SaveChangesAsync(ct);

        return await BuildStatusAsync(profile, ct);
    }

    private async Task<ProfileStatusDto> BuildStatusAsync(CandidateProfile profile, CancellationToken ct)
    {
        var photos = await _context.ProfilePhotos.AsNoTracking()
            .Where(p => p.ProfileId == profile.Id && p.Status != ReviewItemStatus.Rejected)
            .Select(p => new { p.IsMain }).ToListAsync(ct);
        var docTypes = await _context.KycDocuments.AsNoTracking()
            .Where(d => d.ProfileId == profile.Id && d.Status != ReviewItemStatus.Rejected)
            .Select(d => d.Type).ToListAsync(ct);
        var flags = await _context.ProfileReviewFlags.AsNoTracking()
            .Where(f => f.ProfileId == profile.Id && f.ResolvedAt == null)
            .OrderBy(f => f.CreatedAt)
            .Select(f => new ReviewFlagDto { Field = f.Field, Reason = f.Reason, CreatedAt = f.CreatedAt })
            .ToListAsync(ct);

        var hasMainPhoto = photos.Any(p => p.IsMain);
        var hasAvatar = profile.PhotoUrl.StartsWith("avatar:");
        var hasId = docTypes.Contains(KycDocumentType.Passport) ||
                    (docTypes.Contains(KycDocumentType.NicFront) && docTypes.Contains(KycDocumentType.NicBack));

        var missing = new List<string>();
        if (!profile.DateOfBirth.HasValue) missing.Add("dateOfBirth");
        if (!hasMainPhoto && !hasAvatar) missing.Add("photo");
        if (!hasId) missing.Add("idDocument");
        if (!docTypes.Contains(KycDocumentType.Selfie)) missing.Add("selfie");

        var editable = profile.Status is ProfileStatus.Draft or ProfileStatus.ChangesRequested;
        return new ProfileStatusDto
        {
            Status = profile.Status.ToString(),
            SubmittedAt = profile.SubmittedAt,
            ReviewedAt = profile.ReviewedAt,
            Flags = flags,
            PhotoCount = photos.Count,
            HasMainPhoto = hasMainPhoto,
            DocumentTypes = docTypes.Distinct().Select(t => t.ToString()).ToList(),
            Missing = missing,
            CanSubmit = editable && missing.Count == 0
        };
    }
}
