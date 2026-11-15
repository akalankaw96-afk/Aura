using DatingApp.Application.Common.Files;
using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>Member photos (S02-T04). Upload as multipart/form-data with a <c>file</c> field.</summary>
[Route("api/photos")]
public class PhotosController : BaseApiController
{
    private const long UploadLimit = FileRules.MaxBytes + 64 * 1024;
    private readonly IMediaService _media;

    public PhotosController(IMediaService media)
    {
        _media = media;
    }

    [Authorize]
    [HttpPost]
    [RequestSizeLimit(UploadLimit)]
    [ProducesResponseType(typeof(PhotoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload(IFormFile? file, CancellationToken ct)
    {
        if (file == null) return BadRequestProblem("Choose a photo to upload.");
        await using var stream = file.OpenReadStream();
        return Ok(await _media.UploadPhotoAsync(RequireUserId(), stream, file.Length, ct));
    }

    [Authorize]
    [HttpGet("mine")]
    [ProducesResponseType(typeof(List<PhotoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Mine(CancellationToken ct) => Ok(await _media.ListMyPhotosAsync(RequireUserId(), ct));

    [Authorize]
    [HttpPut("{id:guid}/main")]
    public async Task<IActionResult> SetMain(Guid id, CancellationToken ct)
    {
        await _media.SetMainPhotoAsync(RequireUserId(), id, ct);
        return NoContent();
    }

    [Authorize]
    [HttpPut("order")]
    public async Task<IActionResult> Reorder([FromBody] ReorderPhotosDto dto, CancellationToken ct)
    {
        await _media.ReorderPhotosAsync(RequireUserId(), dto.PhotoIds, ct);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _media.DeletePhotoAsync(RequireUserId(), id, ct);
        return NoContent();
    }

    /// <summary>The image. Approved photos of approved members: anyone with the link. Others: owner and staff (bearer token).</summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}/file")]
    public async Task<IActionResult> GetFile(Guid id, CancellationToken ct)
    {
        var file = await _media.OpenPhotoAsync(id, CurrentViewer, ct);
        Response.Headers.CacheControl = "private, max-age=300";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(file.Content, file.ContentType);
    }

    private ObjectResult BadRequestProblem(string title) =>
        Problem(title: title, statusCode: StatusCodes.Status400BadRequest);
}

/// <summary>Identity documents (S02-T05). Never public: owner and staff only, staff views logged.</summary>
[Authorize]
[Route("api/kyc")]
public class KycController : BaseApiController
{
    private const long UploadLimit = FileRules.MaxBytes + 64 * 1024;
    private readonly IMediaService _media;

    public KycController(IMediaService media)
    {
        _media = media;
    }

    /// <summary>multipart/form-data: <c>type</c> (NicFront · NicBack · Passport · Selfie) + <c>file</c>. Replaces an earlier upload of the same type.</summary>
    [HttpPost("documents")]
    [RequestSizeLimit(UploadLimit)]
    [ProducesResponseType(typeof(KycDocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Upload([FromForm] string? type, IFormFile? file, CancellationToken ct)
    {
        if (file == null) return Problem(title: "Choose a file to upload.", statusCode: StatusCodes.Status400BadRequest);
        await using var stream = file.OpenReadStream();
        return Ok(await _media.UploadDocumentAsync(RequireUserId(), type ?? string.Empty, stream, file.Length, ct));
    }

    [HttpGet("documents")]
    [ProducesResponseType(typeof(List<KycDocumentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Mine(CancellationToken ct) => Ok(await _media.ListMyDocumentsAsync(RequireUserId(), ct));

    [HttpGet("documents/{id:guid}/file")]
    public async Task<IActionResult> GetFile(Guid id, CancellationToken ct)
    {
        var file = await _media.OpenDocumentAsync(id, CurrentViewer, ct);
        Response.Headers.CacheControl = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(file.Content, file.ContentType);
    }
}
