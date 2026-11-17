using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>Shortlist / favourites (S03-T06).</summary>
[Authorize]
[Route("api/shortlist")]
public class ShortlistController : BaseApiController
{
    private readonly IShortlistService _shortlist;

    public ShortlistController(IShortlistService shortlist)
    {
        _shortlist = shortlist;
    }

    /// <summary>My shortlisted profiles (approved, not blocked), newest first.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ShortlistItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await _shortlist.ListAsync(RequireUserId(), ct));

    /// <summary>Add a profile (doing it twice is fine).</summary>
    [HttpPut("{profileId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Add(Guid profileId, CancellationToken ct)
    {
        await _shortlist.AddAsync(RequireUserId(), profileId, ct);
        return NoContent();
    }

    [HttpDelete("{profileId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Remove(Guid profileId, CancellationToken ct)
    {
        await _shortlist.RemoveAsync(RequireUserId(), profileId, ct);
        return NoContent();
    }
}

/// <summary>Saved searches (S03-T06). Run one with <c>GET /api/profiles/search</c> and its filters.</summary>
[Authorize]
[Route("api/saved-searches")]
public class SavedSearchesController : BaseApiController
{
    private readonly ISavedSearchService _saved;

    public SavedSearchesController(ISavedSearchService saved)
    {
        _saved = saved;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<SavedSearchDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await _saved.ListAsync(RequireUserId(), ct));

    /// <summary>Save filters under a name (1–60 characters, unique for you; up to 10 saved searches).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(SavedSearchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateSavedSearchDto dto, CancellationToken ct) =>
        Ok(await _saved.CreateAsync(RequireUserId(), dto, ct));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _saved.DeleteAsync(RequireUserId(), id, ct);
        return NoContent();
    }
}

/// <summary>
/// Blocking (S03-T07). A blocked member can't message you, see your profile or find you in search — and isn't told.
/// Waiting interests between you end; an accepted match is kept so unblocking restores the chat.
/// </summary>
[Authorize]
[Route("api/blocks")]
public class BlocksController : BaseApiController
{
    private readonly ISafetyService _safety;

    public BlocksController(ISafetyService safety)
    {
        _safety = safety;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<BlockedMemberDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await _safety.ListBlockedAsync(RequireUserId(), ct));

    [HttpPut("{profileId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Block(Guid profileId, [FromBody] BlockMemberDto? dto, CancellationToken ct)
    {
        await _safety.BlockAsync(RequireUserId(), profileId, dto?.Reason, ct);
        return NoContent();
    }

    [HttpDelete("{profileId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Unblock(Guid profileId, CancellationToken ct)
    {
        await _safety.UnblockAsync(RequireUserId(), profileId, ct);
        return NoContent();
    }
}

/// <summary>Report a member to the safety team (S03-T07). Staff handle reports in the staff area (S03-T08).</summary>
[Authorize]
[Route("api/reports")]
public class ReportsController : BaseApiController
{
    private readonly ISafetyService _safety;

    public ReportsController(ISafetyService safety)
    {
        _safety = safety;
    }

    /// <summary>reason: Scam · Inappropriate · FakeProfile · Other (Other needs details). One open report per member you report.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateReportDto dto, CancellationToken ct) =>
        Ok(await _safety.ReportAsync(RequireUserId(), dto, ct));
}
