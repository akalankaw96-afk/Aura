using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Files;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>A file the API may stream to the caller.</summary>
public record FileResultData(Stream Content, string ContentType);

/// <summary>Who is asking for a file: the signed-in user (if any) and whether they are staff.</summary>
public record Viewer(Guid? UserId, bool IsStaff);

/// <summary>Member photos (S02-T04) and identity documents (S02-T05).</summary>
public interface IMediaService
{
    Task<PhotoDto> UploadPhotoAsync(Guid userId, Stream content, long length, CancellationToken ct = default);
    Task<List<PhotoDto>> ListMyPhotosAsync(Guid userId, CancellationToken ct = default);
    Task SetMainPhotoAsync(Guid userId, Guid photoId, CancellationToken ct = default);
    Task ReorderPhotosAsync(Guid userId, List<Guid> photoIds, CancellationToken ct = default);
    Task DeletePhotoAsync(Guid userId, Guid photoId, CancellationToken ct = default);
    /// <summary>Approved photos: anyone with the link. Pending / rejected: the owner and staff only.</summary>
    Task<FileResultData> OpenPhotoAsync(Guid photoId, Viewer viewer, CancellationToken ct = default);

    Task<KycDocumentDto> UploadDocumentAsync(Guid userId, string type, Stream content, long length, CancellationToken ct = default);
    Task<List<KycDocumentDto>> ListMyDocumentsAsync(Guid userId, CancellationToken ct = default);
    /// <summary>Owner or staff only; staff views are written to the review log.</summary>
    Task<FileResultData> OpenDocumentAsync(Guid documentId, Viewer viewer, CancellationToken ct = default);
}

public class MediaService : IMediaService
{
    private readonly IApplicationDbContext _context;
    private readonly IFileStorage _storage;

    public MediaService(IApplicationDbContext context, IFileStorage storage)
    {
        _context = context;
        _storage = storage;
    }

    // ---------------- photos ----------------

    public async Task<PhotoDto> UploadPhotoAsync(Guid userId, Stream content, long length, CancellationToken ct = default)
    {
        var profile = await RequireProfileAsync(userId, ct);
        if (profile.Status == ProfileStatus.Suspended) throw AppException.Forbidden("This profile is suspended.");

        var count = await _context.ProfilePhotos.CountAsync(p => p.ProfileId == profile.Id && p.Status != ReviewItemStatus.Rejected, ct);
        if (count >= FileRules.MaxPhotos)
            throw AppException.Validation($"You can add up to {FileRules.MaxPhotos} photos. Remove one first.", "file");

        var (bytes, type) = await FileRules.ReadAndCheckAsync(content, length, allowPdf: false, ct);
        using var ms = new MemoryStream(bytes);
        var key = await _storage.SaveAsync(ms, "photos", type.Extension, ct);

        var hasMain = await _context.ProfilePhotos.AnyAsync(p => p.ProfileId == profile.Id && p.IsMain && p.Status != ReviewItemStatus.Rejected, ct);
        var maxOrder = await _context.ProfilePhotos.Where(p => p.ProfileId == profile.Id)
            .Select(p => (int?)p.SortOrder).MaxAsync(ct) ?? -1;

        var photo = new ProfilePhoto
        {
            ProfileId = profile.Id,
            StorageKey = key,
            ContentType = type.ContentType,
            SizeBytes = bytes.LongLength,
            SortOrder = maxOrder + 1,
            IsMain = !hasMain,
            Status = ReviewItemStatus.Pending
        };
        _context.ProfilePhotos.Add(photo);
        await _context.SaveChangesAsync(ct);
        return ToDto(photo);
    }

