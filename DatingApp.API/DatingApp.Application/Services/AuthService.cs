using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Common.Security;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

public interface IAuthService
{
    Task<RegisterOutcome> RegisterAsync(RegisterDto dto, ClientInfo client, CancellationToken ct = default);
    Task<AuthResult> LoginAsync(LoginDto dto, ClientInfo client, CancellationToken ct = default);
    Task<AuthResult> GoogleLoginAsync(GoogleLoginDto dto, ClientInfo client, CancellationToken ct = default);
    Task<OtpResponseDto> SendOtpAsync(SendOtpDto dto, CancellationToken ct = default);
    Task<AuthResult> VerifyOtpAsync(VerifyOtpDto dto, ClientInfo client, CancellationToken ct = default);
    Task<AuthResponseDto?> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
}

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IGoogleTokenValidator _google;
    private readonly IOtpService _otp;
    private readonly ISessionService _sessions;

    /// <summary>Verified against when no account matches, so "unknown user" and "wrong password" take the same time.</summary>
    private static string? _dummyHash;

    public AuthService(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IGoogleTokenValidator google,
        IOtpService otp,
        ISessionService sessions)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _google = google;
        _otp = otp;
        _sessions = sessions;
    }

    /// <summary>Name shown until the member saves their profile (ProfileService copies the real name over).</summary>
    public const string PlaceholderName = "New member";

    public async Task<RegisterOutcome> RegisterAsync(RegisterDto dto, ClientInfo client, CancellationToken ct = default)
    {
        var phone = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? string.Empty : Identifiers.RequirePhone(dto.PhoneNumber);
        if (phone.Length == 0 && string.IsNullOrWhiteSpace(dto.Email))
        {
            throw AppException.Validation("Enter your mobile number or email address.", "phoneNumber");
        }
        // Mobile-only sign-up has no e-mail (null) — never a made-up address. The member can add one on the profile step.
        string? email = string.IsNullOrWhiteSpace(dto.Email) ? null : Identifiers.RequireEmail(dto.Email);
        Identifiers.EnsureStrongPassword(dto.Password);
        var name = string.IsNullOrWhiteSpace(dto.FullName) ? PlaceholderName : dto.FullName.Trim();

        if (email != null && await _context.Users.AnyAsync(u => u.Email == email, ct))
        {
            throw new AppException(409, ErrorCodes.AlreadyExists,
                "An account with this email address already exists. Please log in instead.");
        }

        User? user = null;
        if (phone.Length > 0)
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone, ct);
            if (user != null && (user.PhoneVerified || user.GoogleSubject != null))
            {
                throw new AppException(409, ErrorCodes.AlreadyExists,
                    "An account with this mobile number already exists. Please log in instead.");
            }
        }

        if (user != null)
        {
            // Someone started signing up with this number but never confirmed the code: nobody owns it yet,
            // so the new sign-up takes it over (otherwise an abandoned sign-up would block the number for ever).
            user.PasswordHash = _passwordHasher.HashPassword(dto.Password);
            user.Email = email;
            user.FullName = name;
            user.SecurityStamp = Guid.NewGuid().ToString("N");
            user.FailedLoginCount = 0;
            user.LockoutEndsAt = null;
            user.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            user = new User
            {
                Email = email,
                PasswordHash = _passwordHasher.HashPassword(dto.Password),
                FullName = name,
                PhoneNumber = phone,
                PhoneVerified = false, // set by verify-otp
                Role = Roles.Member
            };
            _context.Users.Add(user);
        }

        await _context.SaveChangesAsync(ct);

        // A mobile number must be confirmed by SMS before the account can be used: no session until verify-otp.
        if (phone.Length > 0) return new RegisterOutcome(null, user.Id, phone);

        return new RegisterOutcome(await _sessions.StartAsync(user, client, ct), user.Id, phone);
    }

    public async Task<AuthResult> LoginAsync(LoginDto dto, ClientInfo client, CancellationToken ct = default)
    {
        var user = await FindByIdentifierAsync(dto.Email, ct);
        var now = DateTime.UtcNow;

        if (user == null)
        {
            _passwordHasher.VerifyPassword(dto.Password, _dummyHash ??= _passwordHasher.HashPassword(Guid.NewGuid().ToString("N")));
            throw InvalidCredentials();
        }

        if (user.LockoutEndsAt > now)
        {
            var seconds = (int)Math.Ceiling((user.LockoutEndsAt.Value - now).TotalSeconds);
            throw new AppException(429, ErrorCodes.AccountLocked,
                "Too many incorrect tries. Please wait before trying again or reset your password.",
                new Dictionary<string, object?> { ["retryAfterSeconds"] = seconds });
        }

        if (!_passwordHasher.VerifyPassword(dto.Password, user.PasswordHash))
        {
            user.FailedLoginCount += 1;
            if (user.FailedLoginCount >= AuthRules.MaxFailedLogins)
            {
                user.LockoutEndsAt = now.Add(AuthRules.LockoutDuration);
                user.FailedLoginCount = 0;
            }
            await _context.SaveChangesAsync(ct);
            throw InvalidCredentials(); // same response as an unknown account
        }

        // Only reveal suspension to someone who knows the password.
        if (!user.IsActive) throw Suspended();

        // Sign-up isn't finished until the mobile number is confirmed by SMS.
        if (!user.PhoneVerified && user.GoogleSubject == null && user.PhoneNumber.Length > 0)
        {
            throw new AppException(403, ErrorCodes.PhoneNotVerified,
                "Your mobile number isn't verified yet. Sign up again with the same number to get a new code.");
        }

        user.FailedLoginCount = 0;
        user.LockoutEndsAt = null;
        if (_passwordHasher.NeedsRehash(user.PasswordHash))
        {
            user.PasswordHash = _passwordHasher.HashPassword(dto.Password); // BUG-018: upgrade old hashes
        }
        await _context.SaveChangesAsync(ct);

        return await _sessions.StartAsync(user, client, ct);
    }

    public async Task<AuthResult> GoogleLoginAsync(GoogleLoginDto dto, ClientInfo client, CancellationToken ct = default)
    {
        // BUG-002: identity comes only from a token Google signed for our client id.
        var identity = await _google.ValidateAsync(dto.IdToken, ct)
            ?? throw new AppException(401, ErrorCodes.GoogleTokenInvalid, "Google sign-in failed. Please try again.");

        var email = Identifiers.NormalizeEmail(identity.Email);
        var user = await _context.Users.Include(u => u.Profile)
                       .FirstOrDefaultAsync(u => u.GoogleSubject == identity.Subject, ct)
                   ?? await _context.Users.Include(u => u.Profile)
                       .FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user == null)
        {
            user = new User
            {
                Email = email,
                // Random password: the member can set one later with "Forgot password".
                PasswordHash = _passwordHasher.HashPassword(SecureTokens.NewToken()),
                FullName = string.IsNullOrWhiteSpace(identity.Name) ? email.Split('@')[0] : identity.Name.Trim(),
                Role = Roles.Member,
                GoogleSubject = identity.Subject
            };
            _context.Users.Add(user);
        }
        else
        {
            if (!user.IsActive) throw Suspended();
            user.GoogleSubject ??= identity.Subject; // link an existing e-mail account (Google verified the address)
            if (user.Profile != null && string.IsNullOrWhiteSpace(user.Profile.PhotoUrl) && !string.IsNullOrWhiteSpace(identity.PictureUrl))
            {
                user.Profile.PhotoUrl = identity.PictureUrl;
            }
        }

        await _context.SaveChangesAsync(ct);
        return await _sessions.StartAsync(user, client, ct);
    }

    public Task<OtpResponseDto> SendOtpAsync(SendOtpDto dto, CancellationToken ct = default)
    {
        var phone = Identifiers.RequirePhone(dto.PhoneNumber);
        return _otp.IssueAsync(OtpPurpose.VerifyPhone, OtpChannel.Phone, phone, userId: null, deliver: true, ct);
    }

    public async Task<AuthResult> VerifyOtpAsync(VerifyOtpDto dto, ClientInfo client, CancellationToken ct = default)
    {
        var phone = Identifiers.RequirePhone(dto.PhoneNumber);
        await _otp.VerifyAsync(OtpPurpose.VerifyPhone, phone, dto.OtpCode, ct); // throws on a wrong / expired code

        var user = await _context.Users.Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.PhoneNumber == phone, ct);

        if (user == null)
        {
            user = new User
            {
                PhoneNumber = phone,
                Email = null, // mobile-only account
                FullName = string.IsNullOrWhiteSpace(dto.FullName) ? PlaceholderName : dto.FullName.Trim(),
                PasswordHash = _passwordHasher.HashPassword(SecureTokens.NewToken()),
                Role = Roles.Member
            };
            _context.Users.Add(user);
        }
        else if (!user.IsActive)
        {
            throw Suspended();
        }

        user.PhoneVerified = true;
        await _context.SaveChangesAsync(ct);
        return await _sessions.StartAsync(user, client, ct);
    }

    public async Task<AuthResponseDto?> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _context.Users.AsNoTracking().Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        return user == null ? null : _sessions.ToResponse(user, accessToken: null);
    }

    private async Task<User?> FindByIdentifierAsync(string identifier, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(identifier)) return null;

        if (Identifiers.LooksLikeEmail(identifier))
        {
            var email = Identifiers.NormalizeEmail(identifier);
            return await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Email == email, ct);
        }

        var phone = Identifiers.NormalizePhone(identifier);
        return phone == null
            ? null
            : await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.PhoneNumber == phone, ct);
    }

    private static AppException InvalidCredentials() =>
        new(401, ErrorCodes.InvalidCredentials, "Invalid email, mobile number or password.");

    private static AppException Suspended() =>
        new(403, ErrorCodes.AccountSuspended, "This account is suspended. Please contact support.");
}
