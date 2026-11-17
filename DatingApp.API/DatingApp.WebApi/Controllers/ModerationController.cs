using DatingApp.Application.Common.Exceptions;
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
    private readonly IReportQueueService _reports;

    public ModerationController(IModerationService moderation, IReportQueueService reports)
    {
        _moderation = moderation;
        _reports = reports;
    }

    /// <summary>Member reports (S03-T08). status = open (default, oldest first) · closed · all.</summary>
    [HttpGet("reports")]
    [ProducesResponseType(typeof(List<ReportQueueItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Reports([FromQuery] string? status, CancellationToken ct) => Ok(await _reports.ListAsync(status, ct));

    /// <summary>
    /// Handle a report: dismiss · action (handled without suspending) · suspend (note required; suspends the member and
    /// closes all their open reports). The reporter is told it was reviewed; the decision is kept in the profile history.
    /// </summary>
    [HttpPost("reports/{id:guid}/resolve")]
    [ProducesResponseType(typeof(ReportQueueItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ResolveReport(Guid id, [FromBody] ResolveReportDto dto, CancellationToken ct) =>
        Ok(await _reports.ResolveAsync(RequireUserId(), id, dto, ct));

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
    private readonly IUsageService _usage;
    private readonly IPricingService _pricing;
    private readonly ISubscriptionService _subscriptions;

    public AdminController(IStaffService staff, IUsageService usage, IPricingService pricing, ISubscriptionService subscriptions)
    {
        _staff = staff;
        _usage = usage;
        _pricing = pricing;
        _subscriptions = subscriptions;
    }

    /// <summary>Plan and boost prices (S04-T01), amounts in cents.</summary>
    [HttpGet("prices")]
    [ProducesResponseType(typeof(List<PlanPriceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Prices(CancellationToken ct) => Ok(await _pricing.GetPricesAsync(ct));

    /// <summary>Change prices: <c>{ prices: [{ product: plan|boost, planId, months, days, amountCents }] }</c>. Applies at once.</summary>
    [HttpPut("prices")]
    [ProducesResponseType(typeof(List<PlanPriceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePrices([FromBody] UpdatePricesDto dto, CancellationToken ct) =>
        Ok(await _pricing.UpdatePricesAsync(RequireUserId(), dto.Prices, ct));

    /// <summary>A member's plan periods (S04-T02).</summary>
    [HttpGet("members/{userId:guid}/subscriptions")]
    [ProducesResponseType(typeof(MySubscriptionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> MemberSubscriptions(Guid userId, CancellationToken ct) => Ok(await _subscriptions.GetMineAsync(userId, ct));

    /// <summary>Give a plan without a payment (complimentary or a correction). A note is required; it adds after any running period.</summary>
    [HttpPost("members/{userId:guid}/subscriptions")]
    [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GrantSubscription(Guid userId, [FromBody] GrantSubscriptionDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Note)) throw AppException.Validation("Say why this plan is given.", "note");
        return Ok(await _subscriptions.GrantAsync(userId, dto.PlanId, dto.Months, null, RequireUserId(), dto.Note, ct));
    }

    /// <summary>End a plan period early (e.g. refunded). A note is required.</summary>
    [HttpPost("subscriptions/{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CancelSubscription(Guid id, [FromBody] CancelSubscriptionDto dto, CancellationToken ct)
    {
        await _subscriptions.CancelAsync(id, RequireUserId(), dto.Note, ct);
        return NoContent();
    }

    /// <summary>Monthly limits per plan and feature (S03-T02). Null = unlimited.</summary>
    [HttpGet("plan-limits")]
    [ProducesResponseType(typeof(List<PlanLimitDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PlanLimits(CancellationToken ct) => Ok(await _usage.GetPlanLimitsAsync(ct));

    /// <summary>Change limits — applies at once to everyone on that plan.</summary>
    [HttpPut("plan-limits")]
    [ProducesResponseType(typeof(List<PlanLimitDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdatePlanLimits([FromBody] UpdatePlanLimitsDto dto, CancellationToken ct) =>
        Ok(await _usage.UpdatePlanLimitsAsync(RequireUserId(), dto.Limits, ct));

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

/// <summary>The signed-in member's own counters (S03-T03).</summary>
[Authorize]
[Route("api/me")]
public class MeController : BaseApiController
{
    private readonly IUsageService _usage;
    private readonly IDashboardService _dashboard;
    private readonly ISubscriptionService _subscriptions;

    public MeController(IUsageService usage, IDashboardService dashboard, ISubscriptionService subscriptions)
    {
        _usage = usage;
        _dashboard = dashboard;
        _subscriptions = subscriptions;
    }

    /// <summary>My plan now (free · gold · platinum), when it ends (renewals included) and my plan history (S04-T02).</summary>
    [HttpGet("subscription")]
    [ProducesResponseType(typeof(MySubscriptionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Subscription(CancellationToken ct) => Ok(await _subscriptions.GetMineAsync(RequireUserId(), ct));

    /// <summary>
    /// The dashboard in one call (S03-T09): usage, profile viewers (names for Gold / Platinum), interests, matches,
    /// members who shortlisted me, unread messages and the latest conversations.
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(DashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Dashboard(CancellationToken ct) => Ok(await _dashboard.GetAsync(RequireUserId(), ct));

    /// <summary>This month's searches / profile views / interests / new chats: used, limit (null = unlimited), reset date.</summary>
    [HttpGet("usage")]
    [ProducesResponseType(typeof(UsageDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Usage(CancellationToken ct) => Ok(await _usage.GetUsageAsync(RequireUserId(), ct));
}
