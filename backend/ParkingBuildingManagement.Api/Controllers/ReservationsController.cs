using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Services;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.DriverOrAbove)]
[Route("api/reservations")]
public class ReservationsController(
    ApplicationDbContext db,
    IReservationService reservationService,
    IPricingService pricing) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? userId,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var effectiveUserId = userId;
        if (User.GetRoleName() == RoleNames.Driver)
            effectiveUserId = User.GetUserId();

        var query = db.Reservations.AsNoTracking()
            .Include(r => r.User)
            .Include(r => r.VehicleType)
            .Include(r => r.Zone)
            .AsQueryable();

        if (effectiveUserId.HasValue)
            query = query.Where(r => r.UserId == effectiveUserId.Value);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.Status == status);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(DtoProjections.Reservation)
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await db.Reservations.AsNoTracking()
            .Where(r => r.ReservationId == id)
            .Select(DtoProjections.Reservation)
            .FirstOrDefaultAsync(ct);

        if (item is null) return NotFound();
        if (!User.CanAccessUserData(item.UserId))
            return Forbid();

        return Ok(item);
    }

    [HttpGet("vip-surcharge")]
    public async Task<IActionResult> GetVipSurcharge(CancellationToken ct) =>
        Ok(new VipSurchargeDto(await pricing.GetVipSlotSurchargeAsync(ct)));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReservationRequest request, CancellationToken ct)
    {
        if (User.GetRoleName() == RoleNames.Driver && request.UserId != User.GetUserId())
            return Forbid();

        var result = await reservationService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.ReservationId }, result);
    }

    [HttpPost("{id:int}/confirm")]
    [Authorize(Roles = RoleNames.DriverOrAbove)]
    public async Task<IActionResult> Confirm(int id, CancellationToken ct)
    {
        if (User.GetRoleName() == RoleNames.Driver)
        {
            var reservation = await db.Reservations.AsNoTracking()
                .FirstOrDefaultAsync(r => r.ReservationId == id, ct);
            if (reservation is null) return NotFound();
            if (reservation.UserId != User.GetUserId()) return Forbid();
        }

        return Ok(await reservationService.ConfirmAsync(id, ct));
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
    {
        if (User.GetRoleName() == RoleNames.Driver)
        {
            var reservation = await db.Reservations.AsNoTracking()
                .FirstOrDefaultAsync(r => r.ReservationId == id, ct);
            if (reservation is null) return NotFound();
            if (reservation.UserId != User.GetUserId()) return Forbid();
        }

        return Ok(await reservationService.CancelAsync(id, ct));
    }
}
