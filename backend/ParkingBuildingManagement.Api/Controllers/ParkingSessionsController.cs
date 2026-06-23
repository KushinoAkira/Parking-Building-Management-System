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
[Route("api/parking-sessions")]
public class ParkingSessionsController(
    ApplicationDbContext db,
    IParkingSessionService sessionService,
    IPricingService pricing) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? licensePlate,
        [FromQuery] int? userId,
        CancellationToken ct)
    {
        var query = db.ParkingSessions.AsNoTracking()
            .Include(s => s.VehicleType).Include(s => s.Zone).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(s => s.Status == status);
        if (!string.IsNullOrWhiteSpace(licensePlate))
            query = query.Where(s => s.LicensePlate == licensePlate.ToUpperInvariant());
        if (userId.HasValue)
            query = query.Where(s => s.UserId == userId.Value);

        var sessions = await query
            .OrderByDescending(s => s.EntryTime)
            .Select(s => new SessionDto(
                s.SessionId, s.TicketCode, s.UserId, s.ReservationId,
                s.VehicleTypeId, s.VehicleType.TypeCode, s.ZoneId, s.Zone.ZoneCode,
                s.SlotId, s.LicensePlate, s.EntryTime, s.ExitTime,
                s.EntryGate, s.ExitGate, s.EstimatedFee, s.TotalFee, s.Status,
                s.EntryStaffId, s.ExitStaffId, s.Note))
            .ToListAsync(ct);

        return Ok(sessions);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var session = await db.ParkingSessions.AsNoTracking()
            .Include(s => s.VehicleType).Include(s => s.Zone)
            .Where(s => s.SessionId == id)
            .Select(s => new SessionDto(
                s.SessionId, s.TicketCode, s.UserId, s.ReservationId,
                s.VehicleTypeId, s.VehicleType.TypeCode, s.ZoneId, s.Zone.ZoneCode,
                s.SlotId, s.LicensePlate, s.EntryTime, s.ExitTime,
                s.EntryGate, s.ExitGate, s.EstimatedFee, s.TotalFee, s.Status,
                s.EntryStaffId, s.ExitStaffId, s.Note))
            .FirstOrDefaultAsync(ct);

        return session is null ? NotFound() : Ok(session);
    }

    [HttpGet("ticket/{ticketCode}")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> GetByTicket(string ticketCode, CancellationToken ct)
    {
        var session = await sessionService.GetByTicketCodeAsync(ticketCode, ct);
        return session is null ? NotFound() : Ok(session);
    }

       [HttpGet("active/{licensePlate}")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> GetActiveByPlate(string licensePlate, CancellationToken ct)
    {
        var session = await sessionService.GetActiveByLicensePlateAsync(licensePlate, ct);
        // Return 200 with null when no active session exists, so the caller
        // can distinguish "parked" vs "not parked" without a noisy 404.
        return Ok(session);
    }


    [HttpPost("check-in")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request, CancellationToken ct) =>
        Ok(await sessionService.CheckInAsync(request, ct));

    [HttpGet("{id:int}/estimate-fee")]
    public async Task<IActionResult> EstimateFee(int id, [FromQuery] bool lostTicket = false, CancellationToken ct = default)
    {
        var session = await db.ParkingSessions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.SessionId == id, ct);
        if (session is null) return NotFound();

        if (User.GetRoleName() == RoleNames.Driver && session.UserId != User.GetUserId())
            return Forbid();

        var parkingFee = await pricing.CalculateFeeAsync(
            session.VehicleTypeId, session.EntryTime, DateTime.UtcNow, lostTicket, ct);
        var penaltyFee = await db.Incidents
            .Where(i => i.SessionId == id && i.Status == "Open")
            .SumAsync(i => i.PenaltyFee, ct);

        return Ok(new
        {
            parkingFee,
            penaltyFee,
            totalFee = parkingFee + penaltyFee,
            estimatedAtCheckIn = session.EstimatedFee,
        });
    }

    [HttpPost("{id:int}/check-out")]
    public async Task<IActionResult> CheckOut(int id, [FromBody] CheckOutRequest request, CancellationToken ct)
    {
        if (User.GetRoleName() == RoleNames.Driver)
        {
            var session = await db.ParkingSessions.AsNoTracking()
                .FirstOrDefaultAsync(s => s.SessionId == id, ct);
            if (session is null) return NotFound();
            if (session.UserId != User.GetUserId())
                return Forbid();
        }

        return Ok(await sessionService.CheckOutAsync(id, request, ct));
    }
}
