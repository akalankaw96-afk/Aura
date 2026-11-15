using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.WebApi.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>Moderator queue and decisions (S02-T06). Admin and Moderator only.</summary>
[Authorize(Policy = Policies.Staff)]
[Route("api/moderation")]
public class ModerationController : BaseApiController
{
    private readonly IModerationService _moderation;

    public ModerationController(IModerationService moderation)
    {
        _moderation = moderation;
    }

    /// <summary>Profiles waiting for review, oldest first.</summary>
    [HttpGet("queue")]
    [ProducesResponseType(typeof(List<ReviewQueueItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Queue(CancellationToken ct) => Ok(await _moderation.GetQueueAsync(ct));

    /// <summary>One profile with photos, documents (metadata — files via /api/kyc/documents/{id}/file), open flags and history.</summary>
    [HttpGet("profiles/{id:guid}")]
    [ProducesResponseType(typeof(ProfileReviewDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Profile(Guid id, CancellationToken ct) => Ok(await _moderation.GetProfileAsync(id, ct));

    [HttpPost("profiles/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ReviewDecisionDto? dto, CancellationToken ct)
    {
        await _moderation.ApproveAsync(id, RequireUserId(), dto?.Note, ct);
        return NoContent();
    }

    [HttpPost("profiles/{id:guid}/request-changes")]
    public async Task<IActionResult> RequestChanges(Guid id, [FromBody] RequestChangesDto dto, CancellationToken ct)
    {
        await _moderation.RequestChangesAsync(id, RequireUserId(), dto, ct);
        return NoContent();
    }

    [HttpPost("profiles/{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id, [FromBody] ReviewDecisionDto dto, CancellationToken ct)
    {
        await _moderation.SuspendAsync(id, RequireUserId(), dto.Note, ct);
        return NoContent();
    }

    [HttpPost("profiles/{id:guid}/reinstate")]
    public async Task<IActionResult> Reinstate(Guid id, [FromBody] ReviewDecisionDto? dto, CancellationToken ct)
    {
        await _moderation.ReinstateAsync(id, RequireUserId(), dto?.Note, ct);
        return NoContent();
    }

    /// <summary>New photos from approved members.</summary>
    [HttpGet("photos/pending")]
    [ProducesResponseType(typeof(List<PendingPhotoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PendingPhotos(CancellationToken ct) => Ok(await _moderation.GetPendingPhotosAsync(ct));

    [HttpPost("photos/{id:guid}/approve")]
    public async Task<IActionResult> ApprovePhoto(Guid id, CancellationToken ct)
    {
        await _moderation.ApprovePhotoAsync(id, RequireUserId(), ct);
        return NoContent();
    }

    [HttpPost("photos/{id:guid}/reject")]
    public async Task<IActionResult> RejectPhoto(Guid id, [FromBody] RejectPhotoDto dto, CancellationToken ct)
    {
        await _moderation.RejectPhotoAsync(id, RequireUserId(), dto.Reason, ct);
        return NoContent();
    }
}

/// <summary>Staff management (S02-T08). Admin only.</summary>
[Authorize(Policy = Policies.Admin)]
[Route("api/admin")]
public class AdminController : BaseApiController
{
    private readonly IStaffService _staff;

    public AdminController(IStaffService staff)
    {
        _staff = staff;
    }

    [HttpGet("staff")]
    [ProducesResponseType(typeof(List<StaffUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Staff(CancellationToken ct) => Ok(await _staff.ListStaffAsync(ct));

    /// <summary>Find a member by mobile number (to promote them).</summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(StaffUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FindUser([FromQuery] string phone, CancellationToken ct)
    {
        var user = await _staff.FindByPhoneAsync(phone, ct);
        return user == null ? Problem(title: "No member with that number.", statusCode: StatusCodes.Status404NotFound) : Ok(user);
    }

    /// <summary>Make a member a Moderator, or back to Member. Their sessions end so the new role applies at once.</summary>
    [HttpPut("users/{id:guid}/role")]
    [ProducesResponseType(typeof(StaffUserDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ChangeRole(Guid id, [FromBody] ChangeRoleDto dto, CancellationToken ct) =>
        Ok(await _staff.ChangeRoleAsync(RequireUserId(), id, dto.Role, ct));
}

/// <summary>The signed-in member's notifications (S02-T12).</summary>
[Authorize]
[Route("api/notifications")]
public class NotificationsController : BaseApiController
{
    private readonly INotificationService _notifications;

    public NotificationsController(INotificationService notifications)
    {
        _notifications = notifications;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<NotificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List([FromQuery] int take = 30, CancellationToken ct = default) =>
        Ok(await _notifications.ListAsync(RequireUserId(), take, ct));

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken ct) =>
        Ok(new { count = await _notifications.UnreadCountAsync(RequireUserId(), ct) });

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> Read(Guid id, CancellationToken ct)
    {
        await _notifications.MarkReadAsync(RequireUserId(), id, ct);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll(CancellationToken ct)
    {
        await _notifications.MarkAllReadAsync(RequireUserId(), ct);
        return NoContent();
    }
}
