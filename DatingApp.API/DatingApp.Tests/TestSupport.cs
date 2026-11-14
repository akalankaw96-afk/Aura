using System.Text.RegularExpressions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using DatingApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

/// <summary>A fresh in-memory database per test (no SQL Server needed — runs in CI).</summary>
public static class TestDb
{
    public static ApplicationDbContext Create()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"tests-{Guid.NewGuid():N}")
            .Options;
        return new ApplicationDbContext(options);
    }

    public static async Task<(User User, CandidateProfile Profile)> AddMemberAsync(ApplicationDbContext db, string name, string phone)
    {
        var user = new User { FullName = name, Email = $"{Guid.NewGuid():N}@example.test", PhoneNumber = phone, PhoneVerified = true };
        var profile = new CandidateProfile { UserId = user.Id, FullName = name, Code = $"VK-{Random.Shared.Next(1000, 9999)}" };
        db.Users.Add(user);
        db.CandidateProfiles.Add(profile);
        await db.SaveChangesAsync();
        return (user, profile);
    }

    public static async Task MatchAsync(ApplicationDbContext db, CandidateProfile a, CandidateProfile b)
    {
        db.MatchRequests.Add(new MatchRequest
        {
            SenderProfileId = a.Id,
            ReceiverProfileId = b.Id,
            Status = MatchRequestStatus.Accepted,
            RespondedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}

/// <summary>Keeps the last SMS so tests can read the code the member would receive.</summary>
public class CapturingSmsSender : ISmsSender
{
    public string? LastMessage { get; private set; }

    public Task SendAsync(string phoneNumber, string message, CancellationToken ct = default)
    {
        LastMessage = message;
        return Task.CompletedTask;
    }

    public string LastCode => Regex.Match(LastMessage ?? string.Empty, @"\b\d{6}\b").Value;
}

public class NoEmailSender : IEmailSender
{
    public Task SendAsync(string email, string subject, string body, CancellationToken ct = default) => Task.CompletedTask;
}

public class FakeJwt : IJwtTokenGenerator
{
    public AccessToken GenerateAccessToken(User user, Guid sessionId) =>
        new($"access-{user.Id:N}-{sessionId:N}-{Guid.NewGuid():N}", DateTime.UtcNow.AddMinutes(15));
}

public class FakePresence : IPresenceTracker
{
    public bool Connected(Guid userId, string connectionId) => true;
    public bool Disconnected(Guid userId, string connectionId) => true;
    public bool IsOnline(Guid userId) => false;
}
