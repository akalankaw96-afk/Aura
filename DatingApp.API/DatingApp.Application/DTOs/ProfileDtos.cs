namespace DatingApp.Application.DTOs;

public class ProfileDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty; // "female" | "male"
    public int Age { get; set; }
    public string Height { get; set; } = string.Empty;
    public string Profession { get; set; } = string.Empty;
    public string ProfessionCategory { get; set; } = string.Empty; // "Doctor", "Engineer", "IT", etc.
    public string Education { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Religion { get; set; } = string.Empty;
    public string Community { get; set; } = string.Empty;
    public bool Verified { get; set; }
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
    public string Gender { get; set; } = "female"; // "female" or "male"
    public int Age { get; set; }
    public string Height { get; set; } = string.Empty;
    public string Profession { get; set; } = string.Empty;
    public string ProfessionCategory { get; set; } = "Other";
    public string Education { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Country { get; set; } = "Sri Lanka";
    public string Religion { get; set; } = string.Empty;
    public string Community { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string AboutFamily { get; set; } = string.Empty;
    public bool HoroscopeAvailable { get; set; } = true;
    public string PhotoUrl { get; set; } = string.Empty;
    public List<string> Interests { get; set; } = new();
    public ProfileDetailsDto? Details { get; set; }
}

