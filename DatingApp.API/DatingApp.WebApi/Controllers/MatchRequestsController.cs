using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>Interests between members. Errors are AppExceptions → ProblemDetails (S01-T11).</summary>
[Authorize]
[Route("api/[controller]")]
[Route("api/match-requests")]
public class MatchRequestsController : BaseApiController
{
    private readonly IMatchRequestService _matchRequestService;
    private readonly IAuthService _authService;

    public MatchRequestsController(IMatchRequestService matchRequestService, IAuthService authService)
    {
        _matchRequestService = matchRequestService;
        _authService = authService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(MatchRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status402PaymentRequired)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SendRequest([FromBody] CreateMatchRequestDto dto, CancellationToken ct)
    {
        var profileId = await RequireProfileIdAsync(ct)
            ?? throw AppException.Forbidden("Create your profile before you send interests.", ErrorCodes.ProfileRequired);

        return Ok(await _matchRequestService.SendRequestAsync(profileId, dto, ct));
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(List<MatchRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyRequests(CancellationToken ct)
    {
        var profileId = await RequireProfileIdAsync(ct);
        if (profileId == null) return Ok(new List<MatchRequestDto>());

        return Ok(await _matchRequestService.GetMyRequestsAsync(profileId.Value, ct));
    }

    /// <summary>Interests in one box: received (waiting for your answer) · sent · matched (S03-T05).</summary>
    [HttpGet("received")]
    [ProducesResponseType(typeof(List<InterestDto>), StatusCodes.Status200OK)]
    public Task<IActionResult> Received(CancellationToken ct) => ListAsync("received", ct);

    [HttpGet("sent")]
    [ProducesResponseType(typeof(List<InterestDto>), StatusCodes.Status200OK)]
    public Task<IActionResult> Sent(CancellationToken ct) => ListAsync("sent", ct);

    [HttpGet("matched")]
    [ProducesResponseType(typeof(List<InterestDto>), StatusCodes.Status200OK)]
    public Task<IActionResult> Matched(CancellationToken ct) => ListAsync("matched", ct);

    /// <summary>Take back an interest that has not been answered yet. The month's interest count is not refunded.</summary>
    [HttpPut("{id:guid}/withdraw")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Withdraw(Guid id, CancellationToken ct)
    {
        var profileId = await RequireProfileIdAsync(ct)
            ?? throw AppException.Forbidden("Create your profile first.", ErrorCodes.ProfileRequired);

        await _matchRequestService.WithdrawAsync(id, profileId, ct);
        return Ok(new { message = "Interest withdrawn." });
    }

    [HttpPut("{id:guid}/respond")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Respond(Guid id, [FromBody] RespondMatchRequestDto dto, CancellationToken ct)
    {
        var profileId = await RequireProfileIdAsync(ct)
            ?? throw AppException.Forbidden("Create your profile first.", ErrorCodes.ProfileRequired);

        await _matchRequestService.RespondRequestAsync(id, profileId, dto.Accept, ct);
        return Ok(new { message = dto.Accept ? "Request accepted!" : "Request declined." });
    }

    private async Task<IActionResult> ListAsync(string box, CancellationToken ct)
    {
        var profileId = await RequireProfileIdAsync(ct);
        if (profileId == null) return Ok(new List<InterestDto>());
        return Ok(await _matchRequestService.ListAsync(profileId.Value, box, ct));
    }

    /// <summary>The caller's profile id, or null when they have not created one yet.</summary>
    private async Task<Guid?> RequireProfileIdAsync(CancellationToken ct)
    {
        var currentUser = await _authService.GetCurrentUserAsync(RequireUserId(), ct)
            ?? throw AppException.Unauthenticated();
        return currentUser.ProfileId;
    }
}
