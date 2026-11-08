using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

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
    public async Task<IActionResult> SendRequest([FromBody] CreateMatchRequestDto dto, CancellationToken ct)
    {
        if (!CurrentUserId.HasValue) return Unauthorized();

        var currentUser = await _authService.GetCurrentUserAsync(CurrentUserId.Value, ct);
        if (currentUser?.ProfileId == null)
        {
            return BadRequest(new { message = "You must have a candidate profile to send connection requests." });
        }

        try
        {
            var result = await _matchRequestService.SendRequestAsync(currentUser.ProfileId.Value, dto, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(List<MatchRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyRequests(CancellationToken ct)
    {
        if (!CurrentUserId.HasValue) return Unauthorized();

        var currentUser = await _authService.GetCurrentUserAsync(CurrentUserId.Value, ct);
        if (currentUser?.ProfileId == null)
        {
            return Ok(new List<MatchRequestDto>());
        }

        var list = await _matchRequestService.GetMyRequestsAsync(currentUser.ProfileId.Value, ct);
        return Ok(list);
    }

    [HttpPut("{id:guid}/respond")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Respond(Guid id, [FromBody] RespondMatchRequestDto dto, CancellationToken ct)
    {
        if (!CurrentUserId.HasValue) return Unauthorized();

        var currentUser = await _authService.GetCurrentUserAsync(CurrentUserId.Value, ct);
        if (currentUser?.ProfileId == null)
        {
            return BadRequest(new { message = "Profile not found." });
        }

        var success = await _matchRequestService.RespondRequestAsync(id, currentUser.ProfileId.Value, dto.Accept, ct);
        if (!success) return NotFound(new { message = "Request not found or not addressed to you." });

        return Ok(new { message = dto.Accept ? "Request accepted!" : "Request declined." });
    }
}

