using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using DatingApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Files kept in memory for tests.</summary>
public class MemoryFileStorage : IFileStorage
{
    public Dictionary<string, byte[]> Files { get; } = new();

    public async Task<string> SaveAsync(Stream content, string folder, string extension, CancellationToken ct = default)
    {
        using var ms = new MemoryStream();
        await content.CopyToAsync(ms, ct);
        var key = $"{folder}/{Guid.NewGuid():N}{extension}";
        Files[key] = ms.ToArray();
        return key;
    }

    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default) =>
        Task.FromResult<Stream?>(Files.TryGetValue(key, out var b) ? new MemoryStream(b) : null);

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        Files.Remove(key);
        return Task.CompletedTask;
    }
}

/// <summary>Join → submit → review → approve / changes → resubmit (Sprint 02).</summary>
public class ReviewFlowTests
{
    private static readonly byte[] Jpeg = { 0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10, 0x4A, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1 };
    private static readonly byte[] Text = "hello, not an image"u8.ToArray();

    private sealed class Env
    {
        public required ApplicationDbContext Db { get; init; }
        public required MemoryFileStorage Storage { get; init; }
        public required CapturingSmsSender Sms { get; init; }
        public required MediaService Media { get; init; }
        public required ReviewService Review { get; init; }
        public required ModerationService Moderation { get; init; }
        public required User Member { get; init; }
        public required User Moderator { get; init; }
    }

    private static async Task<Env> CreateAsync()
    {
        var db = TestDb.Create();
        var storage = new MemoryFileStorage();
        var sms = new CapturingSmsSender();
        var (member, _) = await TestDb.AddMemberAsync(db, "Nadee Perera", "+94770000001");
        var profile = await db.CandidateProfiles.SingleAsync();
        profile.DateOfBirth = new DateOnly(1996, 5, 1);
        var moderator = new User { FullName = "Mod", PhoneNumber = "+94770000099", Role = Roles.Moderator };
        db.Users.Add(moderator);
        await db.SaveChangesAsync();

        var notifications = new NotificationService(db, sms);
        return new Env
        {
            Db = db,
            Storage = storage,
            Sms = sms,
            Media = new MediaService(db, storage),
            Review = new ReviewService(db),
            Moderation = new ModerationService(db, notifications, new ProfileService(db)),
            Member = member,
            Moderator = moderator
        };
    }

    private static async Task CompleteUploadsAsync(Env env)
    {
        await env.Media.UploadPhotoAsync(env.Member.Id, new MemoryStream(Jpeg), Jpeg.Length);
        foreach (var type in new[] { "NicFront", "NicBack", "Selfie" })
            await env.Media.UploadDocumentAsync(env.Member.Id, type, new MemoryStream(Jpeg), Jpeg.Length);
    }

    [Fact]
    public async Task Submitting_needs_a_photo_ID_and_selfie()
    {
        var env = await CreateAsync();

        var ex = await Assert.ThrowsAsync<AppException>(() => env.Review.SubmitAsync(env.Member.Id));
        var missing = Assert.IsType<List<string>>(ex.Extensions["missing"]);
        Assert.Contains("photo", missing);
        Assert.Contains("idDocument", missing);
        Assert.Contains("selfie", missing);
    }

    [Fact]
    public async Task Only_real_images_are_accepted()
    {
        var env = await CreateAsync();

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            env.Media.UploadPhotoAsync(env.Member.Id, new MemoryStream(Text), Text.Length));

