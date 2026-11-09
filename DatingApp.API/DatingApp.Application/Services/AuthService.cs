using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace DatingApp.Application.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto dto, CancellationToken ct = default);
    Task<OtpResponseDto> SendOtpAsync(SendOtpDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpDto dto, CancellationToken ct = default);
    Task<AuthResponseDto?> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
}

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IPasswordHasher _passwordHasher;

    // Temporary in-memory OTP cache for demo/testing (Phone -> OTP Code)
    private static readonly ConcurrentDictionary<string, string> OtpStore = new();

    public AuthService(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
        _passwordHasher = passwordHasher;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default)
    {
        var existing = await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower(), ct);
        if (existing)
        {
            throw new InvalidOperationException("An account with this email address already exists. Please sign in instead.");
        }

        var user = new User
        {
            Email = dto.Email.ToLower().Trim(),
            PasswordHash = _passwordHasher.HashPassword(dto.Password),
            FullName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Role = "Member"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(ct);

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            ProfileId = null,
            HasCompletedProfile = false // Needs to enter profile details!
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var identifier = (dto.Email ?? string.Empty).Trim().ToLower();
        var digitsOnly = new string(identifier.Where(char.IsDigit).ToArray());

        var user = await _context.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == identifier ||
                (!string.IsNullOrEmpty(digitsOnly) && digitsOnly.Length >= 7 &&
                 (u.PhoneNumber.Contains(digitsOnly) ||
                  (digitsOnly.Length >= 9 && u.PhoneNumber.Replace(" ", "").Replace("+", "").EndsWith(digitsOnly.Substring(digitsOnly.Length - 9))))),
                ct);

        if (user == null || !_passwordHasher.VerifyPassword(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email, mobile number or password.");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            ProfileId = user.Profile?.Id,
            HasCompletedProfile = user.Profile != null
        };
    }

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.ToLower().Trim();
        var user = await _context.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email, ct);

        if (user == null)
        {
            // First time Google sign-in: create new user
            user = new User
            {
                Email = email,
                PasswordHash = _passwordHasher.HashPassword(Guid.NewGuid().ToString("N")),
                FullName = dto.FullName.Trim(),
                PhoneNumber = "",
                Role = "Member",
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(ct);
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            ProfileId = user.Profile?.Id,
            HasCompletedProfile = user.Profile != null
        };
    }

    public Task<OtpResponseDto> SendOtpAsync(SendOtpDto dto, CancellationToken ct = default)
    {
        var phone = dto.PhoneNumber.Trim();
        if (string.IsNullOrWhiteSpace(phone))
        {
            return Task.FromResult(new OtpResponseDto
            {
                Success = false,
                Message = "Please provide a valid phone number."
            });
        }

        // Generate 6-digit OTP code (e.g. 582914)
        var otp = new Random().Next(100000, 999999).ToString();
        OtpStore[phone] = otp;

        return Task.FromResult(new OtpResponseDto
        {
            Success = true,
            Message = $"Verification code sent via SMS to {phone}.",
            DemoOtp = otp
        });
    }

    public async Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpDto dto, CancellationToken ct = default)
    {
        var phone = dto.PhoneNumber.Trim();
        var code = dto.OtpCode.Trim();

        // Check if OTP matches or default dev OTP "123456"
        if (code != "123456" && (!OtpStore.TryGetValue(phone, out var expectedOtp) || expectedOtp != code))
        {
            throw new UnauthorizedAccessException("The verification code you entered is invalid or expired.");
        }

        // Remove used OTP
        OtpStore.TryRemove(phone, out _);

        // Find or create user by phone number
        var user = await _context.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.PhoneNumber == phone, ct);

        if (user == null)
        {
            var syntheticEmail = $"phone_{phone.Replace("+", "").Replace(" ", "")}@auramatrimony.lk";
            user = new User
            {
                PhoneNumber = phone,
                Email = syntheticEmail,
                FullName = !string.IsNullOrWhiteSpace(dto.FullName) ? dto.FullName : "Phone Member",
                PasswordHash = _passwordHasher.HashPassword(Guid.NewGuid().ToString("N")),
                Role = "Member",
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(ct);
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            ProfileId = user.Profile?.Id,
            HasCompletedProfile = user.Profile != null
        };
    }

    public async Task<AuthResponseDto?> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _context.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null) return null;

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            ProfileId = user.Profile?.Id,
            HasCompletedProfile = user.Profile != null
        };
    }
}
