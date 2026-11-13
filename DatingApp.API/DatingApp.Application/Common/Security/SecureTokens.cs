using System.Security.Cryptography;
using System.Text;

namespace DatingApp.Application.Common.Security;

/// <summary>Random tokens, one-time codes and their hashes. Raw values are never stored.</summary>
public static class SecureTokens
{
    /// <summary>256-bit URL-safe random token (refresh / reset tokens).</summary>
    public static string NewToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    /// <summary>Uniformly random numeric code, e.g. "048213".</summary>
    public static string NewCode(int length = AuthRules.CodeLength)
    {
        var max = (int)Math.Pow(10, length);
        return RandomNumberGenerator.GetInt32(0, max).ToString(new string('0', length));
    }

    /// <summary>Lower-case hex SHA-256 (64 chars).</summary>
    public static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();

    /// <summary>Codes are hashed together with their destination so equal codes never share a hash.</summary>
    public static string HashCode(string destination, string code) => Hash($"{destination}|{code}");

    public static bool HashEquals(string expectedHash, string actualHash) =>
        CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(expectedHash), Encoding.ASCII.GetBytes(actualHash));
}
