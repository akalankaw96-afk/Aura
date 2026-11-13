using DatingApp.Application.DTOs;
using DatingApp.WebApi.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DatingApp.WebApi.Controllers;

/// <summary>Passwords and devices (API spec group A, endpoints 9–14).</summary>
public partial class AuthController
{
    /// <summary>#9 Send a reset code by e-mail or SMS. Always 202 — never reveals whether the account exists.</summary>
    [HttpPost("forgot-password")]
    [EnableRateLimiting(RateLimits.Codes)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto, CancellationToken ct)
    {
        await _passwords.RequestResetAsync(dto, ct);
        return Accepted();
    }

    /// <summary>#10 Check the reset code → single-use reset token (10 minutes). 400 carries code + attemptsLeft.</summary>
    [HttpPost("forgot-password/verify")]
    [EnableRateLimiting(RateLimits.Auth)]
    [ProducesResponseType(typeof(ResetTokenResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ResetTokenResponseDto>> VerifyResetCode([FromBody] VerifyResetCodeDto dto, CancellationToken ct) =>
        Ok(await _passwords.VerifyResetCodeAsync(dto, ct));

    /// <summary>#11 Set a new password with the reset token. Signs out every device.</summary>
    [HttpPost("reset-password")]
    [EnableRateLimiting(RateLimits.Auth)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto, CancellationToken ct)
    {
        await _passwords.ResetPasswordAsync(dto, ct);
        return NoContent();
    }

    /// <summary>#12 Change password while signed in. Other devices are signed out; this one stays in.</summary>
    [Authorize]
    [HttpPost("change-password")]
    [EnableRateLimiting(RateLimits.Auth)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto, CancellationToken ct)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        await _passwords.ChangePasswordAsync(userId, CurrentSessionId, dto, ct);
        return NoContent();
    }

    /// <summary>#13 Devices where the member is signed in.</summary>
    [Authorize]
    [HttpGet("sessions")]
    [ProducesResponseType(typeof(IReadOnlyList<SessionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SessionDto>>> Sessions(CancellationToken ct)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        return Ok(await _sessions.ListAsync(userId, CurrentSessionId, ct));
    }

    /// <summary>#14 Sign out one device. Only the member's own sessions can be ended.</summary>
    [Authorize]
    [HttpDelete("sessions/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeSession(Guid id, CancellationToken ct)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        await _sessions.RevokeAsync(userId, id, ct);
        return NoContent();
    }
}
