using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>
/// Paged member search (S03-T01, BUG-016). Filters run in SQL; only approved profiles; never the searcher's own.
/// A signed-in member's first page counts as one search (plan limit, S03-T03); later pages are free.
/// Guests see the first page only, without member-only details.
/// </summary>
public interface ISearchService
{
    Task<PagedResult<ProfileDto>> SearchAsync(Guid? viewerUserId, ProfileSearchDto filter, CancellationToken ct = default);
}

public class SearchService : ISearchService
{
    public const int MaxPageSize = 50;

    private readonly IApplicationDbContext _context;
    private readonly IUsageService _usage;

    public SearchService(IApplicationDbContext context, IUsageService usage)
    {
        _context = context;
        _usage = usage;
    }

    public async Task<PagedResult<ProfileDto>> SearchAsync(Guid? viewerUserId, ProfileSearchDto f, CancellationToken ct = default)
    {
        var page = Math.Max(1, f.Page);
        var pageSize = Math.Clamp(f.PageSize <= 0 ? 20 : f.PageSize, 1, MaxPageSize);
        if (!viewerUserId.HasValue) page = 1; // guests: first page only

        var query = _context.CandidateProfiles.AsNoTracking().Where(p => p.Status == ProfileStatus.Approved);
        if (viewerUserId.HasValue)
        {
            query = query.Where(p => p.UserId != viewerUserId.Value);
            var myProfileId = await _context.ProfileIdOfAsync(viewerUserId.Value, ct);
            if (myProfileId.HasValue)
            {
                var hidden = await _context.HiddenProfileIdsAsync(myProfileId.Value, ct); // blocked either way (S03-T07)
                if (hidden.Count > 0) query = query.Where(p => !hidden.Contains(p.Id));
            }
        }

        if (!string.IsNullOrWhiteSpace(f.Gender) && Enum.TryParse<Gender>(f.Gender, true, out var gender))
            query = query.Where(p => p.Gender == gender);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (f.AgeFrom is > 0)
        {
            var bornOnOrBefore = today.AddYears(-f.AgeFrom.Value);
            var from = f.AgeFrom.Value;
            query = query.Where(p => p.DateOfBirth.HasValue ? p.DateOfBirth <= bornOnOrBefore : p.Age >= from);
        }
        if (f.AgeTo is > 0)
        {
            var bornAfter = today.AddYears(-(f.AgeTo.Value + 1));
            var to = f.AgeTo.Value;
            query = query.Where(p => p.DateOfBirth.HasValue ? p.DateOfBirth > bornAfter : p.Age <= to);
        }

        if (Has(f.Religion))
        {
            var religion = f.Religion!.Trim();
            query = query.Where(p => p.Religion.Contains(religion)); // "Buddhist" also finds "Buddhist (Theravada)"
        }
        if (Has(f.Community)) query = query.Where(p => p.Community == f.Community!.Trim());
        if (Has(f.Country)) query = query.Where(p => p.Country == f.Country!.Trim());
        if (Has(f.Location))
        {
            var loc = f.Location!.Trim();
            query = query.Where(p => p.Location.Contains(loc) || p.Country.Contains(loc));
        }
        if (Has(f.Profession))
        {
            var prof = f.Profession!.Trim();
            query = Enum.TryParse<ProfessionCategory>(prof, true, out var category)
                ? query.Where(p => p.ProfessionCategory == category || p.Profession.Contains(prof))
                : query.Where(p => p.Profession.Contains(prof));
        }
        if (f.Horoscope == true) query = query.Where(p => p.HoroscopeAvailable);
        if (Has(f.Q))
        {
            var q = f.Q!.Trim();
            query = query.Where(p => p.FullName.Contains(q) || p.Code.Contains(q) || p.Profession.Contains(q));
        }

        query = (f.Sort ?? "newest").ToLowerInvariant() switch
        {
            // younger first = later birth date first
            "ageasc" => query.OrderByDescending(p => p.DateOfBirth).ThenBy(p => p.Age),
            "agedesc" => query.OrderBy(p => p.DateOfBirth).ThenByDescending(p => p.Age),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        // One search per new filtered query (page 1) for members; plain browsing (Bride / Groom, newest first) is free.
        // The plan limit applies before results are returned.
        if (viewerUserId.HasValue && page == 1 && IsRefined(f))
        {
            await _usage.ConsumeAsync(viewerUserId.Value, UsageFeature.Search, ct);
            await _context.SaveChangesAsync(ct);
        }

        var total = await query.CountAsync(ct);
        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return new PagedResult<ProfileDto>
        {
            Items = rows.Select(p => ProfileService.MapToDto(p, includeMemberDetails: viewerUserId.HasValue)).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <summary>True when the member narrowed the list: any filter besides gender, or a sort other than newest.</summary>
    public static bool IsRefined(ProfileSearchDto f) =>
        f.AgeFrom is > 0 || f.AgeTo is > 0 || Has(f.Religion) || Has(f.Community) || Has(f.Location) || Has(f.Country) ||
        Has(f.Profession) || f.Horoscope == true || Has(f.Q) || f.Filtered == true ||
        (!string.IsNullOrWhiteSpace(f.Sort) && !f.Sort.Equals("newest", StringComparison.OrdinalIgnoreCase));

    private static bool Has(string? s) => !string.IsNullOrWhiteSpace(s) && !s.Equals("All", StringComparison.OrdinalIgnoreCase);
}
