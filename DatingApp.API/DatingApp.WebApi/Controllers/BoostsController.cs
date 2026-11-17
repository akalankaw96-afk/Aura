using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>Profile boosts (S04-T05). Buying one: POST /api/payments/bank-transfer with product "boost".</summary>
[Authorize]
[Route("api/boosts")]
public class BoostsController : BaseApiController
{
    private readonly IBoostService _boosts;

    public BoostsController(IBoostService boosts)
    {
        _boosts = boosts;
    }

    /// <summary>My promotion: active, start / end (extensions included), days left, views and interests since it started.</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(BoostStatusDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Me(CancellationToken ct) => Ok(await _boosts.GetMineAsync(RequireUserId(), ct));
}
