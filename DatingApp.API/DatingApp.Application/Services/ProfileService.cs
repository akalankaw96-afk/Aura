using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DatingApp.Application.Services;

public interface IProfileService
{
    Task<List<ProfileDto>> GetProfilesAsync(ProfileFilterDto? filter = null, CancellationToken ct = default, bool includeMemberDetails = false);
    Task<ProfileDto?> GetProfileByIdAsync(Guid id, CancellationToken ct = default, bool includeMemberDetails = false);
    Task<ProfileDto?> GetProfileByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<ProfileDto> CreateOrUpdateProfileAsync(Guid userId, CreateProfileDto dto, CancellationToken ct = default);
}

public class ProfileService : IProfileService
{
    private readonly IApplicationDbContext _context;

    public ProfileService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProfileDto>> GetProfilesAsync(ProfileFilterDto? filter = null, CancellationToken ct = default, bool includeMemberDetails = false)
    {
        var query = _context.CandidateProfiles.AsNoTracking().AsQueryable();

        if (filter != null)
        {
            if (!string.IsNullOrWhiteSpace(filter.Gender))
            {
                if (Enum.TryParse<Gender>(filter.Gender, true, out var g))
                {
                    query = query.Where(p => p.Gender == g);
                }
            }

            if (filter.AgeFrom.HasValue)
            {
                query = query.Where(p => p.Age >= filter.AgeFrom.Value);
            }

            if (filter.AgeTo.HasValue)
            {
                query = query.Where(p => p.Age <= filter.AgeTo.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Profession) && !filter.Profession.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<ProfessionCategory>(filter.Profession, true, out var pc))
                {
                    query = query.Where(p => p.ProfessionCategory == pc);
                }
                else
                {
                    query = query.Where(p => p.Profession.Contains(filter.Profession) || p.ProfessionCategory.ToString() == filter.Profession);
                }
            }

            if (!string.IsNullOrWhiteSpace(filter.Location) && !filter.Location.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Location.Contains(filter.Location) || p.Country.Contains(filter.Location));
            }

            if (filter.VerifiedOnly == true)
            {
                query = query.Where(p => p.Verified);
            }
        }

        // Real members only — no fallback sample profiles (BUG-014). Errors surface as 500 ProblemDetails.
        var list = await query.OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
        return list.Select(profile => MapToDto(profile, includeMemberDetails)).ToList();
    }

    public async Task<ProfileDto?> GetProfileByIdAsync(Guid id, CancellationToken ct = default, bool includeMemberDetails = false)
    {
        var profile = await _context.CandidateProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
        return profile == null ? null : MapToDto(profile, includeMemberDetails);
    }

    public async Task<ProfileDto?> GetProfileByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, ct);
        return profile == null ? null : MapToDto(profile, includeMemberDetails: true, owner: true);
    }

    public async Task<ProfileDto> CreateOrUpdateProfileAsync(Guid userId, CreateProfileDto dto, CancellationToken ct = default)
    {
        Enum.TryParse<Gender>(dto.Gender, true, out var gender);
        Enum.TryParse<ProfessionCategory>(dto.ProfessionCategory, true, out var category);

        var existingProfile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);

        if (existingProfile != null)
        {
            // Update existing profile with newly entered details
            existingProfile.FullName = dto.FullName;
            existingProfile.Gender = gender;
            existingProfile.Age = dto.Age;
            existingProfile.Height = dto.Height;
            existingProfile.Profession = dto.Profession;
            existingProfile.ProfessionCategory = category;
            existingProfile.Education = dto.Education;
            existingProfile.University = dto.University;
            existingProfile.Location = dto.Location;
            existingProfile.Country = dto.Country;
            existingProfile.Religion = dto.Religion;
            existingProfile.Community = dto.Community;
            existingProfile.Bio = dto.Bio;
            existingProfile.AboutFamily = dto.AboutFamily;
            existingProfile.HoroscopeAvailable = dto.HoroscopeAvailable;
            if (!string.IsNullOrWhiteSpace(dto.PhotoUrl)) existingProfile.PhotoUrl = dto.PhotoUrl;
            existingProfile.Interests = string.Join(",", dto.Interests);
            if (dto.Details != null) existingProfile.SubmittedDetailsJson = JsonSerializer.Serialize(dto.Details);
            existingProfile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
            return MapToDto(existingProfile, includeMemberDetails: true, owner: true);
        }

        // Create new profile
        var randomCode = $"LK-{new Random().Next(1000, 9999)}";
        var profile = new CandidateProfile
        {
            UserId = userId,
            Code = randomCode,
            FullName = dto.FullName,
            Gender = gender,
            Age = dto.Age,
            Height = dto.Height,
            Profession = dto.Profession,
            ProfessionCategory = category,
            Education = dto.Education,
            University = dto.University,
            Location = dto.Location,
            Country = dto.Country,
            Religion = dto.Religion,
            Community = dto.Community,
            Bio = dto.Bio,
            AboutFamily = dto.AboutFamily,
            HoroscopeAvailable = dto.HoroscopeAvailable,
            Verified = false, // BUG-009: only the KYC review may verify a profile
            Premium = false,
            PhotoUrl = dto.PhotoUrl ?? string.Empty, // no stock photo — the app shows the bride/groom illustration
            Interests = string.Join(",", dto.Interests),
            SubmittedDetailsJson = dto.Details == null ? null : JsonSerializer.Serialize(dto.Details)
        };

        _context.CandidateProfiles.Add(profile);
        await _context.SaveChangesAsync(ct);

        return MapToDto(profile, includeMemberDetails: true, owner: true);
    }

    private static ProfileDto MapToDto(CandidateProfile p, bool includeMemberDetails = false, bool owner = false)
    {
        var details = string.IsNullOrWhiteSpace(p.SubmittedDetailsJson)
            ? null
            : JsonSerializer.Deserialize<ProfileDetailsDto>(p.SubmittedDetailsJson);
        if (!includeMemberDetails && details != null)
        {
            details.ZodiacSign = null;
            details.MonthlySalaryRange = null;
            details.WeightKg = null;
        }

        return new ProfileDto
        {
            Id = p.Id,
            Code = p.Code,
            Name = !owner && !string.IsNullOrWhiteSpace(details?.DisplayName) ? details.DisplayName : p.FullName,
            Gender = p.Gender.ToString().ToLowerInvariant(),
            Age = p.Age,
            Height = p.Height,
            Profession = p.Profession,
            ProfessionCategory = p.ProfessionCategory.ToString(),
            Education = p.Education,
            University = p.University,
            Location = p.Location,
            Country = p.Country,
            Religion = p.Religion,
            Community = p.Community,
            Verified = p.Verified,
            Premium = p.Premium,
            PhotoUrl = p.PhotoUrl,
            Bio = p.Bio,
            AboutFamily = p.AboutFamily,
            HoroscopeAvailable = p.HoroscopeAvailable,
            Details = details,
            Interests = string.IsNullOrWhiteSpace(p.Interests)
                ? new List<string>()
                : p.Interests.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
        };
    }
}
