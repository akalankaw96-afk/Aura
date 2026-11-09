using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<AdminDashboardStatsDto>> GetStats(CancellationToken ct)
    {
        var stats = await _adminService.GetDashboardStatsAsync(ct);
        return Ok(stats);
    }

    [HttpGet("profiles")]
    public async Task<ActionResult<List<PendingProfileAdminDto>>> GetPendingProfiles(CancellationToken ct)
    {
        var profiles = await _adminService.GetPendingProfilesAsync(ct);
        return Ok(profiles);
    }

    [HttpPost("profiles/{id:guid}/approve")]
    public async Task<ActionResult<AdminActionResponse>> ApproveProfile(Guid id, [FromQuery] string staffName = "Admin", CancellationToken ct = default)
    {
        var result = await _adminService.ApproveProfileAsync(id, staffName, ct);
        return Ok(result);
    }

    [HttpPost("profiles/{id:guid}/reject")]
    public async Task<ActionResult<AdminActionResponse>> RejectProfile(Guid id, [FromBody] RejectReasonRequest req, [FromQuery] string staffName = "Admin", CancellationToken ct = default)
    {
        var result = await _adminService.RejectProfileAsync(id, req.Reason, staffName, ct);
        return Ok(result);
    }

    [HttpGet("safety")]
    public async Task<ActionResult<List<SafetyReportAdminDto>>> GetSafetyReports(CancellationToken ct)
    {
        var reports = await _adminService.GetSafetyReportsAsync(ct);
        return Ok(reports);
    }

    [HttpPost("safety/{id}/warn")]
    public async Task<ActionResult<AdminActionResponse>> WarnUser(string id, [FromQuery] string staffName = "SafetyOfficer", CancellationToken ct = default)
    {
        var result = await _adminService.WarnUserAsync(id, staffName, ct);
        return Ok(result);
    }

    [HttpPost("safety/{id}/ban")]
    public async Task<ActionResult<AdminActionResponse>> BanUser(string id, [FromQuery] string staffName = "SafetyOfficer", CancellationToken ct = default)
    {
        var result = await _adminService.BanUserAsync(id, staffName, ct);
        return Ok(result);
    }

    [HttpPost("safety/{id}/dismiss")]
    public async Task<ActionResult<AdminActionResponse>> DismissReport(string id, [FromQuery] string staffName = "SafetyOfficer", CancellationToken ct = default)
    {
        var result = await _adminService.DismissReportAsync(id, staffName, ct);
        return Ok(result);
    }

    [HttpGet("finance")]
    public async Task<ActionResult<List<FinanceSlipAdminDto>>> GetFinanceSlips(CancellationToken ct)
    {
        var slips = await _adminService.GetFinanceSlipsAsync(ct);
        return Ok(slips);
    }

    [HttpPost("finance/{id}/approve")]
    public async Task<ActionResult<AdminActionResponse>> ApproveSlip(string id, [FromQuery] string staffName = "FinanceManager", CancellationToken ct = default)
    {
        var result = await _adminService.ApproveSlipAsync(id, staffName, ct);
        return Ok(result);
    }

    [HttpPost("finance/{id}/reject")]
    public async Task<ActionResult<AdminActionResponse>> RejectSlip(string id, [FromBody] RejectReasonRequest req, [FromQuery] string staffName = "FinanceManager", CancellationToken ct = default)
    {
        var result = await _adminService.RejectSlipAsync(id, req.Reason, staffName, ct);
        return Ok(result);
    }

    [HttpGet("support")]
    public async Task<ActionResult<List<SupportTicketAdminDto>>> GetSupportTickets(CancellationToken ct)
    {
        var tickets = await _adminService.GetSupportTicketsAsync(ct);
        return Ok(tickets);
    }

    [HttpPost("support/{id}/resolve")]
    public async Task<ActionResult<AdminActionResponse>> ResolveTicket(string id, [FromQuery] string staffName = "SupportSpecialist", CancellationToken ct = default)
    {
        var result = await _adminService.ResolveTicketAsync(id, staffName, ct);
        return Ok(result);
    }

    [HttpGet("audit")]
    public async Task<ActionResult<List<AuditLogEntryDto>>> GetAuditLogs(CancellationToken ct)
    {
        var logs = await _adminService.GetAuditLogsAsync(ct);
        return Ok(logs);
    }
}

