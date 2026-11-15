using DatingApp.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace DatingApp.Infrastructure.Services;

/// <summary>
/// Files on the API server's disk (S02-T03, owner decision 2026-11-14). Root: <c>Storage:Root</c>, default
/// <c>&lt;content root&gt;/App_Data/uploads</c> — outside wwwroot, so nothing is reachable without the API's access checks.
/// Names are random GUIDs; keys are validated so they can never point outside the root.
/// </summary>
public class LocalDiskFileStorage : IFileStorage
{
    private readonly string _root;

    public LocalDiskFileStorage(IConfiguration configuration)
    {
        var configured = configuration["Storage:Root"];
        // "contentRoot" is set by the ASP.NET Core host; fall back to the app folder (tests, tools)
        var contentRoot = configuration["contentRoot"] ?? AppContext.BaseDirectory;
        _root = Path.GetFullPath(string.IsNullOrWhiteSpace(configured)
            ? Path.Combine(contentRoot, "App_Data", "uploads")
            : configured).TrimEnd(Path.DirectorySeparatorChar);
        Directory.CreateDirectory(_root);
    }

    public async Task<string> SaveAsync(Stream content, string folder, string extension, CancellationToken ct = default)
    {
        if (!IsSafeSegment(folder)) throw new ArgumentException("Invalid folder.", nameof(folder));
        if (!extension.StartsWith('.') || !IsSafeSegment(extension[1..])) throw new ArgumentException("Invalid extension.", nameof(extension));

        var now = DateTime.UtcNow;
        var key = $"{folder}/{now:yyyy}/{now:MM}/{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var path = PathFor(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);

        await using var file = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true);
        await content.CopyToAsync(file, ct);
        return key;
    }

    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default)
    {
        var path = PathFor(key);
        Stream? stream = File.Exists(path)
            ? new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true)
            : null;
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        var path = PathFor(key);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    private string PathFor(string key)
    {
        var full = Path.GetFullPath(Path.Combine(_root, key.Replace('/', Path.DirectorySeparatorChar)));
        if (!full.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new UnauthorizedAccessException("Storage key outside the storage root.");
        return full;
    }

    private static bool IsSafeSegment(string s) => s.Length is > 0 and <= 20 && s.All(char.IsLetterOrDigit);
}
