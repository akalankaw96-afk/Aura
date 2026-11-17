using System.Security.Cryptography;
using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Files;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>
/// Bank-transfer payments (S04-T03) and the staff payments queue (S04-T04).
/// Member: make an order (amount from the price list, reference made here) → transfer → upload the receipt.
/// Staff: approve once (starts the plan) or reject with a reason. Receipts are private: owner + staff, staff views logged.
/// </summary>
public interface IPaymentService
{
    Task<PaymentDto> CreateBankTransferAsync(Guid userId, CreateBankTransferDto dto, CancellationToken ct = default);
    Task<PaymentDto> UploadReceiptAsync(Guid userId, Guid paymentId, Stream content, long length, string? fileName, string? paidOn, string? note, CancellationToken ct = default);
    Task<List<PaymentDto>> ListMineAsync(Guid userId, CancellationToken ct = default);
    Task<FileResultData> OpenReceiptAsync(Guid paymentId, Viewer viewer, CancellationToken ct = default);

    Task<List<StaffPaymentDto>> ListForStaffAsync(string? status, CancellationToken ct = default);
    Task<StaffPaymentDto> ApproveAsync(Guid paymentId, Guid staffUserId, string? note, CancellationToken ct = default);
    Task<StaffPaymentDto> RejectAsync(Guid paymentId, Guid staffUserId, string? reason, CancellationToken ct = default);
}

public class PaymentService : IPaymentService
{
    /// <summary>No 0/O or 1/I/L — members copy it by hand into the bank's remarks box.</summary>
    private const string ReferenceAlphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    public const int MaxPaidOnAgeDays = 90;

    private readonly IApplicationDbContext _context;
    private readonly IFileStorage _storage;
    private readonly ISubscriptionService _subscriptions;
    private readonly IBoostService _boosts;
    private readonly INotificationService _notifications;

    public PaymentService(IApplicationDbContext context, IFileStorage storage, ISubscriptionService subscriptions, IBoostService boosts, INotificationService notifications)
    {
        _context = context;
        _storage = storage;
        _subscriptions = subscriptions;
        _boosts = boosts;
        _notifications = notifications;
    }

    // ---------------- member ----------------

