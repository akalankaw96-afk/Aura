using DatingApp.Application.Common.Files;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.WebApi.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>
/// Bank-transfer payments (S04-T03). 1) POST bank-transfer → order with amount + reference, 2) the member transfers,
/// 3) POST {id}/receipt (multipart) → waits for staff. Receipts are private: owner and staff only.
/// </summary>
[Authorize]
[Route("api/payments")]
public class PaymentsController : BaseApiController
{
    private const long UploadLimit = FileRules.MaxReceiptBytes + 64 * 1024;
    private readonly IPaymentService _payments;
    private readonly IConfiguration _configuration;

    public PaymentsController(IPaymentService payments, IConfiguration configuration)
    {
        _payments = payments;
        _configuration = configuration;
    }

    /// <summary>
    /// Every bank account and QR code members can pay with — from configuration ("BankTransfer:Accounts" and
    /// "BankTransfer:QrCodes"), so they can change without a release. The older single-account layout
    /// ("BankTransfer:BankName" …) still works and comes back as one account.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("methods")]
    [ProducesResponseType(typeof(PaymentMethodsDto), StatusCodes.Status200OK)]
    public IActionResult Methods() => Ok(ReadPaymentMethods());

    /// <summary>Our first bank account (kept for older app versions; new clients use GET methods).</summary>
    [AllowAnonymous]
    [HttpGet("bank-account")]
    [ProducesResponseType(typeof(BankAccountDto), StatusCodes.Status200OK)]
    public IActionResult BankAccount() => Ok(ReadPaymentMethods().Accounts.FirstOrDefault() ?? new BankAccountDto());

    private PaymentMethodsDto ReadPaymentMethods()
    {
        var section = _configuration.GetSection("BankTransfer");
        var accounts = section.GetSection("Accounts").Get<List<BankAccountDto>>() ?? new List<BankAccountDto>();
        if (accounts.Count == 0)
        {
            var single = section.Get<BankAccountDto>();
            if (single != null && !string.IsNullOrWhiteSpace(single.AccountNumber)) accounts.Add(single);
        }

        var qrCodes = (section.GetSection("QrCodes").Get<List<PaymentQrDto>>() ?? new List<PaymentQrDto>())
            .Where(q => !string.IsNullOrWhiteSpace(q.Name))
            .ToList();
        // only our own files or https images reach the page
        foreach (var q in qrCodes)
        {
            var url = q.ImageUrl?.Trim() ?? string.Empty;
            var safe = (url.StartsWith('/') && !url.StartsWith("//")) || url.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
            q.ImageUrl = safe ? url : string.Empty;
        }

        return new PaymentMethodsDto
        {
            Accounts = accounts.Where(a => !string.IsNullOrWhiteSpace(a.AccountNumber)).ToList(),
            QrCodes = qrCodes,
        };
    }

    /// <summary>
    /// Start a Gold / Platinum order, or get the open one for the same plan and length. The amount comes from the price
    /// list. A different choice replaces an order that has no receipt yet. 409 PAYMENT_UNDER_REVIEW while a receipt is
    /// being checked.
    /// </summary>
    [HttpPost("bank-transfer")]
    [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateBankTransfer([FromBody] CreateBankTransferDto dto, CancellationToken ct) =>
        Ok(await _payments.CreateBankTransferAsync(RequireUserId(), dto, ct));

    /// <summary>
    /// multipart/form-data: <c>receipt</c> (JPG / PNG / WebP / PDF, up to 10 MB), <c>paidOn</c> (yyyy-mm-dd), <c>note</c>
    /// (optional, 200 characters). Sending again while it waits replaces the receipt.
    /// </summary>
    [HttpPost("{id:guid}/receipt")]
    [RequestSizeLimit(UploadLimit)]
    [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UploadReceipt(Guid id, IFormFile? receipt, [FromForm] string? paidOn, [FromForm] string? note, CancellationToken ct)
    {
        if (receipt == null) return Problem(title: "Upload your bank receipt to continue.", statusCode: StatusCodes.Status400BadRequest);
        await using var stream = receipt.OpenReadStream();
        return Ok(await _payments.UploadReceiptAsync(RequireUserId(), id, stream, receipt.Length, receipt.FileName, paidOn, note, ct));
    }

    /// <summary>The member's payments, newest first (replaced orders left out).</summary>
    [HttpGet("mine")]
    [ProducesResponseType(typeof(List<PaymentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Mine(CancellationToken ct) => Ok(await _payments.ListMineAsync(RequireUserId(), ct));

    /// <summary>The receipt file. Owner or staff; staff views are written to the member's review history.</summary>
    [HttpGet("{id:guid}/receipt")]
    public async Task<IActionResult> Receipt(Guid id, CancellationToken ct)
    {
        var file = await _payments.OpenReceiptAsync(id, CurrentViewer, ct);
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(file.Content, file.ContentType);
    }
}

/// <summary>Staff payments queue (S04-T04). Admin and Moderator.</summary>
[Authorize(Policy = Policies.Staff)]
[Route("api/moderation/payments")]
public class PaymentsQueueController : BaseApiController
{
    private readonly IPaymentService _payments;

    public PaymentsQueueController(IPaymentService payments)
    {
        _payments = payments;
    }

    /// <summary>status = review (default: receipts waiting, oldest first) · pending (no receipt yet) · approved · rejected · all.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<StaffPaymentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List([FromQuery] string? status, CancellationToken ct) => Ok(await _payments.ListForStaffAsync(status, ct));

    /// <summary>Approve once: starts the plan (or adds it after the current one) and tells the member in-app + SMS.</summary>
    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(typeof(StaffPaymentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApprovePaymentDto? dto, CancellationToken ct) =>
        Ok(await _payments.ApproveAsync(id, RequireUserId(), dto?.Note, ct));

    /// <summary>Reject with a reason the member sees (in-app + SMS).</summary>
    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(typeof(StaffPaymentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectPaymentDto dto, CancellationToken ct) =>
        Ok(await _payments.RejectAsync(id, RequireUserId(), dto.Reason, ct));
}
