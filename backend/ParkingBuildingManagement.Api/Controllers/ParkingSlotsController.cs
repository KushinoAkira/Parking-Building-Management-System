using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ParkingSlotsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? zoneId,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var query = db.ParkingSlots
            .AsNoTracking()
            .Include(s => s.Zone)
            .ThenInclude(z => z.VehicleType)
            .AsQueryable();

        if (zoneId.HasValue)
        {
            query = query.Where(s => s.ZoneId == zoneId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(s => s.Status == status);
        }

        var slots = await query
            .OrderBy(s => s.Zone.ZoneCode)
            .ThenBy(s => s.SlotId)
            .Select(s => new
            {
                s.SlotId,
                s.ZoneId,
                ZoneCode = s.Zone.ZoneCode,
                ZoneName = s.Zone.ZoneName,
                VehicleTypeCode = s.Zone.VehicleType.TypeCode,
                s.Status,
                s.Note,
            })
            .ToListAsync(cancellationToken);

        return Ok(slots);
    }
}