    public async Task<PaymentDto> CreateBankTransferAsync(Guid userId, CreateBankTransferDto dto, CancellationToken ct = default)
    {
        var product = (dto.Product ?? "plan").Trim().ToLowerInvariant() switch
        {
            "plan" or "" => BillingProduct.Plan,
            "boost" => BillingProduct.Boost,
            _ => throw AppException.Validation("Product must be plan or boost.", "product")
        };

        string planId;
        int months = 0, days = 0;
        PlanPrice price;
        if (product == BillingProduct.Plan)
        {
            planId = (dto.PlanId ?? string.Empty).Trim().ToLowerInvariant();
            if (planId is not (Plans.Gold or Plans.Platinum)) throw AppException.Validation("Choose Gold or Platinum.", "planId");
            if (!await _context.CandidateProfiles.AnyAsync(p => p.UserId == userId, ct))
                throw AppException.Forbidden("Save your profile details first.", ErrorCodes.ProfileRequired);
            months = dto.Months;
            price = await PricingService.FindAsync(_context, BillingProduct.Plan, planId, months, 0, ct)
                ?? throw AppException.Validation("That plan length isn't available. Choose 1, 3 or 6 months.", "months");
        }
        else
        {
            planId = PricingService.Boost;
            days = dto.Days <= 0 ? 7 : dto.Days;
            await _boosts.EnsureCanBuyAsync(userId, ct);
            price = await PricingService.FindAsync(_context, BillingProduct.Boost, planId, 0, days, ct)
                ?? throw AppException.Validation("That boost length isn't available.", "days");
        }

        var open = await _context.Payments
            .Where(p => p.UserId == userId && p.Product == product
                && (p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.AwaitingReview))
            .ToListAsync(ct);

        if (open.Any(p => p.Status == PaymentStatus.AwaitingReview))
            throw AppException.Conflict(product == BillingProduct.Boost
                ? "We're still checking your last boost receipt. You can buy again once it's confirmed."
                : "We're still checking your last receipt. You can buy again once it's confirmed.", ErrorCodes.PaymentUnderReview);

        var now = DateTime.UtcNow;
        var same = open.FirstOrDefault(p => p.PlanId == planId && p.Months == months && p.Days == days);
        // one open order at a time: a different choice replaces the old one (no receipt was sent for it)
        foreach (var other in open.Where(p => p != same))
        {
            other.Status = PaymentStatus.Cancelled;
            other.UpdatedAt = now;
        }

        if (same != null)
        {
            // the admin may have changed the price since the order was made
            if (same.AmountCents != price.AmountCents)
            {
                same.AmountCents = price.AmountCents;
                same.UpdatedAt = now;
            }
            await _context.SaveChangesAsync(ct);
            return ToDto(same);
        }

        var payment = new Payment
        {
            UserId = userId,
            Product = product,
            PlanId = planId,
            Months = months,
            Days = days,
            AmountCents = price.AmountCents,
            Currency = price.Currency,
            Reference = await NewReferenceAsync(planId, product == BillingProduct.Boost ? days : months, ct)
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync(ct);
        return ToDto(payment);
    }

    public async Task<PaymentDto> UploadReceiptAsync(Guid userId, Guid paymentId, Stream content, long length, string? fileName, string? paidOn, string? note, CancellationToken ct = default)
    {
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == paymentId && p.UserId == userId, ct)
            ?? throw AppException.NotFound("Payment not found.");
        if (payment.Status is not (PaymentStatus.Pending or PaymentStatus.AwaitingReview))
            throw AppException.Conflict(payment.Status == PaymentStatus.Cancelled
                ? "This order was replaced by a newer one. Start again from the Plans page."
                : "This payment has already been checked.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!DateOnly.TryParseExact(paidOn?.Trim(), "yyyy-MM-dd", out var paidDate))
            throw AppException.Validation("Enter the date you paid.", "paidOn");
        // +1 day: Sri Lanka is ahead of UTC
        if (paidDate > today.AddDays(1)) throw AppException.Validation("The payment date can't be in the future.", "paidOn");
        if (paidDate < today.AddDays(-MaxPaidOnAgeDays)) throw AppException.Validation("That date is too long ago. Contact support about older payments.", "paidOn");

        note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        if (note?.Length > 200) throw AppException.Validation("Keep the note under 200 characters.", "note");

        var (bytes, type) = await FileRules.ReadAndCheckAsync(content, length, allowPdf: true, ct, FileRules.MaxReceiptBytes);
        using var ms = new MemoryStream(bytes);
        var key = await _storage.SaveAsync(ms, "receipts", type.Extension, ct);

        var oldKey = payment.ReceiptKey;
        payment.ReceiptKey = key;
        payment.ReceiptContentType = type.ContentType;
        payment.ReceiptFileName = CleanFileName(fileName, type.Extension);
        payment.PaidOn = paidDate;
        payment.MemberNote = note;
        payment.Status = PaymentStatus.AwaitingReview;
        payment.SubmittedAt = DateTime.UtcNow;
        payment.UpdatedAt = payment.SubmittedAt;
        await _context.SaveChangesAsync(ct);

        if (oldKey != null) await _storage.DeleteAsync(oldKey, ct);
        return ToDto(payment);
    }

    public async Task<List<PaymentDto>> ListMineAsync(Guid userId, CancellationToken ct = default)
    {
        var items = await _context.Payments.AsNoTracking()
            .Where(p => p.UserId == userId && p.Status != PaymentStatus.Cancelled)
            .OrderByDescending(p => p.CreatedAt)
            .Take(50)
            .ToListAsync(ct);
        return items.Select(ToDto).ToList();
    }

    public async Task<FileResultData> OpenReceiptAsync(Guid paymentId, Viewer viewer, CancellationToken ct = default)
    {
        var payment = await _context.Payments.AsNoTracking().FirstOrDefaultAsync(p => p.Id == paymentId, ct)
            ?? throw AppException.NotFound("Receipt not found.");
        var isOwner = viewer.UserId.HasValue && payment.UserId == viewer.UserId;
        if ((!isOwner && !viewer.IsStaff) || payment.ReceiptKey == null) throw AppException.NotFound("Receipt not found.");

        if (viewer.IsStaff && !isOwner && viewer.UserId.HasValue)
        {
            var profileId = await ProfileIdAsync(payment.UserId, ct);
            if (profileId.HasValue)
            {
                _context.ProfileReviewLogs.Add(new ProfileReviewLog
                {
                    ProfileId = profileId.Value,
                    ModeratorUserId = viewer.UserId.Value,
                    Action = ReviewAction.PaymentReceiptViewed,
                    Note = payment.Reference
                });
                await _context.SaveChangesAsync(ct);
            }
        }

        var stream = await _storage.OpenReadAsync(payment.ReceiptKey, ct) ?? throw AppException.NotFound("Receipt not found.");
        return new FileResultData(stream, payment.ReceiptContentType ?? "application/octet-stream");
    }

    // ---------------- staff ----------------

    public async Task<List<StaffPaymentDto>> ListForStaffAsync(string? status, CancellationToken ct = default)
    {
        var query = _context.Payments.AsNoTracking();
        var key = (status ?? "review").Trim().ToLowerInvariant();
        query = key switch
        {
            "review" or "awaitingreview" => query.Where(p => p.Status == PaymentStatus.AwaitingReview),
            "approved" => query.Where(p => p.Status == PaymentStatus.Approved),
            "rejected" => query.Where(p => p.Status == PaymentStatus.Rejected),
            "pending" => query.Where(p => p.Status == PaymentStatus.Pending),
            "all" => query.Where(p => p.Status != PaymentStatus.Cancelled),
            _ => throw AppException.Validation("Status must be review, pending, approved, rejected or all.", "status")
        };
        // the queue: oldest receipt first; history: newest first
        var items = key is "review" or "awaitingreview"
            ? await query.OrderBy(p => p.SubmittedAt).Take(200).ToListAsync(ct)
            : await query.OrderByDescending(p => p.ReviewedAt ?? p.SubmittedAt ?? p.CreatedAt).Take(200).ToListAsync(ct);
        return await ToStaffDtosAsync(items, ct);
    }

    public async Task<StaffPaymentDto> ApproveAsync(Guid paymentId, Guid staffUserId, string? note, CancellationToken ct = default)
    {
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == paymentId, ct)
            ?? throw AppException.NotFound("Payment not found.");
        EnsureReviewable(payment);
        note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        if (note?.Length > 500) note = note[..500];

        payment.Status = PaymentStatus.Approved;
        payment.ReviewedByUserId = staffUserId;
        payment.ReviewedAt = DateTime.UtcNow;
        payment.ReviewNote = note;
        payment.UpdatedAt = payment.ReviewedAt;
        await LogAsync(payment, staffUserId, ReviewAction.PaymentApproved, note, ct);
        await _context.SaveChangesAsync(ct);

        // starts or extends the plan / boost; refuses a second one for the same payment (+ unique indexes)
        if (payment.Product == BillingProduct.Boost)
            await _boosts.GrantAsync(payment.UserId, payment.Days, payment.Id, staffUserId, $"Bank transfer {payment.Reference}", ct);
        else
            await _subscriptions.GrantAsync(payment.UserId, payment.PlanId, payment.Months, payment.Id, staffUserId,
                $"Bank transfer {payment.Reference}", ct);

        return (await ToStaffDtosAsync(new List<Payment> { payment }, ct))[0];
    }

