using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Route("api/vehicle-types")]
public class VehicleTypesController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, CancellationToken ct)
    {
        var query = db.VehicleTypes.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(v => v.Status == status);

        return Ok(await query.OrderBy(v => v.VehicleTypeId).ToListAsync(ct));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await db.VehicleTypes.AsNoTracking().FirstOrDefaultAsync(v => v.VehicleTypeId == id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] VehicleType request, CancellationToken ct)
    {
        if (await db.VehicleTypes.AnyAsync(v => v.TypeCode == request.TypeCode, ct))
            throw new BusinessException("TypeCode already exists.");

        db.VehicleTypes.Add(request);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = request.VehicleTypeId }, request);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] VehicleType request, CancellationToken ct)
    {
        var item = await db.VehicleTypes.FirstOrDefaultAsync(v => v.VehicleTypeId == id, ct)
            ?? throw new BusinessException("Vehicle type not found.", 404);

        item.TypeName = request.TypeName;
        item.Status = request.Status;
        await db.SaveChangesAsync(ct);
        return Ok(item);
    }
}
