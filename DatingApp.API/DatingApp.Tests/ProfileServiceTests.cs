using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using DatingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>Profile save keeps only what the member entered (2026-11-14 registration data fix).</summary>
public class ProfileServiceTests
{
    private static async Task<User> NewAccountAsync(Infrastructure.Persistence.ApplicationDbContext db)
    {
        var user = new User { FullName = AuthService.PlaceholderName, PhoneNumber = "+94775551234", PhoneVerified = true };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    private static CreateProfileDto Valid() => new()
    {
        FullName = "  Isuru Yohan ",
        Email = "Isuru@Example.com",
        Gender = "male",
        DateOfBirth = new DateOnly(1997, 3, 14),
        Height = "5' 5\"",
        Profession = "Sales executive",
        ProfessionCategory = "Business",
        Education = "Bachelor's degree",
        Location = "Colombo",
        Country = "Sri Lanka",
        Religion = "Buddhist",
        Community = "Sinhalese",
        Bio = "Seller ",
        PhotoUrl = "avatar:m-quiff",
        Details = new ProfileDetailsDto { WhatsApp = "+94775551234", ProfileFor = "Myself" }
    };

    [Fact]
    public async Task Saving_the_profile_cleans_values_and_updates_the_account()
    {
        using var db = TestDb.Create();
        var user = await NewAccountAsync(db);
        var service = new ProfileService(db);

        var saved = await service.CreateOrUpdateProfileAsync(user.Id, Valid());

        var account = await db.Users.SingleAsync();
        Assert.Equal("Isuru Yohan", account.FullName);
        Assert.Equal("isuru@example.com", account.Email);

        var profile = await db.CandidateProfiles.SingleAsync();
        Assert.Equal("Seller", profile.Bio);
        Assert.Equal(new DateOnly(1997, 3, 14), profile.DateOfBirth);
        Assert.Equal(ProfileService.AgeOn(new DateOnly(1997, 3, 14), DateOnly.FromDateTime(DateTime.UtcNow)), saved.Age);
        Assert.Equal("1997-03-14", saved.DateOfBirth);
        Assert.Matches(@"^LK-\d{6}$", profile.Code);
        Assert.Equal("avatar:m-quiff", profile.PhotoUrl);
    }

    [Fact]
    public async Task Others_never_see_the_birth_date_or_WhatsApp()
    {
        using var db = TestDb.Create();
        var user = await NewAccountAsync(db);
        var service = new ProfileService(db);
        var saved = await service.CreateOrUpdateProfileAsync(user.Id, Valid());

        var publicView = await service.GetProfileByIdAsync(saved.Id, includeMemberDetails: true);

        Assert.NotNull(publicView);
        Assert.Null(publicView!.DateOfBirth);
        Assert.Null(publicView.Details?.WhatsApp);
    }

    [Fact]
    public async Task Images_are_not_stored_in_the_database()
    {
        using var db = TestDb.Create();
        var user = await NewAccountAsync(db);
        var dto = Valid();
        dto.PhotoUrl = "data:image/svg+xml;charset=utf-8,%3Csvg%3E";

        var ex = await Assert.ThrowsAsync<AppException>(() => new ProfileService(db).CreateOrUpdateProfileAsync(user.Id, dto));

        Assert.Equal(400, ex.Status);
    }

    [Fact]
    public async Task Under_18_or_missing_birth_date_is_refused()
    {
        using var db = TestDb.Create();
        var user = await NewAccountAsync(db);
        var service = new ProfileService(db);

        var young = Valid();
        young.DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-17);
        await Assert.ThrowsAsync<AppException>(() => service.CreateOrUpdateProfileAsync(user.Id, young));

        var missing = Valid();
        missing.DateOfBirth = null;
        await Assert.ThrowsAsync<AppException>(() => service.CreateOrUpdateProfileAsync(user.Id, missing));
    }

    [Fact]
    public async Task An_email_used_by_another_account_is_a_conflict()
    {
        using var db = TestDb.Create();
        db.Users.Add(new User { FullName = "Other", Email = "isuru@example.com" });
        var user = await NewAccountAsync(db);

        var ex = await Assert.ThrowsAsync<AppException>(() => new ProfileService(db).CreateOrUpdateProfileAsync(user.Id, Valid()));

        Assert.Equal(409, ex.Status);
    }
}
