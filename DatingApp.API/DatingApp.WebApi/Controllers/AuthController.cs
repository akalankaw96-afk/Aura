using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.WebApi.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DatingApp.WebApi.Controllers;

/// <summary>
/// Auth API (spec group A). This file: sign-up, sign-in and sessions (#1–8).
/// AuthController.Passwords.cs: passwords and devices (#9–14).
/// Errors are thrown as AppException and returned as ProblemDetails by AppExceptionHandler.
/// </summary>
public partial class AuthController : BaseApiController
{
    private readonly IAuthService _auth;
    private readonly ISessionService _sessions;
    private readonly IPasswordService _passwords;
    private readonly AuthCookieSettings _cookie;

    public AuthController(IAuthService auth, ISessionService sessions, IPasswordService passwords, AuthCookieSettings cookie)
    {
        _auth = auth;
        _sessions = sessions;
        _passwords = passwords;
        _cookie = cookie;
    }

    /// <summary>#1 Create an account with e-mail + password (mobile optional).</summary>
    [HttpPost("register")]
    [EnableRateLimiting(RateLimits.Auth)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto, CancellationToken ct) =>
        SignedIn(await _auth.RegisterAsync(dto, Client, ct));

    /// <summary>#2 Log in with e-mail or mobile number + password. 5 wrong tries lock the account for 15 minutes.</summary>
    [HttpPost("login")]
    [EnableRateLimiting(RateLimits.Auth)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto, CancellationToken ct) =>
        SignedIn(await _auth.LoginAsync(dto, Client, ct));

    /// <summary>#3 Sign in with Google. The token is verified with Google; the e-mail is never taken from the body.</summary>
    [HttpPost("google-login")]
    [EnableRateLimiting(RateLimits.Auth)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> GoogleLogin([FromBody] GoogleLoginDto dto, CancellationToken ct) =>
        SignedIn(await _auth.GoogleLoginAsync(dto, Client, ct));

    /// <summary>#4 Send a 6-digit code by SMS. The code is never in the response.</summary>
    [HttpPost("send-otp")]
    [EnableRateLimiting(RateLimits.Codes)]
    [ProducesResponseType(typeof(OtpResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<OtpResponseDto>> SendOtp([FromBody] SendOtpDto dto, CancellationToken ct) =>
        Ok(await _auth.SendOtpAsync(dto, ct));

    /// <summary>#5 Check the SMS code; signs the member in (creates the account on first use).</summary>
    [HttpPost("verify-otp")]
    [EnableRateLimiting(RateLimits.Auth)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> VerifyOtp([FromBody] VerifyOtpDto dto, CancellationToken ct) =>
        SignedIn(await _auth.VerifyOtpAsync(dto, Client, ct));

    /// <summary>#6 The signed-in member.</summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Me(CancellationToken ct)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        var user = await _auth.GetCurrentUserAsync(userId, ct);
        if (user == null) return Unauthorized();
        return Ok(user);
    }

    /// <summary>#7 New access token from the refresh cookie. The refresh token rotates on every call.</summary>
    [HttpPost("refresh")]
    [EnableRateLimiting(RateLimits.Auth)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Refresh(CancellationToken ct)
    {
        try
        {
            return SignedIn(await _sessions.RefreshAsync(RefreshCookie.Read(Request), Client, ct));
        }
        catch
        {
            RefreshCookie.Clear(Response, _cookie.SameSite);
            throw;
        }
    }

    /// <summary>#8 Log out: ends this session on the server and clears the cookie. Always 204.</summary>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        await _sessions.EndAsync(RefreshCookie.Read(Request), ct);
        RefreshCookie.Clear(Response, _cookie.SameSite);
        return NoContent();
    }

    private ActionResult<AuthResponseDto> SignedIn(AuthResult result)
    {
        RefreshCookie.Write(Response, result.RefreshToken, result.RefreshTokenExpiresAt, _cookie.SameSite);
        return Ok(result.Response);
    }
}
