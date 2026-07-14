using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Services;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.DriverOrAbove)]
[Route("api/subscription-plans")]
public class SubscriptionPlansController(ISubscriptionPlanService plans) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive, CancellationToken ct)
    {
        if (includeInactive && User.GetRoleName() == RoleNames.Driver)
            return Forbid();

        return Ok(await plans.GetAllAsync(includeInactive, ct));
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.ManagerOrAdmin)]
    public async Task<IActionResult> Create([FromBody] CreateSubscriptionPlanRequest request, CancellationToken ct)
    {
        var result = await plans.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetAll), new { }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleNames.ManagerOrAdmin)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSubscriptionPlanRequest request, CancellationToken ct) =>
        Ok(await plans.UpdateAsync(id, request, ct));
}
