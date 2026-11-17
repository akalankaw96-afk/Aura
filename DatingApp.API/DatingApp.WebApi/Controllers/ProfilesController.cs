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
    private readonly ISearchService _search;
    private readonly IProfileViewService _views;

    public ProfilesController(IProfileService profileService, IReviewService review, ISearchService search, IProfileViewService views)
    {
        _profileService = profileService;
        _review = review;
        _search = search;
        _views = views;
    }

    /// <summary>
    /// Paged search of approved members (S03-T01): gender, ageFrom/ageTo, religion, community, location, country,
    /// profession (category or text), horoscope, q, sort (newest · ageAsc · ageDesc), page, pageSize (≤ 50).
    /// Signed-in members: page 1 counts as one search — 402 LIMIT_REACHED when the plan's monthly searches are used.
    /// Guests: first page only, without member-only details.
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(PagedResult<ProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status402PaymentRequired)]
    public async Task<IActionResult> Search([FromQuery] ProfileSearchDto filter, CancellationToken ct) =>
        Ok(await _search.SearchAsync(CurrentUserId, filter, ct));

    /// <summary>Update the "about me" text (≥ 50 characters, no phone numbers / e-mails / links).</summary>
    [Authorize]
    [HttpPatch("me/about")]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateAbout([FromBody] UpdateAboutDto dto, CancellationToken ct) =>
        Ok(await _profileService.UpdateAboutAsync(RequireUserId(), dto.Bio, ct));

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

    /// <summary>
    /// An approved profile. For signed-in members this records a view (S03-T04) and counts one profile view against
    /// the plan — 402 LIMIT_REACHED when used up. Re-opening the same profile this month, your own profile and members
    /// you share an interest with are free. Guests see the public card only.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status402PaymentRequired)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfileById(Guid id, CancellationToken ct)
    {
        var profile = await _profileService.GetProfileByIdAsync(id, ct, includeMemberDetails: CurrentUserId.HasValue);
        if (profile == null) throw AppException.NotFound("This profile was not found.");

        if (CurrentUserId.HasValue) await _views.RecordViewAsync(CurrentUserId.Value, id, ct);

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
