using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Common.Security;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace DatingApp.Application.Services;

public interface IProfileService
{
    Task<List<ProfileDto>> GetProfilesAsync(ProfileFilterDto? filter = null, CancellationToken ct = default, bool includeMemberDetails = false);
    Task<ProfileDto?> GetProfileByIdAsync(Guid id, CancellationToken ct = default, bool includeMemberDetails = false);
    Task<ProfileDto?> GetProfileByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<ProfileDto> CreateOrUpdateProfileAsync(Guid userId, CreateProfileDto dto, CancellationToken ct = default);
    /// <summary>Change only the "about me" text (approved members — everything else is checked and locked).</summary>
    Task<ProfileDto> UpdateAboutAsync(Guid userId, string bio, CancellationToken ct = default);
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
        // Other members see approved profiles only (S02-T01)
        var query = _context.CandidateProfiles.AsNoTracking().Where(p => p.Status == ProfileStatus.Approved);

        if (filter != null)
        {
            if (!string.IsNullOrWhiteSpace(filter.Gender))
            {
                if (Enum.TryParse<Gender>(filter.Gender, true, out var g))
                {
                    query = query.Where(p => p.Gender == g);
                }
            }

            // Age from the birth date (the stored Age only for older profiles without one)
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (filter.AgeFrom.HasValue)
            {
                var bornOnOrBefore = today.AddYears(-filter.AgeFrom.Value);
                var from = filter.AgeFrom.Value;
                query = query.Where(p => p.DateOfBirth.HasValue ? p.DateOfBirth <= bornOnOrBefore : p.Age >= from);
            }

            if (filter.AgeTo.HasValue)
            {
                var bornAfter = today.AddYears(-(filter.AgeTo.Value + 1));
                var to = filter.AgeTo.Value;
                query = query.Where(p => p.DateOfBirth.HasValue ? p.DateOfBirth > bornAfter : p.Age <= to);
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

        }

        // Real members only — no fallback sample profiles (BUG-014). Errors surface as 500 ProblemDetails.
        var list = await query.OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
        return list.Select(profile => MapToDto(profile, includeMemberDetails)).ToList();
    }

