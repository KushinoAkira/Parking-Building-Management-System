using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Services;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Route("api/reservations")]
public class ReservationsController(ApplicationDbContext db, IReservationService reservationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? userId,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = db.Reservations.AsNoTracking()
            .Include(r => r.User)
            .Include(r => r.VehicleType)
            .Include(r => r.Zone)
            .AsQueryable();

        if (userId.HasValue)
            query = query.Where(r => r.UserId == userId.Value);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.Status == status);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReservationDto(
                r.ReservationId,
                r.UserId,
                r.User.FullName,
                r.VehicleTypeId,
                r.VehicleType.TypeCode,
                r.ZoneId,
                r.Zone != null ? r.Zone.ZoneCode : null,
                r.SlotId,
                r.LicensePlate,
                r.ReservedFrom,
                r.ReservedTo,
                r.Status,
                r.CreatedAt))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await db.Reservations.AsNoTracking()
            .Include(r => r.User).Include(r => r.VehicleType).Include(r => r.Zone)
            .FirstOrDefaultAsync(r => r.ReservationId == id, ct);

        if (item is null) return NotFound();

        return Ok(new ReservationDto(
            item.ReservationId, item.UserId, item.User.FullName, item.VehicleTypeId,
            item.VehicleType.TypeCode, item.ZoneId, item.Zone?.ZoneCode, item.SlotId,
            item.LicensePlate, item.ReservedFrom, item.ReservedTo, item.Status, item.CreatedAt));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReservationRequest request, CancellationToken ct)
    {
        var result = await reservationService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.ReservationId }, result);
    }

    [HttpPost("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id, CancellationToken ct) =>
        Ok(await reservationService.ConfirmAsync(id, ct));

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct) =>
        Ok(await reservationService.CancelAsync(id, ct));
}