    public async Task<StaffPaymentDto> RejectAsync(Guid paymentId, Guid staffUserId, string? reason, CancellationToken ct = default)
    {
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == paymentId, ct)
            ?? throw AppException.NotFound("Payment not found.");
        EnsureReviewable(payment);
        reason = reason?.Trim();
        if (string.IsNullOrEmpty(reason)) throw AppException.Validation("Tell the member why the payment wasn't accepted.", "reason");
        if (reason.Length > 500) throw AppException.Validation("Keep the reason under 500 characters.", "reason");

        payment.Status = PaymentStatus.Rejected;
        payment.ReviewedByUserId = staffUserId;
        payment.ReviewedAt = DateTime.UtcNow;
        payment.ReviewNote = reason;
        payment.UpdatedAt = payment.ReviewedAt;
        await LogAsync(payment, staffUserId, ReviewAction.PaymentRejected, reason, ct);
        await _context.SaveChangesAsync(ct);

        await _notifications.NotifyAsync(payment.UserId, "payment.rejected", "We couldn't confirm your payment",
            $"Payment {payment.Reference}: {reason}. Upload the right receipt or contact support.",
            "/plans", sms: true, ct);
        await _context.SaveChangesAsync(ct);

        return (await ToStaffDtosAsync(new List<Payment> { payment }, ct))[0];
    }

    // ---------------- helpers ----------------

    private static void EnsureReviewable(Payment payment)
    {
        switch (payment.Status)
        {
            case PaymentStatus.AwaitingReview:
                return;
            case PaymentStatus.Approved:
                throw AppException.Conflict("This payment was already approved.", ErrorCodes.PaymentAlreadyUsed);
            case PaymentStatus.Pending:
                throw AppException.Conflict("The member hasn't uploaded a receipt yet.");
            default:
                throw AppException.Conflict("This payment has already been dealt with.");
        }
    }

    private async Task LogAsync(Payment payment, Guid staffUserId, ReviewAction action, string? note, CancellationToken ct)
    {
        var profileId = await ProfileIdAsync(payment.UserId, ct);
        if (profileId == null) return;
        var text = note == null ? payment.Reference : $"{payment.Reference}: {note}";
        _context.ProfileReviewLogs.Add(new ProfileReviewLog
        {
            ProfileId = profileId.Value,
            ModeratorUserId = staffUserId,
            Action = action,
            Note = text.Length > 500 ? text[..500] : text
        });
    }

    private Task<Guid?> ProfileIdAsync(Guid userId, CancellationToken ct) =>
        _context.CandidateProfiles.AsNoTracking().Where(p => p.UserId == userId).Select(p => (Guid?)p.Id).FirstOrDefaultAsync(ct);

    private async Task<string> NewReferenceAsync(string planId, int months, CancellationToken ct) // months = days for boosts
    {
        var letter = planId switch { Plans.Platinum => "P", PricingService.Boost => "B", _ => "G" };
        var prefix = $"VK-{letter}{months}-";
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var tail = new string(Enumerable.Range(0, 6).Select(_ => ReferenceAlphabet[RandomNumberGenerator.GetInt32(ReferenceAlphabet.Length)]).ToArray());
            var reference = prefix + tail;
            if (!await _context.Payments.AnyAsync(p => p.Reference == reference, ct)) return reference;
        }
        throw new InvalidOperationException("Could not make a unique payment reference.");
    }

    private static string CleanFileName(string? name, string extension)
    {
        var clean = Path.GetFileName(name ?? string.Empty);
        clean = new string(clean.Where(c => !char.IsControl(c) && c is not ('<' or '>' or '"' or '\\' or '/')).ToArray()).Trim();
        if (clean.Length == 0) clean = "receipt" + extension;
        return clean.Length > 120 ? clean[^120..] : clean;
    }

    private async Task<List<StaffPaymentDto>> ToStaffDtosAsync(List<Payment> items, CancellationToken ct)
    {
        var userIds = items.Select(p => p.UserId).Concat(items.Where(p => p.ReviewedByUserId.HasValue).Select(p => p.ReviewedByUserId!.Value)).Distinct().ToList();
        var users = await _context.Users.AsNoTracking().Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName, u.PhoneNumber }).ToDictionaryAsync(u => u.Id, ct);
        var memberIds = items.Select(p => p.UserId).Distinct().ToList();
        var profiles = await _context.CandidateProfiles.AsNoTracking().Where(p => memberIds.Contains(p.UserId))
            .Select(p => new { p.Id, p.UserId, p.FullName, p.Code }).ToDictionaryAsync(p => p.UserId, ct);
        var now = DateTime.UtcNow;
        var running = await _context.Subscriptions.AsNoTracking()
            .Where(s => memberIds.Contains(s.UserId) && s.Status == SubscriptionStatus.Active && s.StartsAt <= now && s.EndsAt > now)
            .Select(s => new { s.UserId, s.PlanId }).ToListAsync(ct);

        return items.Select(p =>
        {
            var dto = new StaffPaymentDto();
            Fill(dto, p);
            users.TryGetValue(p.UserId, out var user);
            profiles.TryGetValue(p.UserId, out var profile);
            dto.UserId = p.UserId;
            dto.ProfileId = profile?.Id;
            dto.MemberName = !string.IsNullOrWhiteSpace(profile?.FullName) ? profile!.FullName : user?.FullName ?? "Member";
            dto.MemberCode = string.IsNullOrWhiteSpace(profile?.Code) ? null : profile!.Code;
            dto.PhoneNumber = user?.PhoneNumber ?? string.Empty;
            dto.CurrentPlan = running.Where(s => s.UserId == p.UserId).Select(s => s.PlanId)
                .OrderByDescending(SubscriptionRules.Rank).FirstOrDefault() ?? Plans.Free;
            dto.ReviewedBy = p.ReviewedByUserId.HasValue && users.TryGetValue(p.ReviewedByUserId.Value, out var staff) ? staff.FullName : null;
            return dto;
        }).ToList();
    }

    internal static PaymentDto ToDto(Payment p)
    {
        var dto = new PaymentDto();
        Fill(dto, p);
        return dto;
    }

    private static void Fill(PaymentDto dto, Payment p)
    {
        dto.Id = p.Id;
        dto.Product = p.Product == BillingProduct.Boost ? "boost" : "plan";
        dto.PlanId = p.PlanId;
        dto.Months = p.Months;
        dto.Days = p.Days;
        dto.AmountCents = p.AmountCents;
        dto.Amount = p.AmountCents / 100m;
        dto.Currency = p.Currency;
        dto.Reference = p.Reference;
        dto.Status = p.Status.ToString();
        dto.HasReceipt = p.ReceiptKey != null;
        dto.ReceiptFileName = p.ReceiptFileName;
        dto.ReceiptContentType = p.ReceiptContentType;
        dto.PaidOn = p.PaidOn;
        dto.MemberNote = p.MemberNote;
        dto.CreatedAt = p.CreatedAt;
        dto.SubmittedAt = p.SubmittedAt;
        dto.ReviewedAt = p.ReviewedAt;
        dto.ReviewNote = p.ReviewNote;
    }
}
