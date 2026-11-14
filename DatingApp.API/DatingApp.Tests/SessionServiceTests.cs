using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Services;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Tests;

public class SessionServiceTests
{
    private static readonly ClientInfo Client = new("127.0.0.1", "tests");

    [Fact]
    public async Task Refresh_rotates_the_token()
    {
        using var db = TestDb.Create();
        var (user, _) = await TestDb.AddMemberAsync(db, "Nadee Perera", "+94770000001");
        var sessions = new SessionService(db, new FakeJwt());

        var start = await sessions.StartAsync(user, Client);
        var next = await sessions.RefreshAsync(start.RefreshToken, Client);

        Assert.NotEqual(start.RefreshToken, next.RefreshToken);
        Assert.False(string.IsNullOrEmpty(next.Response.Token));
        Assert.Equal(1, await db.RefreshTokens.CountAsync(t => t.RevokedAt == null));
    }

    [Fact]
    public async Task Reusing_a_rotated_token_ends_the_session()
    {
        using var db = TestDb.Create();
        var (user, _) = await TestDb.AddMemberAsync(db, "Nadee Perera", "+94770000001");
        var sessions = new SessionService(db, new FakeJwt());

        var start = await sessions.StartAsync(user, Client);
        var next = await sessions.RefreshAsync(start.RefreshToken, Client);

        // pretend the rotation happened a while ago (outside the two-tab grace period)
        foreach (var t in db.RefreshTokens.Where(t => t.RevokedAt != null))
            t.RevokedAt = DateTime.UtcNow.AddMinutes(-5);
        await db.SaveChangesAsync();

        var reuse = await Assert.ThrowsAsync<AppException>(() => sessions.RefreshAsync(start.RefreshToken, Client));
        Assert.Equal(401, reuse.Status);

        // the newer token of the same session no longer works either
        var stolen = await Assert.ThrowsAsync<AppException>(() => sessions.RefreshAsync(next.RefreshToken, Client));
        Assert.Equal(401, stolen.Status);
    }

    [Fact]
    public async Task Logout_revokes_the_session()
    {
        using var db = TestDb.Create();
        var (user, _) = await TestDb.AddMemberAsync(db, "Nadee Perera", "+94770000001");
        var sessions = new SessionService(db, new FakeJwt());

        var start = await sessions.StartAsync(user, Client);
        await sessions.EndAsync(start.RefreshToken);

        await Assert.ThrowsAsync<AppException>(() => sessions.RefreshAsync(start.RefreshToken, Client));
    }

    [Fact]
    public async Task Refresh_tokens_are_stored_hashed()
    {
        using var db = TestDb.Create();
        var (user, _) = await TestDb.AddMemberAsync(db, "Nadee Perera", "+94770000001");
        var sessions = new SessionService(db, new FakeJwt());

        var start = await sessions.StartAsync(user, Client);

        var stored = Assert.Single(db.RefreshTokens);
        Assert.NotEqual(start.RefreshToken, stored.TokenHash);
    }
}
