using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Sign-up by mobile (2026-11-14 registration data fix).</summary>
public class RegistrationTests
{
    private const string Phone = "+94775551234";
    private static readonly ClientInfo Client = new("127.0.0.1", "tests");

    private sealed class NoGoogle : IGoogleTokenValidator
    {
        public Task<GoogleIdentity?> ValidateAsync(string token, CancellationToken ct = default) => Task.FromResult<GoogleIdentity?>(null);
    }

    private static (AuthService Auth, CapturingSmsSender Sms) Create(Infrastructure.Persistence.ApplicationDbContext db)
    {
        var sms = new CapturingSmsSender();
        var otp = new OtpService(db, sms, new NoEmailSender());
        var auth = new AuthService(db, new PasswordHasher(), new NoGoogle(), otp, new SessionService(db, new FakeJwt()));
        return (auth, sms);
    }

    [Fact]
    public async Task Mobile_sign_up_stores_no_email_and_gives_no_session_until_the_code_is_confirmed()
    {
        using var db = TestDb.Create();
        var (auth, sms) = Create(db);

        var outcome = await auth.RegisterAsync(new RegisterDto { PhoneNumber = "0775551234", Password = "Secret123" }, Client);

        Assert.Null(outcome.Session);
        var user = await db.Users.SingleAsync();
        Assert.Null(user.Email);
        Assert.False(user.PhoneVerified);

        // logging in before verifying is refused
        var login = await Assert.ThrowsAsync<AppException>(() =>
            auth.LoginAsync(new LoginDto { Email = Phone, Password = "Secret123" }, Client));
        Assert.Equal(ErrorCodes.PhoneNotVerified, login.Code);

        await auth.SendOtpAsync(new SendOtpDto { PhoneNumber = Phone });
        var session = await auth.VerifyOtpAsync(new VerifyOtpDto { PhoneNumber = Phone, OtpCode = sms.LastCode }, Client);

        Assert.Equal(user.Id, session.Response.UserId);
        Assert.True((await db.Users.SingleAsync()).PhoneVerified);
        Assert.Equal(string.Empty, session.Response.Email);
    }

    [Fact]
    public async Task An_abandoned_sign_up_does_not_block_the_number()
    {
        using var db = TestDb.Create();
        var (auth, _) = Create(db);

        await auth.RegisterAsync(new RegisterDto { PhoneNumber = Phone, Password = "Secret123" }, Client);
        await auth.RegisterAsync(new RegisterDto { PhoneNumber = Phone, Password = "Another456" }, Client);

        Assert.Equal(1, await db.Users.CountAsync());
    }

    [Fact]
    public async Task A_verified_number_cannot_be_registered_again()
    {
        using var db = TestDb.Create();
        var (auth, sms) = Create(db);
        await auth.RegisterAsync(new RegisterDto { PhoneNumber = Phone, Password = "Secret123" }, Client);
        await auth.SendOtpAsync(new SendOtpDto { PhoneNumber = Phone });
        await auth.VerifyOtpAsync(new VerifyOtpDto { PhoneNumber = Phone, OtpCode = sms.LastCode }, Client);

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            auth.RegisterAsync(new RegisterDto { PhoneNumber = Phone, Password = "Another456" }, Client));

        Assert.Equal(409, ex.Status);
    }
}
