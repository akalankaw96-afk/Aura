using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

public class ProfilesController : BaseApiController
{
    private readonly IProfileService _profileService;
    private readonly IReviewService _review;

    public ProfilesController(IProfileService profileService, IReviewService review)
    {
        _profileService = profileService;
        _review = review;
    }

    /// <summary>Review status of the caller's profile: status, flagged fields, what is still missing (S02-T02).</summary>
    [Authorize]
    [HttpGet("me/status")]
    [ProducesResponseType(typeof(ProfileStatusDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyStatus(CancellationToken ct) =>
        Ok(await _review.GetStatusAsync(RequireUserId(), ct));

    /// <summary>Submit (or resubmit after changes) for review. 400 with <c>missing</c> when something is still needed.</summary>
    [Authorize]
    [HttpPost("me/submit")]
    [ProducesResponseType(typeof(ProfileStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Submit(CancellationToken ct) =>
        Ok(await _review.SubmitAsync(RequireUserId(), ct));

    [HttpGet]
    [ProducesResponseType(typeof(List<ProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfiles([FromQuery] ProfileFilterDto filter, CancellationToken ct)
    {
        var profiles = await _profileService.GetProfilesAsync(filter, ct, includeMemberDetails: CurrentUserId.HasValue);
        return Ok(profiles);
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        var profile = await _profileService.GetProfileByUserIdAsync(RequireUserId(), ct)
            ?? throw AppException.NotFound("You have not created a candidate profile yet.");

        return Ok(profile);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfileById(Guid id, CancellationToken ct)
    {
        var profile = await _profileService.GetProfileByIdAsync(id, ct, includeMemberDetails: CurrentUserId.HasValue);
        if (profile == null) throw AppException.NotFound("This profile was not found.");

        return Ok(profile);
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateOrUpdateProfile([FromBody] CreateProfileDto dto, CancellationToken ct)
    {
        var profile = await _profileService.CreateOrUpdateProfileAsync(RequireUserId(), dto, ct);
        return Ok(profile);
    }
}