    public async Task<ProfileDto?> GetProfileByIdAsync(Guid id, CancellationToken ct = default, bool includeMemberDetails = false)
    {
        var profile = await _context.CandidateProfiles.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && p.Status == ProfileStatus.Approved, ct);
        return profile == null ? null : MapToDto(profile, includeMemberDetails);
    }

    public async Task<ProfileDto?> GetProfileByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile == null) return null;
        var dto = MapToDto(profile, includeMemberDetails: true, owner: true);

        // The member sees their own main photo even while it waits for review
        var main = await _context.ProfilePhotos.AsNoTracking()
            .Where(ph => ph.ProfileId == profile.Id && ph.IsMain && ph.Status != ReviewItemStatus.Rejected)
            .Select(ph => (Guid?)ph.Id).FirstOrDefaultAsync(ct);
        if (main.HasValue) dto.PhotoUrl = $"photo:{main.Value}";
        return dto;
    }

    public async Task<ProfileDto> CreateOrUpdateProfileAsync(Guid userId, CreateProfileDto dto, CancellationToken ct = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw AppException.Unauthenticated();
        var existingProfile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // ---- validate & clean what the member typed (no defaults are invented here) ----
        var fullName = Clean(dto.FullName, 100);
        if (fullName.Length == 0) throw AppException.Validation("Enter your name.", "fullName");

        if (!Enum.TryParse<Gender>(Clean(dto.Gender, 10), true, out var gender) || !Enum.IsDefined(gender))
            throw AppException.Validation("Choose a gender.", "gender");

        var dateOfBirth = dto.DateOfBirth ?? existingProfile?.DateOfBirth;
        int age;
        if (dateOfBirth.HasValue)
        {
            age = AgeOn(dateOfBirth.Value, today);
            if (age < MinAge || age > MaxAge)
                throw AppException.Validation($"Members must be between {MinAge} and {MaxAge} years old.", "dateOfBirth");
        }
        else if (dto.Age >= MinAge && dto.Age <= MaxAge)
        {
            age = dto.Age; // old client without a birth date
        }
        else
        {
            throw AppException.Validation("Enter your date of birth.", "dateOfBirth");
        }

        var category = Enum.TryParse<ProfessionCategory>(Clean(dto.ProfessionCategory, 20), true, out var pc) && Enum.IsDefined(pc)
            ? pc
            : ProfessionCategory.Other;
        // "photo:<id>" points at an uploaded photo the server already manages — saving the form never changes it
        var photoUrl = (dto.PhotoUrl ?? string.Empty).Trim().StartsWith("photo:") ? string.Empty : CleanPhoto(dto.PhotoUrl);

        string? email = null;
        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            email = Identifiers.RequireEmail(dto.Email);
            if (email != user.Email && await _context.Users.AnyAsync(u => u.Email == email && u.Id != userId, ct))
                throw AppException.Conflict("This email address is already used by another account.");
        }

        var details = CleanDetails(dto.Details);
        var interests = string.Join(",", (dto.Interests ?? new List<string>())
            .Select(i => Clean(i, 40)).Where(i => i.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase));

        // ---- the account shows the real name (and e-mail) once the profile is saved ----
        user.FullName = fullName;
        if (email != null) user.Email = email;
        user.UpdatedAt = DateTime.UtcNow;

        var profile = existingProfile;
        if (profile == null)
        {
            profile = new CandidateProfile
            {
                UserId = userId,
                Code = await NewProfileCodeAsync(ct),
                Status = ProfileStatus.Draft, // BUG-009: only a moderator can approve (submit with POST /profiles/me/submit)
                Premium = false
            };
            _context.CandidateProfiles.Add(profile);
        }
        else
        {
            profile.UpdatedAt = DateTime.UtcNow;
        }

        profile.FullName = fullName;
        profile.Gender = gender;
        profile.DateOfBirth = dateOfBirth;
        profile.Age = age;
        profile.Height = Clean(dto.Height, 20);
        profile.Profession = Clean(dto.Profession, 100);
        profile.ProfessionCategory = category;
        profile.Education = Clean(dto.Education, 100);
        profile.University = Clean(dto.University, 150);
        profile.Location = Clean(dto.Location, 100);
        profile.Country = Clean(dto.Country, 60);
        profile.Religion = Clean(dto.Religion, 40);
        profile.Community = Clean(dto.Community, 40);
        profile.Bio = Clean(dto.Bio, 2000);
        profile.AboutFamily = Clean(dto.AboutFamily, 2000);
        profile.HoroscopeAvailable = dto.HoroscopeAvailable;
        // an update without a photo keeps the current one; a new profile starts without one
        if (photoUrl.Length > 0 || existingProfile == null) profile.PhotoUrl = photoUrl;
        profile.Interests = interests;
        if (details != null || existingProfile == null)
            profile.SubmittedDetailsJson = details == null ? null : JsonSerializer.Serialize(details);

        await _context.SaveChangesAsync(ct);
        return MapToDto(profile, includeMemberDetails: true, owner: true);
    }

    public async Task<ProfileDto> UpdateAboutAsync(Guid userId, string bio, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw AppException.Forbidden("Save your profile details first.", ErrorCodes.ProfileRequired);
        if (profile.Status == ProfileStatus.Suspended) throw AppException.Forbidden("This profile is suspended.");

        var text = (bio ?? string.Empty).Trim();
        if (text.Length < 50) throw AppException.Validation("Write at least 50 characters.", "bio");
        if (text.Length > MaxAbout) throw AppException.Validation($"Keep it under {MaxAbout} characters.", "bio");
        if (ContactDetails.IsMatch(text))
            throw AppException.Validation("Phone numbers, emails and links can't be added to your description.", "bio");

        profile.Bio = text;
        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return (await GetProfileByUserIdAsync(userId, ct))!;
    }

    // ---- helpers ----

    private const int MaxAbout = 500;
    /// <summary>Phone numbers (7+ digits), e-mail addresses and links — not allowed in the public description.</summary>
    private static readonly Regex ContactDetails = new(
        @"(\+?\d[\d\s-]{6,}\d)|([\w.+-]+@[\w-]+\.[\w.]+)|(https?://|www\.)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled, TimeSpan.FromMilliseconds(200));

    private const int MinAge = 18;
    private const int MaxAge = 80;
    private static readonly Regex AvatarRef = new(@"^avatar:[a-z0-9-]{1,40}$", RegexOptions.Compiled);

    private static string Clean(string? value, int maxLength)
    {
        var v = (value ?? string.Empty).Trim();
        return v.Length > maxLength ? v[..maxLength].TrimEnd() : v;
    }

    private static string? CleanOptional(string? value, int maxLength)
    {
        var v = Clean(value, maxLength);
        return v.Length == 0 ? null : v;
    }

    /// <summary>"", "avatar:&lt;id&gt;", an https URL or a site path. Images themselves are never stored in the database.</summary>
    private static string CleanPhoto(string? value)
    {
        var v = (value ?? string.Empty).Trim();
        if (v.Length == 0) return string.Empty;
        if (v.Length <= 2048 && (AvatarRef.IsMatch(v) || v.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
                                 (v.StartsWith('/') && !v.StartsWith("//"))))
            return v;
        throw AppException.Validation("Upload a photo or choose an avatar.", "photoUrl");
    }

    private static ProfileDetailsDto? CleanDetails(ProfileDetailsDto? d)
    {
        if (d == null) return null;
        return new ProfileDetailsDto
        {
            DisplayName = CleanOptional(d.DisplayName, 100),
            CreatedBy = CleanOptional(d.CreatedBy, 30),
            CivilStatus = CleanOptional(d.CivilStatus, 30),
            District = CleanOptional(d.District, 60),
            Caste = CleanOptional(d.Caste, 60),
            ZodiacSign = CleanOptional(d.ZodiacSign, 30),
            MonthlySalaryRange = CleanOptional(d.MonthlySalaryRange, 60),
            WeightKg = CleanOptional(d.WeightKg, 10),
            ProfileFor = CleanOptional(d.ProfileFor, 30),
            WhatsApp = CleanOptional(d.WhatsApp, 20)
        };
    }

    public static int AgeOn(DateOnly dateOfBirth, DateOnly today)
    {
        var age = today.Year - dateOfBirth.Year;
        if (today < dateOfBirth.AddYears(age)) age--;
        return age;
    }

    /// <summary>Profile codes like "LK-482913": random, checked against the database (the column is unique too).</summary>
    private async Task<string> NewProfileCodeAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = $"LK-{RandomNumberGenerator.GetInt32(100_000, 1_000_000)}";
            if (!await _context.CandidateProfiles.AnyAsync(p => p.Code == code, ct)) return code;
        }
        throw new InvalidOperationException("Could not generate a unique profile code.");
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
        if (!owner && details != null) details.WhatsApp = null; // private until both members agree to share contacts

        return new ProfileDto
        {
            Id = p.Id,
            Code = p.Code,
            Name = !owner && !string.IsNullOrWhiteSpace(details?.DisplayName) ? details.DisplayName : p.FullName,
            Gender = p.Gender.ToString().ToLowerInvariant(),
            Age = p.DateOfBirth.HasValue ? AgeOn(p.DateOfBirth.Value, DateOnly.FromDateTime(DateTime.UtcNow)) : p.Age,
            DateOfBirth = owner ? p.DateOfBirth?.ToString("yyyy-MM-dd") : null,
            Height = p.Height,
            Profession = p.Profession,
            ProfessionCategory = p.ProfessionCategory.ToString(),
            Education = p.Education,
            University = p.University,
            Location = p.Location,
            Country = p.Country,
            Religion = p.Religion,
            Community = p.Community,
            Verified = p.Status == ProfileStatus.Approved,
            Status = owner ? p.Status.ToString() : null,
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
