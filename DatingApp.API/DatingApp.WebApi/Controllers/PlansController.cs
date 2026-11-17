using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>Public prices for the Plans page (S04-T01).</summary>
[AllowAnonymous]
[Route("api/plans")]
public class PlansController : BaseApiController
{
    private readonly IPricingService _pricing;

    public PlansController(IPricingService pricing)
    {
        _pricing = pricing;
    }

    /// <summary>Gold / Platinum for each length and the boost — amounts in cents and rupees, with the saving per length.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<PlanPriceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct) => Ok(await _pricing.GetPricesAsync(ct));
}
