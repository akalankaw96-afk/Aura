namespace DatingApp.WebApi.Auth;

/// <summary>
/// The refresh token lives only in this httpOnly cookie (BUG-017) — JavaScript can't read it.
/// Path is limited to /api/auth so it isn't sent with every API call.
/// The web app must call the auth endpoints with <c>credentials: "include"</c>.
/// </summary>
public static class RefreshCookie
{
    public const string Name = "vk_refresh";
    public const string Path = "/api/auth";

    public static void Write(HttpResponse response, string token, DateTime expiresAt, SameSiteMode sameSite) =>
        response.Cookies.Append(Name, token, Options(expiresAt, sameSite));

    public static string? Read(HttpRequest request) =>
        request.Cookies.TryGetValue(Name, out var value) ? value : null;

    public static void Clear(HttpResponse response, SameSiteMode sameSite) =>
        response.Cookies.Delete(Name, Options(null, sameSite));

    private static CookieOptions Options(DateTime? expiresAt, SameSiteMode sameSite) => new()
    {
        HttpOnly = true,
        Secure = true, // browsers accept Secure cookies from http://localhost during development
        SameSite = sameSite,
        Path = Path,
        Expires = expiresAt.HasValue ? new DateTimeOffset(expiresAt.Value, TimeSpan.Zero) : null,
        IsEssential = true
    };
}
