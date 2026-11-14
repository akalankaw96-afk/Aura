using System.Net.Mail;
using DatingApp.Application.Common.Exceptions;

namespace DatingApp.Application.Common.Security;

/// <summary>Normalizes the e-mail / mobile number a member types, and checks password strength.</summary>
public static class Identifiers
{
    public static bool LooksLikeEmail(string value) => value.Contains('@');

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    public static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 256) return false;
        try
        {
            var parsed = new MailAddress(email.Trim());
            return parsed.Address.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    /// <summary>
    /// Returns E.164 (e.g. +94771234567) or null when the number can't be valid.
    /// Sri Lankan local formats are accepted: 0771234567, 771234567, 77 123 4567, +94 77 123 4567.
    /// Other countries must include the country code (+44…, +61…).
    /// </summary>
    public static string? NormalizePhone(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        var trimmed = input.Trim();
        var digits = new string(trimmed.Where(char.IsDigit).ToArray());
        if (digits.Length == 0) return null;

        if (trimmed.StartsWith('+') || trimmed.StartsWith("00"))
        {
            if (trimmed.StartsWith("00")) digits = digits[2..];
            return digits.Length is >= 8 and <= 15 ? "+" + digits : null;
        }

        // Sri Lanka without country code
        if (digits.Length == 10 && digits[0] == '0') return "+94" + digits[1..];
        if (digits.Length == 9) return "+94" + digits;
        if (digits.Length == 11 && digits.StartsWith("94")) return "+" + digits;
        return null;
    }

    public static string RequirePhone(string? input, string field = "phoneNumber") =>
        NormalizePhone(input) ?? throw AppException.Validation("Enter a valid mobile number.", field);

    public static string RequireEmail(string? input, string field = "email")
    {
        if (input is null || !IsValidEmail(input)) throw AppException.Validation("Enter a valid email address.", field);
        return NormalizeEmail(input);
    }

    /// <summary>8–128 characters with at least one letter and one number.</summary>
    public static void EnsureStrongPassword(string? password, string field = "password")
    {
        if (string.IsNullOrEmpty(password)
            || password.Length < AuthRules.PasswordMinLength
            || password.Length > AuthRules.PasswordMaxLength
            || !password.Any(char.IsLetter)
            || !password.Any(char.IsDigit))
        {
            throw AppException.Validation(
                $"Use {AuthRules.PasswordMinLength} or more characters with at least one letter and one number.", field);
        }
    }
}
