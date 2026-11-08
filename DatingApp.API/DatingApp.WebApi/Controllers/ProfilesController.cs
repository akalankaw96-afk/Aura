using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

public class ProfilesController : BaseApiController
{
    private readonly IProfileService _profileService;

    public ProfilesController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<ProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfiles([FromQuery] ProfileFilterDto filter, CancellationToken ct)
    {
        var profiles = await _profileService.GetProfilesAsync(filter, ct);
        return Ok(profiles);
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        if (!CurrentUserId.HasValue) return Unauthorized();

        var profile = await _profileService.GetProfileByUserIdAsync(CurrentUserId.Value, ct);
        if (profile == null) return NotFound(new { message = "You have not created a candidate profile yet." });

        return Ok(profile);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfileById(Guid id, CancellationToken ct)
    {
        var profile = await _profileService.GetProfileByIdAsync(id, ct);
        if (profile == null) return NotFound(new { message = $"Profile with ID {id} was not found." });

        return Ok(profile);
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateOrUpdateProfile([FromBody] CreateProfileDto dto, CancellationToken ct)
    {
        if (!CurrentUserId.HasValue) return Unauthorized();

        var profile = await _profileService.CreateOrUpdateProfileAsync(CurrentUserId.Value, dto, ct);
        return Ok(profile);
    }
}
