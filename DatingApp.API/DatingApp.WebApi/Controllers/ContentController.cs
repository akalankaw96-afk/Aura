using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

public class ContentController : BaseApiController
{
    private readonly IContentService _contentService;

    public ContentController(IContentService contentService)
    {
        _contentService = contentService;
    }

    [HttpGet("home")]
    [ProducesResponseType(typeof(HomeContentDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHomeContent(CancellationToken ct)
    {
        var content = await _contentService.GetHomeContentAsync(ct);
        return Ok(content);
    }

    [HttpGet("stories")]
    [ProducesResponseType(typeof(List<SuccessStoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStories(CancellationToken ct)
    {
        var stories = await _contentService.GetStoriesAsync(ct);
        return Ok(stories);
    }

    [HttpGet("plans")]
    [ProducesResponseType(typeof(List<PricingPlanDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPlans(CancellationToken ct)
    {
        var plans = await _contentService.GetPlansAsync(ct);
        return Ok(plans);
    }

    [HttpGet("faqs")]
    [ProducesResponseType(typeof(List<FaqDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFaqs(CancellationToken ct)
    {
        var faqs = await _contentService.GetFaqsAsync(ct);
        return Ok(faqs);
    }
}

