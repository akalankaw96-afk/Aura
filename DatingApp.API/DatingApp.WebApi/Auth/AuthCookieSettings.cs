namespace DatingApp.WebApi.Auth;

/// <summary>
/// <c>Auth:RefreshCookieSameSite</c>: "Strict" (default) when the web app and API share a site
/// (localhost:3001 + localhost:5000, or app.vikasitha.lk + api.vikasitha.lk). Use "None" only if they are on
/// different sites — and then the CORS allow-list is the only protection, so keep it tight.
/// </summary>
public class AuthCookieSettings
{
    public SameSiteMode SameSite { get; }

    public AuthCookieSettings(IConfiguration configuration)
    {
        SameSite = Enum.TryParse<SameSiteMode>(configuration["Auth:RefreshCookieSameSite"], ignoreCase: true, out var mode)
            ? mode
            : SameSiteMode.Strict;
    }
}
