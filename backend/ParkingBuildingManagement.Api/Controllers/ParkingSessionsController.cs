using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Services;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Route("api/parking-sessions")]
public class ParkingSessionsController(ApplicationDbContext db, IParkingSessionService sessionService) : ControllerBase
{
    [HttpGet]
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
    public async Task<IActionResult> GetByTicket(string ticketCode, CancellationToken ct)
    {
        var session = await sessionService.GetByTicketCodeAsync(ticketCode, ct);
        return session is null ? NotFound() : Ok(session);
    }

    [HttpGet("active/{licensePlate}")]
    public async Task<IActionResult> GetActiveByPlate(string licensePlate, CancellationToken ct)
    {
        var session = await sessionService.GetActiveByLicensePlateAsync(licensePlate, ct);
        return session is null ? NotFound() : Ok(session);
    }

    [HttpPost("check-in")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request, CancellationToken ct) =>
        Ok(await sessionService.CheckInAsync(request, ct));

    [HttpPost("{id:int}/check-out")]
    public async Task<IActionResult> CheckOut(int id, [FromBody] CheckOutRequest request, CancellationToken ct) =>
        Ok(await sessionService.CheckOutAsync(id, request, ct));
}
