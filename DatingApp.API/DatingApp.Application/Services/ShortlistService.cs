using System.Text.Json;
using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>Shortlist / favourites on the server (S03-T06).</summary>
public interface IShortlistService
{
    Task<List<ShortlistItemDto>> ListAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(Guid userId, Guid profileId, CancellationToken ct = default);
    Task RemoveAsync(Guid userId, Guid profileId, CancellationToken ct = default);
}

public class ShortlistService : IShortlistService
{
    public const int MaxItems = 200;
    private readonly IApplicationDbContext _context;

    public ShortlistService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ShortlistItemDto>> ListAsync(Guid userId, CancellationToken ct = default)
    {
        var rows = await _context.Shortlists.AsNoTracking().Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt).ToListAsync(ct);
        var me = await _context.ProfileIdOfAsync(userId, ct);
        var hidden = me.HasValue ? await _context.HiddenProfileIdsAsync(me.Value, ct) : new List<Guid>();

        var ids = rows.Select(r => r.ProfileId).ToList();
        var profiles = await _context.CandidateProfiles.AsNoTracking()
            .Where(p => ids.Contains(p.Id) && p.Status == ProfileStatus.Approved)
            .ToDictionaryAsync(p => p.Id, ct);

        return rows.Where(r => profiles.ContainsKey(r.ProfileId) && !hidden.Contains(r.ProfileId))
            .Select(r => new ShortlistItemDto
            {
                Profile = ProfileService.MapToDto(profiles[r.ProfileId], includeMemberDetails: true),
                AddedAt = r.CreatedAt
            }).ToList();
    }

    public async Task AddAsync(Guid userId, Guid profileId, CancellationToken ct = default)
    {
        var me = await _context.ProfileIdOfAsync(userId, ct);
        if (me == profileId) throw AppException.Validation("You cannot shortlist your own profile.", "profileId");

        var visible = await _context.CandidateProfiles.AnyAsync(p => p.Id == profileId && p.Status == ProfileStatus.Approved, ct);
        if (!visible || (me.HasValue && await _context.IsBlockedEitherWayAsync(me.Value, profileId, ct)))
            throw AppException.NotFound("This member is no longer available.");

        if (await _context.Shortlists.AnyAsync(s => s.UserId == userId && s.ProfileId == profileId, ct)) return; // already there

        if (await _context.Shortlists.CountAsync(s => s.UserId == userId, ct) >= MaxItems)
            throw AppException.Validation($"Your shortlist can hold up to {MaxItems} profiles. Remove some first.", "profileId");

        _context.Shortlists.Add(new Shortlist { UserId = userId, ProfileId = profileId });
        await _context.SaveChangesAsync(ct);
    }

    public async Task RemoveAsync(Guid userId, Guid profileId, CancellationToken ct = default)
    {
        var row = await _context.Shortlists.FirstOrDefaultAsync(s => s.UserId == userId && s.ProfileId == profileId, ct);
        if (row == null) return;
        _context.Shortlists.Remove(row);
        await _context.SaveChangesAsync(ct);
    }
}

/// <summary>Saved searches (S03-T06). Running one is a normal <c>GET /api/profiles/search</c>.</summary>
public interface ISavedSearchService
{
    Task<List<SavedSearchDto>> ListAsync(Guid userId, CancellationToken ct = default);
    Task<SavedSearchDto> CreateAsync(Guid userId, CreateSavedSearchDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, Guid id, CancellationToken ct = default);
}

public class SavedSearchService : ISavedSearchService
{
    public const int MaxSaved = 10;
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private readonly IApplicationDbContext _context;

    public SavedSearchService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SavedSearchDto>> ListAsync(Guid userId, CancellationToken ct = default)
    {
        var rows = await _context.SavedSearches.AsNoTracking().Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt).ToListAsync(ct);
        return rows.Select(ToDto).ToList();
    }

    public async Task<SavedSearchDto> CreateAsync(Guid userId, CreateSavedSearchDto dto, CancellationToken ct = default)
    {
        var name = (dto.Name ?? string.Empty).Trim();
        if (name.Length == 0) throw AppException.Validation("Give this search a name.", "name");
        if (name.Length > 60) throw AppException.Validation("Names can be up to 60 characters.", "name");

        if (await _context.SavedSearches.AnyAsync(s => s.UserId == userId && s.Name == name, ct))
            throw AppException.Conflict("You already have a saved search with this name.");
        if (await _context.SavedSearches.CountAsync(s => s.UserId == userId, ct) >= MaxSaved)
            throw AppException.Validation($"You can keep up to {MaxSaved} saved searches. Delete one first.", "name");

        var filters = dto.Filters ?? new ProfileSearchDto();
        filters.Page = 1;
        filters.PageSize = 20;

        var row = new SavedSearch { UserId = userId, Name = name, FiltersJson = JsonSerializer.Serialize(filters, Json) };
        if (row.FiltersJson.Length > 2000) throw AppException.Validation("These filters are too long to save.", "filters");

        _context.SavedSearches.Add(row);
        await _context.SaveChangesAsync(ct);
        return ToDto(row);
    }

    public async Task DeleteAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var row = await _context.SavedSearches.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct)
            ?? throw AppException.NotFound("Saved search not found.");
        _context.SavedSearches.Remove(row);
        await _context.SaveChangesAsync(ct);
    }

    private static SavedSearchDto ToDto(SavedSearch s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        Filters = JsonSerializer.Deserialize<ProfileSearchDto>(s.FiltersJson, Json) ?? new ProfileSearchDto(),
        CreatedAt = s.CreatedAt
    };
}
