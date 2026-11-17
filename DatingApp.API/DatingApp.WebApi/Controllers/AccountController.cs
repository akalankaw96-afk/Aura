using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.WebApi.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>The member's own account (S04-T08): take a break (hide the profile) and delete the account.</summary>
[Authorize]
[Route("api/account")]
public class AccountController : BaseApiController
{
    private readonly IAccountService _account;
    private readonly AuthCookieSettings _cookie;

    public AccountController(IAccountService account, AuthCookieSettings cookie)
    {
        _account = account;
        _cookie = cookie;
    }

    /// <summary>Hide or show the profile in search and best matches. Friends, chats and the plan stay. The session's <c>profileHidden</c> follows.</summary>
    [HttpPost("visibility")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Visibility([FromBody] AccountVisibilityDto dto, CancellationToken ct)
    {
        await _account.SetVisibilityAsync(RequireUserId(), dto.Hidden, ct);
        return NoContent();
    }

    /// <summary>SMS code to the verified mobile (6 digits, 60 s between sends, 5 tries).</summary>
    [HttpPost("delete/send-code")]
    [ProducesResponseType(typeof(OtpResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> SendDeleteCode(CancellationToken ct) => Ok(await _account.SendDeleteCodeAsync(RequireUserId(), ct));

    /// <summary>
    /// Deletes the account with the SMS code: profile hidden at once, every session ended, sign-in refused, personal
    /// data erased after 30 days (payment records kept). 400 CODE_INVALID · CODE_EXPIRED · TOO_MANY_ATTEMPTS with attemptsLeft.
    /// </summary>
    [HttpPost("delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete([FromBody] DeleteAccountDto dto, CancellationToken ct)
    {
        await _account.DeleteAsync(RequireUserId(), dto, ct);
        RefreshCookie.Clear(Response, _cookie.SameSite);
        return NoContent();
    }
}
