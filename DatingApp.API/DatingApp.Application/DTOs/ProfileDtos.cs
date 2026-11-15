namespace DatingApp.Application.DTOs;

public class ProfileDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty; // "female" | "male"
    public int Age { get; set; }
    /// <summary>"yyyy-MM-dd" — only in the member's own profile (GET /profiles/me), never shown to others.</summary>
    public string? DateOfBirth { get; set; }
    public string Height { get; set; } = string.Empty;
    public string Profession { get; set; } = string.Empty;
    public string ProfessionCategory { get; set; } = string.Empty; // "Doctor", "Engineer", "IT", etc.
    public string Education { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Religion { get; set; } = string.Empty;
    public string Community { get; set; } = string.Empty;
    /// <summary>True when a moderator approved the profile (Status == Approved).</summary>
    public bool Verified { get; set; }
    /// <summary>Review state — only in the member's own profile.</summary>
    public string? Status { get; set; }
    public bool Premium { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string AboutFamily { get; set; } = string.Empty;
    public bool HoroscopeAvailable { get; set; }
    public List<string> Interests { get; set; } = new();
    public ProfileDetailsDto? Details { get; set; }
}

public class ProfileDetailsDto
{
    public string? DisplayName { get; set; }
    public string? CreatedBy { get; set; }
    public string? CivilStatus { get; set; }
    public string? District { get; set; }
    public string? Caste { get; set; }
    public string? ZodiacSign { get; set; }
    public string? MonthlySalaryRange { get; set; }
    public string? WeightKg { get; set; }
    /// <summary>Who the profile is for (Myself, Son, Daughter …), from the sign-up step.</summary>
    public string? ProfileFor { get; set; }
    /// <summary>Private: only in the member's own profile; shared later through the chat contact-share.</summary>
    public string? WhatsApp { get; set; }
}

/// <summary>PATCH /profiles/me/about — the description is the one field approved members change themselves.</summary>
public class UpdateAboutDto
{
    public string Bio { get; set; } = string.Empty;
}

public class ProfileFilterDto
{
    public string? Gender { get; set; }
    public int? AgeFrom { get; set; }
    public int? AgeTo { get; set; }
    public string? Profession { get; set; }
    public string? Location { get; set; }
    public bool? VerifiedOnly { get; set; }
}

public class CreateProfileDto
{
    public string FullName { get; set; } = string.Empty;
    /// <summary>Optional; saved to the account (must not belong to another member).</summary>
    public string? Email { get; set; }
    public string Gender { get; set; } = string.Empty; // "female" or "male"
    /// <summary>Birth date ("yyyy-MM-dd"). Required for new profiles; the age is worked out from it.</summary>
    public DateOnly? DateOfBirth { get; set; }
    /// <summary>Only used by old clients that don't send <see cref="DateOfBirth"/>.</summary>
    public int Age { get; set; }
    public string Height { get; set; } = string.Empty;
    public string Profession { get; set; } = string.Empty;
    public string ProfessionCategory { get; set; } = "Other";
    public string Education { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Religion { get; set; } = string.Empty;
    public string Community { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string AboutFamily { get; set; } = string.Empty;
    public bool HoroscopeAvailable { get; set; }
    /// <summary>"" (none yet), "avatar:&lt;id&gt;" (illustrated avatar) or an https / site-relative photo URL. Never a data: URI.</summary>
    public string PhotoUrl { get; set; } = string.Empty;
    public List<string> Interests { get; set; } = new();
    public ProfileDetailsDto? Details { get; set; }
}

