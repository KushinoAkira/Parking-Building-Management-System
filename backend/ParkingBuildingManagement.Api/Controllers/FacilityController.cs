using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.DriverOrAbove)]
[Route("api/facility")]
public class FacilityController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var facility = await db.ParkingFacilities.AsNoTracking().FirstOrDefaultAsync(ct);
        return facility is null ? NotFound() : Ok(facility);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.ManagerOnly)]
    public async Task<IActionResult> Create([FromBody] ParkingFacility request, CancellationToken ct)
    {
        if (await db.ParkingFacilities.AnyAsync(ct))
            throw new BusinessException("Facility already exists. Use PUT to update.");

        db.ParkingFacilities.Add(request);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), request);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleNames.ManagerOnly)]
    public async Task<IActionResult> Update(int id, [FromBody] ParkingFacility request, CancellationToken ct)
    {
        var facility = await db.ParkingFacilities.FirstOrDefaultAsync(f => f.FacilityId == id, ct)
            ?? throw new BusinessException("Facility not found.", 404);

        facility.FacilityName = request.FacilityName;
        facility.Address = request.Address;
        facility.OpenTime = request.OpenTime;
        facility.CloseTime = request.CloseTime;
        facility.Status = request.Status;
        facility.Description = request.Description;

        await db.SaveChangesAsync(ct);
        return Ok(facility);
    }
}