    public async Task<List<PhotoDto>> ListMyPhotosAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await RequireProfileAsync(userId, ct);
        var photos = await _context.ProfilePhotos.AsNoTracking()
            .Where(p => p.ProfileId == profile.Id)
            .OrderBy(p => p.SortOrder).ToListAsync(ct);
        return photos.Select(ToDto).ToList();
    }

    public async Task SetMainPhotoAsync(Guid userId, Guid photoId, CancellationToken ct = default)
    {
        var profile = await RequireProfileAsync(userId, ct, track: true);
        var photos = await _context.ProfilePhotos.Where(p => p.ProfileId == profile.Id).ToListAsync(ct);
        var target = photos.FirstOrDefault(p => p.Id == photoId) ?? throw AppException.NotFound("Photo not found.");
        if (target.Status == ReviewItemStatus.Rejected) throw AppException.Validation("A rejected photo can't be the main photo.", "photoId");

        foreach (var p in photos) p.IsMain = p.Id == photoId;
        SyncPublicPhoto(profile, photos);
        await _context.SaveChangesAsync(ct);
    }

    public async Task ReorderPhotosAsync(Guid userId, List<Guid> photoIds, CancellationToken ct = default)
    {
        var profile = await RequireProfileAsync(userId, ct);
        var photos = await _context.ProfilePhotos.Where(p => p.ProfileId == profile.Id).ToListAsync(ct);
        var order = 0;
        foreach (var id in photoIds.Distinct())
        {
            var photo = photos.FirstOrDefault(p => p.Id == id);
            if (photo != null) photo.SortOrder = order++;
        }
        foreach (var rest in photos.Where(p => !photoIds.Contains(p.Id)).OrderBy(p => p.SortOrder)) rest.SortOrder = order++;
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeletePhotoAsync(Guid userId, Guid photoId, CancellationToken ct = default)
    {
        var profile = await RequireProfileAsync(userId, ct, track: true);
        var photos = await _context.ProfilePhotos.Where(p => p.ProfileId == profile.Id).ToListAsync(ct);
        var target = photos.FirstOrDefault(p => p.Id == photoId) ?? throw AppException.NotFound("Photo not found.");

        _context.ProfilePhotos.Remove(target);
        photos.Remove(target);
        if (target.IsMain)
        {
            var next = photos.Where(p => p.Status != ReviewItemStatus.Rejected).OrderBy(p => p.SortOrder).FirstOrDefault();
            if (next != null) next.IsMain = true;
        }
        SyncPublicPhoto(profile, photos);
        await _context.SaveChangesAsync(ct);
        await _storage.DeleteAsync(target.StorageKey, ct);
    }

    public async Task<FileResultData> OpenPhotoAsync(Guid photoId, Viewer viewer, CancellationToken ct = default)
    {
        var photo = await _context.ProfilePhotos.AsNoTracking().Include(p => p.Profile)
            .FirstOrDefaultAsync(p => p.Id == photoId, ct) ?? throw AppException.NotFound("Photo not found.");

        var isOwner = viewer.UserId.HasValue && photo.Profile?.UserId == viewer.UserId;
        var isPublic = photo.Status == ReviewItemStatus.Approved && photo.Profile?.Status == ProfileStatus.Approved;
        if (!isPublic && !isOwner && !viewer.IsStaff) throw AppException.NotFound("Photo not found.");

        var stream = await _storage.OpenReadAsync(photo.StorageKey, ct) ?? throw AppException.NotFound("Photo not found.");
        return new FileResultData(stream, photo.ContentType);
    }

    // ---------------- identity documents ----------------

    public async Task<KycDocumentDto> UploadDocumentAsync(Guid userId, string type, Stream content, long length, CancellationToken ct = default)
    {
        if (!Enum.TryParse<KycDocumentType>(type, true, out var docType) || !Enum.IsDefined(docType))
            throw AppException.Validation("Choose the document type (NicFront, NicBack, Passport or Selfie).", "type");

        var profile = await RequireProfileAsync(userId, ct);
        if (profile.Status is ProfileStatus.Approved or ProfileStatus.Suspended)
            throw AppException.Forbidden("Your identity is already checked. Contact support to change documents.");
        if (profile.Status == ProfileStatus.Submitted || profile.Status == ProfileStatus.Resubmitted)
            throw AppException.Forbidden("Your profile is being reviewed. You can change documents if we ask for changes.");

        var (bytes, detected) = await FileRules.ReadAndCheckAsync(content, length, allowPdf: docType != KycDocumentType.Selfie, ct);
        using var ms = new MemoryStream(bytes);
        var key = await _storage.SaveAsync(ms, "kyc", detected.Extension, ct);

        // one document per type: a new upload replaces the old one
        var old = await _context.KycDocuments.Where(d => d.ProfileId == profile.Id && d.Type == docType).ToListAsync(ct);
        foreach (var o in old) _context.KycDocuments.Remove(o);

        var doc = new KycDocument
        {
            ProfileId = profile.Id,
            Type = docType,
            StorageKey = key,
            ContentType = detected.ContentType,
            SizeBytes = bytes.LongLength
        };
        _context.KycDocuments.Add(doc);
        await _context.SaveChangesAsync(ct);
        foreach (var o in old) await _storage.DeleteAsync(o.StorageKey, ct);
        return ToDto(doc);
    }

    public async Task<List<KycDocumentDto>> ListMyDocumentsAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await RequireProfileAsync(userId, ct);
        var docs = await _context.KycDocuments.AsNoTracking()
            .Where(d => d.ProfileId == profile.Id).OrderBy(d => d.Type).ToListAsync(ct);
        return docs.Select(ToDto).ToList();
    }

    public async Task<FileResultData> OpenDocumentAsync(Guid documentId, Viewer viewer, CancellationToken ct = default)
    {
        var doc = await _context.KycDocuments.AsNoTracking().Include(d => d.Profile)
            .FirstOrDefaultAsync(d => d.Id == documentId, ct) ?? throw AppException.NotFound("Document not found.");

        var isOwner = viewer.UserId.HasValue && doc.Profile?.UserId == viewer.UserId;
        if (!isOwner && !viewer.IsStaff) throw AppException.NotFound("Document not found.");

        if (viewer.IsStaff && !isOwner && viewer.UserId.HasValue)
        {
            _context.ProfileReviewLogs.Add(new ProfileReviewLog
            {
                ProfileId = doc.ProfileId,
                ModeratorUserId = viewer.UserId.Value,
                Action = ReviewAction.DocumentViewed,
                Note = doc.Type.ToString()
            });
            await _context.SaveChangesAsync(ct);
        }

        var stream = await _storage.OpenReadAsync(doc.StorageKey, ct) ?? throw AppException.NotFound("Document not found.");
        return new FileResultData(stream, doc.ContentType);
    }

    // ---------------- helpers ----------------

    private async Task<CandidateProfile> RequireProfileAsync(Guid userId, CancellationToken ct, bool track = false)
    {
        var query = track ? _context.CandidateProfiles : _context.CandidateProfiles.AsNoTracking();
        return await query.FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw AppException.Forbidden("Save your profile details first.", ErrorCodes.ProfileRequired);
    }

    /// <summary>The photo other members see: the main photo once approved; otherwise keep an avatar, or nothing.</summary>
    internal static void SyncPublicPhoto(CandidateProfile profile, IEnumerable<ProfilePhoto> photos)
    {
        var main = photos.FirstOrDefault(p => p.IsMain && p.Status == ReviewItemStatus.Approved);
        if (main != null) profile.PhotoUrl = $"photo:{main.Id}";
        else if (profile.PhotoUrl.StartsWith("photo:")) profile.PhotoUrl = string.Empty;
    }

    internal static PhotoDto ToDto(ProfilePhoto p) => new()
    {
        Id = p.Id,
        Ref = $"photo:{p.Id}",
        SortOrder = p.SortOrder,
        IsMain = p.IsMain,
        Status = p.Status.ToString(),
        RejectReason = p.RejectReason,
        CreatedAt = p.CreatedAt
    };

    internal static KycDocumentDto ToDto(KycDocument d) => new()
    {
        Id = d.Id,
        Type = d.Type.ToString(),
        ContentType = d.ContentType,
        SizeBytes = d.SizeBytes,
        Status = d.Status.ToString(),
        UploadedAt = d.CreatedAt
    };
}
