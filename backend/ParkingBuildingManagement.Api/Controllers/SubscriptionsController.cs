using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Services;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.DriverOrAbove)]
[Route("api/subscriptions")]
public class SubscriptionsController(ISubscriptionService subscriptions) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int userId, CancellationToken ct)
    {
        if (!User.CanAccessUserData(userId))
            return Forbid();

        return Ok(await subscriptions.GetForUserAsync(userId, ct));
    }

    [HttpPost("buy")]
    [EnableRateLimiting("wallet")]
    public async Task<IActionResult> Buy([FromBody] BuySubscriptionRequest request, CancellationToken ct)
    {
        var userId = User.GetUserId()
            ?? throw new BusinessException("Unable to resolve current user.", 401);

        var result = await subscriptions.BuyAsync(userId, request, ct);
        return Ok(result);
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
    {
        var userId = User.GetUserId()
            ?? throw new BusinessException("Unable to resolve current user.", 401);

        return Ok(await subscriptions.CancelAsync(userId, id, ct));
    }
}
