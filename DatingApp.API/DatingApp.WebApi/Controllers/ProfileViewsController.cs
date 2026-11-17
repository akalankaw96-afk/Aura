using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>Profile views (S03-T04). Views are recorded by <c>GET /api/profiles/{id}</c>.</summary>
[Authorize]
[Route("api/profile-views")]
public class ProfileViewsController : BaseApiController
{
    private readonly IProfileViewService _views;

    public ProfileViewsController(IProfileViewService views)
    {
        _views = views;
    }

    /// <summary>Who viewed my profile. Gold / Platinum get the list; Free gets <c>total</c> with <c>locked: true</c>.</summary>
    [HttpGet("viewers")]
    [ProducesResponseType(typeof(ProfileViewersDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Viewers(CancellationToken ct) => Ok(await _views.GetViewersAsync(RequireUserId(), ct));

    /// <summary>Profiles I opened recently (approved only), newest first.</summary>
    [HttpGet("recent")]
    [ProducesResponseType(typeof(List<ProfileViewItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Recent([FromQuery] int take = 20, CancellationToken ct = default) =>
        Ok(await _views.GetRecentAsync(RequireUserId(), take, ct));
}
