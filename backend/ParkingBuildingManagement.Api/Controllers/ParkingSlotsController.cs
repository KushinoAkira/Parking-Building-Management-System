using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.DriverOrAbove)]
[Route("api/slots")]
public class ParkingSlotsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? zoneId,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = db.ParkingSlots
            .AsNoTracking()
            .Include(s => s.Zone)
            .ThenInclude(z => z.VehicleType)
            .AsQueryable();

        if (zoneId.HasValue)
            query = query.Where(s => s.ZoneId == zoneId.Value);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(s => s.Status == status);

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
            .ToListAsync(ct);

        return Ok(slots);
    }

    [HttpGet("map")]
    public async Task<IActionResult> GetMap(CancellationToken ct)
    {
        var map = await db.ParkingZones
            .AsNoTracking()
            .Include(z => z.VehicleType)
            .Include(z => z.ParkingSlots)
            .OrderBy(z => z.ZoneCode)
            .Select(z => new
            {
                z.ZoneId,
                z.ZoneCode,
                z.ZoneName,
                VehicleTypeCode = z.VehicleType.TypeCode,
                z.Capacity,
                z.Status,
                Slots = z.ParkingSlots.Select(s => new { s.SlotId, s.Status, s.Note }).OrderBy(s => s.SlotId),
            })
            .ToListAsync(ct);

        return Ok(map);
    }

    [HttpGet("{slotId}")]
    public async Task<IActionResult> GetById(string slotId, CancellationToken ct)
    {
        var slot = await db.ParkingSlots
            .AsNoTracking()
            .Include(s => s.Zone)
            .ThenInclude(z => z.VehicleType)
            .FirstOrDefaultAsync(s => s.SlotId == slotId, ct);

        return slot is null ? NotFound() : Ok(slot);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.ManagerOnly)]
    public async Task<IActionResult> Create([FromBody] ParkingSlot request, CancellationToken ct)
    {
        if (await db.ParkingSlots.AnyAsync(s => s.SlotId == request.SlotId, ct))
            throw new BusinessException("SlotId already exists.");

        if (!await db.ParkingZones.AnyAsync(z => z.ZoneId == request.ZoneId, ct))
            throw new BusinessException("Zone not found.", 404);

        db.ParkingSlots.Add(request);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { slotId = request.SlotId }, request);
    }

    [HttpPut("{slotId}/status")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> UpdateStatus(string slotId, [FromBody] UpdateSlotStatusRequest request, CancellationToken ct)
    {
        var slot = await db.ParkingSlots.FirstOrDefaultAsync(s => s.SlotId == slotId, ct)
            ?? throw new BusinessException("Slot not found.", 404);

        if (!SlotStatuses.IsStaffSettable(request.Status))
            throw new BusinessException($"Invalid slot status '{request.Status}'.");

        slot.Status = request.Status;
        slot.Note = request.Note ?? slot.Note;
        await db.SaveChangesAsync(ct);
        return Ok(slot);
    }
}

public record UpdateSlotStatusRequest(string Status, string? Note);
