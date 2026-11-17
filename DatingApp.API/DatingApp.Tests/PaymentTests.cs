using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using DatingApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Bank-transfer orders and receipts (S04-T03), staff approve / reject (S04-T04).</summary>
public class PaymentTests
{
    private static readonly byte[] Pdf = "%PDF-1.4 receipt"u8.ToArray();
    private static readonly byte[] Text = "not a receipt"u8.ToArray();
    private static string Today => DateTime.UtcNow.ToString("yyyy-MM-dd");

    private static (PaymentService Payments, CapturingSmsSender Sms, MemoryFileStorage Files) Build(ApplicationDbContext db)
    {
        var sms = new CapturingSmsSender();
        var notifications = new NotificationService(db, sms);
        var files = new MemoryFileStorage();
        return (new PaymentService(db, files, new SubscriptionService(db, notifications), new BoostService(db, notifications), notifications), sms, files);
    }

    private static async Task<(ApplicationDbContext Db, User Member, User Staff)> SetupAsync()
    {
        var db = TestDb.Create();
        await PricingService.EnsureDefaultsAsync(db);
        var (member, _) = await TestDb.AddApprovedMemberAsync(db, "Nimal", "+94770000001");
        var staff = new User { FullName = "Mod", PhoneNumber = "+94770000100", Role = Roles.Moderator };
        db.Users.Add(staff);
        await db.SaveChangesAsync();
        return (db, member, staff);
    }

    private static Task<PaymentDto> UploadAsync(PaymentService payments, Guid userId, Guid paymentId, byte[]? file = null, string? paidOn = null) =>
        payments.UploadReceiptAsync(userId, paymentId, new MemoryStream(file ?? Pdf), (file ?? Pdf).Length, "slip.pdf", paidOn ?? Today, "paid from my father's account");

