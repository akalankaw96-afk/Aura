using DatingApp.Application.Common.Interfaces;
using System.Globalization;
using System.Security.Cryptography;

namespace DatingApp.Infrastructure.Services;

/// <summary>
/// PBKDF2-SHA256 (BUG-018). New hashes: <c>v2.{iterations}.{salt}.{key}</c> with 600,000 iterations.
/// Old hashes (<c>{salt}.{key}</c>, 10,000 iterations) still verify and are upgraded at the next login.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int CurrentIterations = 600_000;
    private const int LegacyIterations = 10_000;
    private const string Version = "v2";

    public string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, CurrentIterations, HashAlgorithmName.SHA256, KeySize);
        return string.Join('.', Version, CurrentIterations.ToString(CultureInfo.InvariantCulture),
            Convert.ToBase64String(salt), Convert.ToBase64String(key));
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        if (!TryParse(passwordHash, out var iterations, out var salt, out var expected)) return false;

        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    public bool NeedsRehash(string passwordHash) =>
        !TryParse(passwordHash, out var iterations, out _, out _) || iterations < CurrentIterations;

    private static bool TryParse(string passwordHash, out int iterations, out byte[] salt, out byte[] key)
    {
        iterations = 0;
        salt = Array.Empty<byte>();
        key = Array.Empty<byte>();
        if (string.IsNullOrEmpty(passwordHash)) return false;

        try
        {
            var parts = passwordHash.Split('.');
            if (parts.Length == 4 && parts[0] == Version)
            {
                iterations = int.Parse(parts[1], CultureInfo.InvariantCulture);
                salt = Convert.FromBase64String(parts[2]);
                key = Convert.FromBase64String(parts[3]);
            }
            else if (parts.Length == 2)
            {
                iterations = LegacyIterations;
                salt = Convert.FromBase64String(parts[0]);
                key = Convert.FromBase64String(parts[1]);
            }
            else
            {
                return false;
            }
        }
        catch (FormatException)
        {
            return false;
        }

        return iterations > 0 && salt.Length > 0 && key.Length > 0;
    }
}
