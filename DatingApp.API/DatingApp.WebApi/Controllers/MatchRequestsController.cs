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

    /// <summary>The caller's profile id, or null when they have not created one yet.</summary>
    private async Task<Guid?> RequireProfileIdAsync(CancellationToken ct)
    {
        var currentUser = await _authService.GetCurrentUserAsync(RequireUserId(), ct)
            ?? throw AppException.Unauthenticated();
        return currentUser.ProfileId;
    }
}
