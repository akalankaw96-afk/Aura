using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using DatingApp.Infrastructure.Persistence;
using DatingApp.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Take a break and delete the account (S04-T08).</summary>
public class AccountTests
{
    private static readonly ClientInfo Client = new("127.0.0.1", "tests");

    private static (AccountService Account, CapturingSmsSender Sms, MemoryFileStorage Files) Build(ApplicationDbContext db)
    {
        var sms = new CapturingSmsSender();
        var files = new MemoryFileStorage();
        return (new AccountService(db, new OtpService(db, sms, new NoEmailSender()), files, new PasswordHasher()), sms, files);
    }

    [Fact]
    public async Task Taking_a_break_hides_the_profile_from_search_but_keeps_friends()
    {
        using var db = TestDb.Create();
        var (member, profile) = await TestDb.AddApprovedMemberAsync(db, "Nimal", "+94770000001");
        var (friend, friendProfile) = await TestDb.AddApprovedMemberAsync(db, "Friend", "+94770000002");
        await TestDb.MatchAsync(db, profile, friendProfile);
        var (account, _, _) = Build(db);
        var search = new SearchService(db, new UsageService(db));

        await account.SetVisibilityAsync(member.Id, true);
        Assert.DoesNotContain((await search.SearchAsync(friend.Id, new ProfileSearchDto())).Items, p => p.Id == profile.Id);
        Assert.True(new SessionService(db, new FakeJwt()).ToResponse(member, null).ProfileHidden);
        // still a friend, and the profile page still opens
        Assert.True(await db.MatchRequests.AnyAsync(r => r.SenderProfileId == profile.Id && r.Status == MatchRequestStatus.Accepted));
        Assert.NotNull(await new ProfileService(db).GetProfileByIdAsync(profile.Id));

        await account.SetVisibilityAsync(member.Id, false);
        Assert.Contains((await search.SearchAsync(friend.Id, new ProfileSearchDto())).Items, p => p.Id == profile.Id);
    }

    [Fact]
    public async Task Deleting_needs_the_sms_code_then_hides_signs_out_and_blocks_sign_in()
    {
        using var db = TestDb.Create();
        var (member, profile) = await TestDb.AddApprovedMemberAsync(db, "Nimal", "+94770000001");
        var (account, sms, _) = Build(db);
        var sessions = new SessionService(db, new FakeJwt());
        var start = await sessions.StartAsync(member, Client);

        await account.SendDeleteCodeAsync(member.Id);
        Assert.Contains("DELETE", sms.LastMessage);
        var wrong = await Assert.ThrowsAsync<AppException>(() => account.DeleteAsync(member.Id, new DeleteAccountDto { Code = "000000", Reason = "found-here" }));
        Assert.Equal(ErrorCodes.CodeInvalid, wrong.Code);
        Assert.Null(member.DeletionRequestedAt);

        await account.DeleteAsync(member.Id, new DeleteAccountDto { Code = sms.LastCode, Reason = "found-here", Comment = "Thank you!" });
        Assert.NotNull(member.DeletionRequestedAt);
        Assert.False(member.IsActive);
        Assert.True(profile.IsHidden);
        await Assert.ThrowsAsync<AppException>(() => sessions.RefreshAsync(start.RefreshToken, Client));
        var feedback = await db.AccountClosureFeedback.SingleAsync();
        Assert.Equal("found-here", feedback.Reason);

        // staff see it as deactivated and can't change it
        var admin = new User { FullName = "Admin", PhoneNumber = "+94770000100", Role = Roles.Admin };
        db.Users.Add(admin);
        await db.SaveChangesAsync();
        var adminService = new AdminMembersService(db, new PasswordHasher(), new CapturingSmsSender());
        var row = (await adminService.ListAsync(null, "Deactivated", 1, 10)).Items.Single();
        Assert.StartsWith("Deleted by the member", row.StatusReason);
        await Assert.ThrowsAsync<AppException>(() => adminService.SetStatusAsync(admin.Id, member.Id, new MemberStatusDto { Action = "unblock" }));
    }

    [Fact]
    public async Task After_30_days_personal_data_is_erased_and_payments_are_kept()
    {
        using var db = TestDb.Create();
        var (member, profile) = await TestDb.AddApprovedMemberAsync(db, "Nimal", "+94770000001");
        var (_, other) = await TestDb.AddApprovedMemberAsync(db, "Other", "+94770000002");
        await TestDb.MatchAsync(db, profile, other);
        var (account, sms, files) = Build(db);
        var key = await files.SaveAsync(new MemoryStream(new byte[] { 1 }), "photos", ".jpg");
        db.ProfilePhotos.Add(new ProfilePhoto { ProfileId = profile.Id, StorageKey = key, ContentType = "image/jpeg" });
        db.ChatMessages.Add(new ChatMessage { SenderProfileId = profile.Id, ReceiverProfileId = other.Id, ConversationId = "c1", MessageText = "hello" });
        db.Payments.Add(new Payment { UserId = member.Id, PlanId = "gold", Months = 1, AmountCents = 250_000, Reference = "VK-G1-TEST01", Status = PaymentStatus.Approved, MemberNote = "from dad" });
        await db.SaveChangesAsync();

        await account.SendDeleteCodeAsync(member.Id);
        await account.DeleteAsync(member.Id, new DeleteAccountDto { Code = sms.LastCode, Reason = "other" });

        Assert.Equal(0, await account.EraseDueAsync(DateTime.UtcNow)); // not before 30 days
        Assert.Equal(1, await account.EraseDueAsync(DateTime.UtcNow.AddDays(31)));
        Assert.Equal(0, await account.EraseDueAsync(DateTime.UtcNow.AddDays(32))); // only once

        Assert.Equal(AccountService.DeletedName, member.FullName);
        Assert.Equal(string.Empty, member.PhoneNumber);
        Assert.Null(member.Email);
        Assert.NotNull(member.ErasedAt);
        Assert.Equal(AccountService.DeletedName, profile.FullName);
        Assert.Empty(files.Files);
        Assert.False(await db.ProfilePhotos.AnyAsync());
        Assert.False(await db.ChatMessages.AnyAsync());
        Assert.False(await db.MatchRequests.AnyAsync());
        var payment = await db.Payments.SingleAsync();
        Assert.Equal(250_000, payment.AmountCents);
        Assert.Null(payment.MemberNote);
    }
}