    [Fact]
    public async Task An_order_takes_its_amount_from_the_price_list_and_gets_a_server_reference()
    {
        var (db, member, _) = await SetupAsync();
        using var _db = db;
        var (payments, _, _) = Build(db);

        var order = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 3 });
        Assert.Equal(637_500, order.AmountCents);
        Assert.Equal("Pending", order.Status);
        Assert.Matches("^VK-G3-[2-9A-HJKMNP-Z]{6}$", order.Reference);

        // asking again for the same plan gives the same order
        var again = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 3 });
        Assert.Equal(order.Id, again.Id);

        // a different choice replaces it
        var platinum = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "platinum", Months = 1 });
        Assert.NotEqual(order.Id, platinum.Id);
        Assert.Equal(650_000, platinum.AmountCents);
        Assert.Equal(PaymentStatus.Cancelled, (await db.Payments.SingleAsync(p => p.Id == order.Id)).Status);
        Assert.Single(await payments.ListMineAsync(member.Id));

        await Assert.ThrowsAsync<AppException>(() => payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 2 }));
        await Assert.ThrowsAsync<AppException>(() => payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "free", Months = 1 }));
    }

    [Fact]
    public async Task A_receipt_must_be_a_real_image_or_pdf_with_a_sensible_date_and_stays_private()
    {
        var (db, member, staff) = await SetupAsync();
        using var _db = db;
        var (payments, _, files) = Build(db);
        var (other, _) = await TestDb.AddApprovedMemberAsync(db, "Other", "+94770000002");
        var order = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 1 });

        await Assert.ThrowsAsync<AppException>(() => UploadAsync(payments, member.Id, order.Id, Text));
        await Assert.ThrowsAsync<AppException>(() => UploadAsync(payments, member.Id, order.Id, paidOn: DateTime.UtcNow.AddDays(5).ToString("yyyy-MM-dd")));
        await Assert.ThrowsAsync<AppException>(() => UploadAsync(payments, member.Id, order.Id, paidOn: "yesterday"));
        await Assert.ThrowsAsync<AppException>(() => UploadAsync(payments, other.Id, order.Id)); // not theirs → 404

        var sent = await UploadAsync(payments, member.Id, order.Id);
        Assert.Equal("AwaitingReview", sent.Status);
        Assert.True(sent.HasReceipt);
        Assert.Single(files.Files);

        // sending again replaces the file
        await UploadAsync(payments, member.Id, order.Id);
        Assert.Single(files.Files);

        // owner and staff can open it; staff views are logged; other members can't
        await using (var mine = (await payments.OpenReceiptAsync(order.Id, new Viewer(member.Id, false))).Content) { }
        await using (var staffView = (await payments.OpenReceiptAsync(order.Id, new Viewer(staff.Id, true))).Content) { }
        await Assert.ThrowsAsync<AppException>(() => payments.OpenReceiptAsync(order.Id, new Viewer(other.Id, false)));
        Assert.Equal(1, await db.ProfileReviewLogs.CountAsync(l => l.Action == ReviewAction.PaymentReceiptViewed));

        // while it is checked, no new plan order
        var ex = await Assert.ThrowsAsync<AppException>(() => payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "platinum", Months = 1 }));
        Assert.Equal(ErrorCodes.PaymentUnderReview, ex.Code);
    }

    [Fact]
    public async Task Approving_starts_the_plan_once_and_tells_the_member_by_sms()
    {
        var (db, member, staff) = await SetupAsync();
        using var _db = db;
        var (payments, sms, _) = Build(db);
        var order = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 3 });

        // no receipt yet → can't approve
        await Assert.ThrowsAsync<AppException>(() => payments.ApproveAsync(order.Id, staff.Id, null));
        await UploadAsync(payments, member.Id, order.Id);

        var queue = await payments.ListForStaffAsync(null);
        var item = Assert.Single(queue);
        Assert.Equal("Nimal", item.MemberName);
        Assert.Equal("free", item.CurrentPlan);

        var approved = await payments.ApproveAsync(order.Id, staff.Id, "Matched on statement");
        Assert.Equal("Approved", approved.Status);
        Assert.Equal("gold", approved.CurrentPlan);
        Assert.Equal("Mod", approved.ReviewedBy);

        var sub = await db.Subscriptions.SingleAsync(s => s.UserId == member.Id);
        Assert.Equal(order.Id, sub.PaymentId);
        Assert.True(sub.EndsAt > DateTime.UtcNow.AddMonths(3).AddDays(-1));
        Assert.Contains("Payment confirmed", sms.LastMessage);
        Assert.Equal("gold", (await new UsageService(db).GetUsageAsync(member.Id)).PlanId);

        // a second approve does nothing
        var twice = await Assert.ThrowsAsync<AppException>(() => payments.ApproveAsync(order.Id, staff.Id, null));
        Assert.Equal(ErrorCodes.PaymentAlreadyUsed, twice.Code);
        Assert.Equal(1, await db.Subscriptions.CountAsync(s => s.UserId == member.Id));
        Assert.Empty(await payments.ListForStaffAsync("review"));
        Assert.Single(await payments.ListForStaffAsync("approved"));
        Assert.Equal(1, await db.ProfileReviewLogs.CountAsync(l => l.Action == ReviewAction.PaymentApproved));

        // a later order renews after the current period
        var next = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 1 });
        await UploadAsync(payments, member.Id, next.Id);
        await payments.ApproveAsync(next.Id, staff.Id, null);
        var periods = await db.Subscriptions.Where(s => s.UserId == member.Id).OrderBy(s => s.StartsAt).ToListAsync();
        Assert.Equal(periods[0].EndsAt, periods[1].StartsAt);
    }

    [Fact]
    public async Task Rejecting_needs_a_reason_gives_no_plan_and_lets_the_member_order_again()
    {
        var (db, member, staff) = await SetupAsync();
        using var _db = db;
        var (payments, sms, _) = Build(db);
        var order = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 1 });
        await UploadAsync(payments, member.Id, order.Id);

        await Assert.ThrowsAsync<AppException>(() => payments.RejectAsync(order.Id, staff.Id, " "));
        var rejected = await payments.RejectAsync(order.Id, staff.Id, "The amount on the receipt is LKR 2,000");
        Assert.Equal("Rejected", rejected.Status);
        Assert.Contains("LKR 2,000", sms.LastMessage);
        Assert.False(await db.Subscriptions.AnyAsync());
        Assert.True(await db.Notifications.AnyAsync(n => n.UserId == member.Id && n.Type == "payment.rejected"));

        await Assert.ThrowsAsync<AppException>(() => payments.ApproveAsync(order.Id, staff.Id, null));
        await Assert.ThrowsAsync<AppException>(() => UploadAsync(payments, member.Id, order.Id));

        var retry = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 1 });
        Assert.NotEqual(order.Id, retry.Id);
        Assert.Equal("Rejected", (await payments.ListMineAsync(member.Id)).Single(p => p.Id == order.Id).Status);
    }

    [Fact]
    public async Task A_boost_needs_an_approved_paid_member_and_puts_the_profile_first_in_search()
    {
        var (db, member, staff) = await SetupAsync();
        using var _db = db;
        var (payments, sms, _) = Build(db);
        var boosts = new BoostService(db, new NotificationService(db, new CapturingSmsSender()));
        var (viewer, _) = await TestDb.AddApprovedMemberAsync(db, "Viewer", "+94770000009");
        await TestDb.AddApprovedMemberAsync(db, "Newer", "+94770000008"); // newest member, not promoted

        // Free members can't buy a boost
        var free = await Assert.ThrowsAsync<AppException>(() => payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { Product = "boost" }));
        Assert.Equal(ErrorCodes.PlanRequired, free.Code);
        Assert.False((await boosts.GetMineAsync(member.Id)).CanBuy);

        await TestDb.MakePaidAsync(db, member.Id);
        var order = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { Product = "boost" });
        Assert.Equal("boost", order.Product);
        Assert.Equal(7, order.Days);
        Assert.Equal(50_000, order.AmountCents);
        Assert.StartsWith("VK-B7-", order.Reference);
        // a plan order is separate from a boost order
        var planOrder = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 1 });
        Assert.NotEqual(order.Id, planOrder.Id);
        Assert.Equal("Pending", (await db.Payments.SingleAsync(p => p.Id == order.Id)).Status.ToString());

        Assert.False((await boosts.GetMineAsync(member.Id)).Active); // not before approval
        await UploadAsync(payments, member.Id, order.Id);
        await payments.ApproveAsync(order.Id, staff.Id, null);
        Assert.Contains("top of matching searches", sms.LastMessage);

        var status = await boosts.GetMineAsync(member.Id);
        Assert.True(status.Active);
        Assert.Equal(7, status.DaysLeft);
        Assert.Equal(7, status.TotalDays);
        Assert.Single(await db.Subscriptions.Where(s => s.UserId == member.Id).ToListAsync()); // no plan given

        var search = new SearchService(db, new UsageService(db));
        var results = await search.SearchAsync(viewer.Id, new ProfileSearchDto());
        Assert.Equal("Nimal", results.Items[0].Name);
        Assert.True(results.Items[0].Promoted);
        Assert.False(results.Items[1].Promoted);

        // extending adds after the current boost; the payment can't be used twice
        var again = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { Product = "boost" });
        await UploadAsync(payments, member.Id, again.Id);
        await payments.ApproveAsync(again.Id, staff.Id, null);
        var extended = await boosts.GetMineAsync(member.Id);
        Assert.Equal(14, extended.DaysLeft);
        var chain = await db.Boosts.OrderBy(b => b.StartsAt).ToListAsync();
        Assert.Equal(chain[0].EndsAt, chain[1].StartsAt);
        await Assert.ThrowsAsync<AppException>(() => boosts.GrantAsync(member.Id, 7, again.Id, staff.Id, null));

        // when it ends the profile is no longer promoted
        foreach (var b in chain) { b.StartsAt = b.StartsAt.AddDays(-30); b.EndsAt = b.EndsAt.AddDays(-30); }
        var profile = await db.CandidateProfiles.SingleAsync(p => p.UserId == member.Id);
        profile.PromotedUntil = chain[1].EndsAt;
        await db.SaveChangesAsync();
        Assert.False((await boosts.GetMineAsync(member.Id)).Active);
        Assert.DoesNotContain((await search.SearchAsync(viewer.Id, new ProfileSearchDto())).Items, i => i.Promoted);
    }

    [Fact]
    public async Task An_open_order_follows_a_price_change_but_an_approved_one_keeps_what_was_paid()
    {
        var (db, member, staff) = await SetupAsync();
        using var _db = db;
        var (payments, _, _) = Build(db);
        var pricing = new PricingService(db);

        var order = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 1 });
        Assert.Equal(250_000, order.AmountCents);

        await pricing.UpdatePricesAsync(staff.Id, new List<PlanPriceDto> { new() { Product = "plan", PlanId = "gold", Months = 1, AmountCents = 300_000 } });
        var again = await payments.CreateBankTransferAsync(member.Id, new CreateBankTransferDto { PlanId = "gold", Months = 1 });
        Assert.Equal(order.Id, again.Id);
        Assert.Equal(300_000, again.AmountCents); // same order, today's price

        await UploadAsync(payments, member.Id, order.Id);
        await payments.ApproveAsync(order.Id, staff.Id, null);
        await pricing.UpdatePricesAsync(staff.Id, new List<PlanPriceDto> { new() { Product = "plan", PlanId = "gold", Months = 1, AmountCents = 200_000 } });
        Assert.Equal(300_000, (await payments.ListMineAsync(member.Id)).Single().AmountCents); // history never changes
    }
}
