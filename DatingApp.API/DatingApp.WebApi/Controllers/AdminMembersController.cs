using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.WebApi.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>
/// Staff back office (S04-T07). Counts and the members list: Admin + Moderator. Block / deactivate / password
/// reset: Admin only. Every change goes to the audit log (who, what, when, reason).
/// </summary>
[Authorize(Policy = Policies.Staff)]
[Route("api/admin")]
public class AdminMembersController : BaseApiController
{
    private readonly IAdminMembersService _members;

    public AdminMembersController(IAdminMembersService members)
    {
        _members = members;
    }

    /// <summary>Dashboard counts (members only).</summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(AdminStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Stats(CancellationToken ct) => Ok(await _members.GetStatsAsync(ct));

    /// <summary>Members, newest first. search = name, mobile (077… or +9477…), e-mail or profile code; status = Active · PendingReview · Incomplete · Deactivated · Blocked.</summary>
    [HttpGet("members")]
    [ProducesResponseType(typeof(PagedResult<AdminMemberDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Members([FromQuery] string? search, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default) =>
        Ok(await _members.ListAsync(search, status, page, pageSize, ct));

    /// <summary>
    /// activate · deactivate · block · unblock (reason required to deactivate / block). Block: can't sign in, profile
    /// hidden. Deactivate: profile hidden until the member signs in again. Both end the member's sessions.
    /// </summary>
    [Authorize(Policy = Policies.Admin)]
    [HttpPost("members/{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] MemberStatusDto dto, CancellationToken ct)
    {
        await _members.SetStatusAsync(RequireUserId(), id, dto, ct);
        return NoContent();
    }

    /// <summary>Ends the member's sessions and makes the old password stop working; they get an SMS to set a new one with "Forgot password".</summary>
    [Authorize(Policy = Policies.Admin)]
    [HttpPost("members/{id:guid}/reset-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword(Guid id, CancellationToken ct)
    {
        await _members.ResetPasswordAsync(RequireUserId(), id, ct);
        return NoContent();
    }
}
