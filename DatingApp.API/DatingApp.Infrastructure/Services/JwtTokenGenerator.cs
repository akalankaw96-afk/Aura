using DatingApp.Application.Common.Interfaces;
using DatingApp.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DatingApp.Infrastructure.Services;

/// <summary>
/// Issues short-lived access tokens (default 15 minutes, BUG-008). The signing key comes only from
/// user-secrets / environment (<c>JwtSettings:Secret</c>, BUG-007) — there is no fallback key.
/// </summary>
public class JwtTokenGenerator : IJwtTokenGenerator
{
    public const string SessionClaim = "sid";
    public const int MinSecretBytes = 32;

    private readonly SigningCredentials _credentials;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly TimeSpan _lifetime;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        var secret = configuration["JwtSettings:Secret"];
        if (string.IsNullOrWhiteSpace(secret) || Encoding.UTF8.GetByteCount(secret) < MinSecretBytes)
        {
            throw new InvalidOperationException(
                $"JwtSettings:Secret must be set (at least {MinSecretBytes} bytes) via user-secrets or an environment variable.");
        }

        _credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)), SecurityAlgorithms.HmacSha256);
        _issuer = configuration["JwtSettings:Issuer"] ?? "AuraMatrimony";
        _audience = configuration["JwtSettings:Audience"] ?? "AuraMatrimonyApp";
        _lifetime = TimeSpan.FromMinutes(int.TryParse(configuration["JwtSettings:AccessTokenMinutes"], out var m) && m > 0 ? m : 15);
    }

    public AccessToken GenerateAccessToken(User user, Guid sessionId)
    {
        var expires = DateTime.UtcNow.Add(_lifetime);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role),
            new(SessionClaim, sessionId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = _credentials
        };

        var handler = new JwtSecurityTokenHandler();
        return new AccessToken(handler.WriteToken(handler.CreateToken(descriptor)), expires);
    }
}
