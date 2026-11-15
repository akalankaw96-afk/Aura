using DatingApp.Application.Common.Exceptions;

namespace DatingApp.Application.Common.Files;

/// <summary>What an uploaded file really is, judged by its first bytes — never by the name or the browser's claim.</summary>
public record DetectedFile(string ContentType, string Extension);

/// <summary>Upload checks (S02-T03): JPEG / PNG / WebP for photos, plus PDF for documents; at most 8 MB.</summary>
public static class FileRules
{
    public const long MaxBytes = 8 * 1024 * 1024;
    public const int MaxPhotos = 6;

    public static readonly DetectedFile Jpeg = new("image/jpeg", ".jpg");
    public static readonly DetectedFile Png = new("image/png", ".png");
    public static readonly DetectedFile WebP = new("image/webp", ".webp");
    public static readonly DetectedFile Pdf = new("application/pdf", ".pdf");

    public static DetectedFile? Detect(ReadOnlySpan<byte> head)
    {
        if (head.Length >= 3 && head[0] == 0xFF && head[1] == 0xD8 && head[2] == 0xFF) return Jpeg;
        if (head.Length >= 8 && head[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A })) return Png;
        if (head.Length >= 12 && head[..4].SequenceEqual("RIFF"u8) && head.Slice(8, 4).SequenceEqual("WEBP"u8)) return WebP;
        if (head.Length >= 5 && head[..5].SequenceEqual("%PDF-"u8)) return Pdf;
        return null;
    }

    /// <summary>Reads the upload into memory (≤ 8 MB), checks size and type, and returns the bytes + detected type.</summary>
    public static async Task<(byte[] Bytes, DetectedFile Type)> ReadAndCheckAsync(Stream content, long declaredLength, bool allowPdf, CancellationToken ct)
    {
        if (declaredLength <= 0) throw AppException.Validation("Choose a file to upload.", "file");
        if (declaredLength > MaxBytes) throw AppException.Validation("Files can be up to 8 MB.", "file");

        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        int read;
        while ((read = await content.ReadAsync(chunk, ct)) > 0)
        {
            if (buffer.Length + read > MaxBytes) throw AppException.Validation("Files can be up to 8 MB.", "file");
            buffer.Write(chunk, 0, read);
        }

        var bytes = buffer.ToArray();
        var type = Detect(bytes.AsSpan(0, Math.Min(bytes.Length, 16)));
        if (type == null || (type == Pdf && !allowPdf))
        {
            throw AppException.Validation(allowPdf ? "Upload a JPG, PNG, WebP or PDF file." : "Upload a JPG, PNG or WebP photo.", "file");
        }
        return (bytes, type);
    }
}
