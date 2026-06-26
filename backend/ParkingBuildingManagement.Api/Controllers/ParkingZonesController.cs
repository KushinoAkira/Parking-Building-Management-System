using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;
using ParkingBuildingManagement.Api.Services;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.DriverOrAbove)]
[Route("api/zones")]
public class ParkingZonesController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? vehicleTypeId,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = db.ParkingZones.AsNoTracking().Include(z => z.VehicleType).AsQueryable();

        if (vehicleTypeId.HasValue)
            query = query.Where(z => z.VehicleTypeId == vehicleTypeId.Value);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(z => z.Status == status);

        var zones = await query
            .ToListAsync(ct);

        var ordered = zones
            .OrderBy(z => ParkingFloorCatalog.GetSortOrder(z.ZoneCode))
            .ThenBy(z => z.ZoneCode)
            .Select(z => new
            {
                z.ZoneId,
                z.ZoneCode,
                z.ZoneName,
                z.VehicleTypeId,
                VehicleTypeCode = z.VehicleType.TypeCode,
                z.Capacity,
                z.Status,
                AvailableSlots = z.ParkingSlots.Count(s => s.Status == "Available"),
                OccupiedSlots = z.ParkingSlots.Count(s => s.Status == "Occupied"),
                FloorNumber = ParkingFloorCatalog.GetFloorNumber(z.ZoneCode),
            })
            .ToList();

        return Ok(ordered);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var zone = await db.ParkingZones.AsNoTracking()
            .Include(z => z.VehicleType)
            .FirstOrDefaultAsync(z => z.ZoneId == id, ct);

        return zone is null ? NotFound() : Ok(zone);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.ManagerOnly)]
    public async Task<IActionResult> Create([FromBody] ParkingZone request, CancellationToken ct)
    {
        if (await db.ParkingZones.AnyAsync(z => z.ZoneCode == request.ZoneCode, ct))
            throw new BusinessException("ZoneCode already exists.");

        db.ParkingZones.Add(request);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = request.ZoneId }, request);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleNames.ManagerOnly)]
    public async Task<IActionResult> Update(int id, [FromBody] ParkingZone request, CancellationToken ct)
    {
        var zone = await db.ParkingZones.FirstOrDefaultAsync(z => z.ZoneId == id, ct)
            ?? throw new BusinessException("Zone not found.", 404);

        zone.ZoneName = request.ZoneName;
        zone.Capacity = request.Capacity;
        zone.Status = request.Status;
        await db.SaveChangesAsync(ct);
        return Ok(zone);
    }
}
