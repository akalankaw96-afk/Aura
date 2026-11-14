using DatingApp.Application.Common.Interfaces;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace DatingApp.Infrastructure.Services;

/// <summary>
/// Verifies Google sign-in on the server (BUG-002).
/// • ID token (One Tap "credential", a JWT): signature, issuer, expiry and audience = our client id.
/// • OAuth access token (popup flow): Google's tokeninfo endpoint must report our client id as audience.
/// In both cases the e-mail must be verified by Google.
/// </summary>
public class GoogleTokenValidator : IGoogleTokenValidator
{
    private const string TokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?access_token=";
    private const string UserInfoUrl = "https://openidconnect.googleapis.com/v1/userinfo";

    private readonly HttpClient _http;
    private readonly string? _clientId;
    private readonly ILogger<GoogleTokenValidator> _logger;

    public GoogleTokenValidator(HttpClient http, IConfiguration configuration, ILogger<GoogleTokenValidator> logger)
    {
        _http = http;
        _http.Timeout = TimeSpan.FromSeconds(10);
        _clientId = configuration["GoogleAuth:ClientId"];
        _logger = logger;
    }

    public async Task<GoogleIdentity?> ValidateAsync(string token, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_clientId))
        {
            _logger.LogWarning("GoogleAuth:ClientId is not configured; Google sign-in is disabled.");
            return null;
        }
        if (string.IsNullOrWhiteSpace(token)) return null;

        return token.Count(c => c == '.') == 2
            ? await ValidateIdTokenAsync(token)
            : await ValidateAccessTokenAsync(token, ct);
    }

    private async Task<GoogleIdentity?> ValidateIdTokenAsync(string idToken)
    {
        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { _clientId! } });

            if (!payload.EmailVerified || string.IsNullOrEmpty(payload.Email)) return null;
            return new GoogleIdentity(payload.Subject, payload.Email, payload.Name, payload.Picture);
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogInformation("Rejected Google ID token: {Reason}", ex.Message);
            return null;
        }
    }

    private async Task<GoogleIdentity?> ValidateAccessTokenAsync(string accessToken, CancellationToken ct)
    {
        try
        {
            var info = await _http.GetFromJsonAsync<TokenInfo>(TokenInfoUrl + Uri.EscapeDataString(accessToken), ct);
            if (info == null
                || !string.Equals(info.Audience, _clientId, StringComparison.Ordinal)
                || !string.Equals(info.EmailVerified, "true", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrEmpty(info.Subject)
                || string.IsNullOrEmpty(info.Email))
            {
                return null;
            }

            // Name and picture are optional extras; the identity is already proven above.
            var (name, picture) = await TryGetProfileAsync(accessToken, ct);
            return new GoogleIdentity(info.Subject, info.Email, name, picture);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException)
        {
            // tokeninfo answers 400 for invalid / expired tokens; timeouts and bad JSON are treated as "not verified"
            _logger.LogInformation("Rejected Google access token: {Reason}", ex.Message);
            return null;
        }
    }

    private async Task<(string? Name, string? Picture)> TryGetProfileAsync(string accessToken, CancellationToken ct)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, UserInfoUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            using var response = await _http.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode) return (null, null);

            var profile = await response.Content.ReadFromJsonAsync<UserInfo>(cancellationToken: ct);
            return (profile?.Name, profile?.Picture);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException)
        {
            return (null, null);
        }
    }

    private sealed class TokenInfo
    {
        [JsonPropertyName("aud")] public string? Audience { get; set; }
        [JsonPropertyName("sub")] public string? Subject { get; set; }
        [JsonPropertyName("email")] public string? Email { get; set; }
        [JsonPropertyName("email_verified")] public string? EmailVerified { get; set; }
    }

    private sealed class UserInfo
    {
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("picture")] public string? Picture { get; set; }
    }
}
