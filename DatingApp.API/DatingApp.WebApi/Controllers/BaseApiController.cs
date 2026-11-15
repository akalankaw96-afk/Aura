using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Services;
using DatingApp.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DatingApp.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>The signed-in member, from the JWT only — never from the request body or URL.</summary>
    protected Guid? CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(idClaim, out var id) ? id : null;
        }
    }

    /// <summary>The sign-in session this access token belongs to ("sid" claim).</summary>
    protected Guid? CurrentSessionId
    {
        get
        {
            // "sid" may be mapped to ClaimTypes.Sid by the JWT handler's inbound claim map
            var sid = User.FindFirstValue("sid") ?? User.FindFirstValue(ClaimTypes.Sid);
            return Guid.TryParse(sid, out var id) ? id : null;
        }
    }

    /// <summary>The signed-in member's id, or a 401 ProblemDetails when there is none.</summary>
    protected Guid RequireUserId() => CurrentUserId ?? throw AppException.Unauthenticated();

    /// <summary>The caller for file access checks: signed-in user (if any) and whether they are Admin / Moderator.</summary>
    protected Viewer CurrentViewer =>
        new(CurrentUserId, User.IsInRole(Roles.Admin) || User.IsInRole(Roles.Moderator));

    protected ClientInfo Client => new(
        HttpContext.Connection.RemoteIpAddress?.ToString(),
        Request.Headers.UserAgent.ToString());
}
