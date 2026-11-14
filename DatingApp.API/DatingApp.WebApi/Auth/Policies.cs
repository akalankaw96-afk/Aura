namespace DatingApp.WebApi.Auth;

/// <summary>Authorization policy names (S01-T09). Roles live in DatingApp.Domain.Entities.Roles.</summary>
public static class Policies
{
    /// <summary>Admins only — settings, plan limits, staff management.</summary>
    public const string Admin = "Admin";

    /// <summary>Admins and moderators — KYC review, reports, content moderation.</summary>
    public const string Staff = "Staff";
}