        Assert.Equal(400, ex.Status);
        Assert.Empty(env.Storage.Files);
    }

    [Fact]
    public async Task Approval_makes_the_profile_and_photo_visible_and_notifies_the_member()
    {
        var env = await CreateAsync();
        await CompleteUploadsAsync(env);

        var submitted = await env.Review.SubmitAsync(env.Member.Id);
        Assert.Equal("Submitted", submitted.Status);

        var queue = await env.Moderation.GetQueueAsync();
        var item = Assert.Single(queue);

        // before approval the photo is private
        var photo = await env.Db.ProfilePhotos.SingleAsync();
        await Assert.ThrowsAsync<AppException>(() => env.Media.OpenPhotoAsync(photo.Id, new Viewer(null, false)));

        await env.Moderation.ApproveAsync(item.ProfileId, env.Moderator.Id, "Looks good");

        var profile = await env.Db.CandidateProfiles.SingleAsync();
        Assert.Equal(ProfileStatus.Approved, profile.Status);
        Assert.Equal($"photo:{photo.Id}", profile.PhotoUrl);
        Assert.Equal(ReviewItemStatus.Approved, (await env.Db.ProfilePhotos.SingleAsync()).Status);
        Assert.Single(env.Db.Notifications.Where(n => n.UserId == env.Member.Id));
        Assert.NotNull(env.Sms.LastMessage);

        var publicFile = await env.Media.OpenPhotoAsync(photo.Id, new Viewer(null, false));
        Assert.Equal("image/jpeg", publicFile.ContentType);
        Assert.Empty(await env.Moderation.GetQueueAsync());
    }

    [Fact]
    public async Task Changes_requested_then_resubmitted_returns_to_the_queue()
    {
        var env = await CreateAsync();
        await CompleteUploadsAsync(env);
        await env.Review.SubmitAsync(env.Member.Id);
        var profileId = (await env.Db.CandidateProfiles.SingleAsync()).Id;

        await env.Moderation.RequestChangesAsync(profileId, env.Moderator.Id, new RequestChangesDto
        {
            Flags = { new ReviewFlagInputDto { Field = "about", Reason = "Contains a phone number" } }
        });

        var status = await env.Review.GetStatusAsync(env.Member.Id);
        Assert.Equal("ChangesRequested", status.Status);
        Assert.Equal("about", Assert.Single(status.Flags).Field);

        var resubmitted = await env.Review.SubmitAsync(env.Member.Id);
        Assert.Equal("Resubmitted", resubmitted.Status);
        Assert.Empty(resubmitted.Flags);
        Assert.Single(await env.Moderation.GetQueueAsync());
    }

    [Fact]
    public async Task Identity_documents_are_private_and_staff_views_are_logged()
    {
        var env = await CreateAsync();
        await CompleteUploadsAsync(env);
        var doc = await env.Db.KycDocuments.FirstAsync();
        var (stranger, _) = await TestDb.AddMemberAsync(env.Db, "Kasun", "+94770000002");

        await Assert.ThrowsAsync<AppException>(() => env.Media.OpenDocumentAsync(doc.Id, new Viewer(stranger.Id, false)));
        await Assert.ThrowsAsync<AppException>(() => env.Media.OpenDocumentAsync(doc.Id, new Viewer(null, false)));

        var owner = await env.Media.OpenDocumentAsync(doc.Id, new Viewer(env.Member.Id, false));
        Assert.NotNull(owner);
        Assert.Empty(env.Db.ProfileReviewLogs);

        await env.Media.OpenDocumentAsync(doc.Id, new Viewer(env.Moderator.Id, true));
        var log = await env.Db.ProfileReviewLogs.SingleAsync();
        Assert.Equal(ReviewAction.DocumentViewed, log.Action);
        Assert.Equal(env.Moderator.Id, log.ModeratorUserId);
    }

    [Fact]
    public async Task Documents_cannot_be_changed_while_under_review()
    {
        var env = await CreateAsync();
        await CompleteUploadsAsync(env);
        await env.Review.SubmitAsync(env.Member.Id);

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            env.Media.UploadDocumentAsync(env.Member.Id, "Selfie", new MemoryStream(Jpeg), Jpeg.Length));
        Assert.Equal(403, ex.Status);
    }

    [Fact]
    public async Task Admins_promote_moderators_but_cannot_change_admins_or_themselves()
    {
        var env = await CreateAsync();
        var admin = new User { FullName = "Admin", PhoneNumber = "+94770000100", Role = Roles.Admin };
        env.Db.Users.Add(admin);
        await env.Db.SaveChangesAsync();
        var staff = new StaffService(env.Db);

        var promoted = await staff.ChangeRoleAsync(admin.Id, env.Member.Id, "moderator");
        Assert.Equal(Roles.Moderator, promoted.Role);

        await Assert.ThrowsAsync<AppException>(() => staff.ChangeRoleAsync(admin.Id, admin.Id, "Member"));
        await Assert.ThrowsAsync<AppException>(() => staff.ChangeRoleAsync(env.Member.Id, admin.Id, "Member"));
        await Assert.ThrowsAsync<AppException>(() => staff.ChangeRoleAsync(admin.Id, env.Member.Id, "Admin"));
    }
}
