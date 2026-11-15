namespace DatingApp.Application.Common.Interfaces;

/// <summary>
/// Private file store for photos and identity documents (S02-T03). Keys are opaque ("photos/2026/11/…jpg");
/// files are never reachable through a public static path — the API streams them after checking access.
/// Local disk today; a cloud implementation can replace it without touching callers.
/// </summary>
public interface IFileStorage
{
    Task<string> SaveAsync(Stream content, string folder, string extension, CancellationToken ct = default);
    Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default);
    Task DeleteAsync(string key, CancellationToken ct = default);
}
