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
    IPricingService pricing,
    ISubscriptionService subscriptions) : ControllerBase
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
            .Select(DtoProjections.Session)
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
            .Select(DtoProjections.Session)
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

    [HttpGet("search")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> SearchActive([FromQuery] string? plate, CancellationToken ct)
        => Ok(await sessionService.SearchActiveByPlateAsync(plate ?? "", ct));

    [HttpGet("active/{licensePlate}")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> GetActiveByPlate(string licensePlate, CancellationToken ct)
    {
        var session = await sessionService.GetActiveByLicensePlateAsync(licensePlate, ct);
        return session is null ? NotFound() : Ok(session);
    }

    [HttpPost("check-in")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request, CancellationToken ct)
    {
        var staffId = User.GetUserId();
        var req = request with { EntryStaffId = staffId ?? request.EntryStaffId };
        return Ok(await sessionService.CheckInAsync(req, ct));
    }

    [HttpGet("{id:int}/estimate-fee")]
    public async Task<IActionResult> EstimateFee(int id, [FromQuery] bool lostTicket = false, CancellationToken ct = default)
    {
        var session = await db.ParkingSessions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.SessionId == id, ct);
        if (session is null) return NotFound();

        if (!User.CanAccessSession(session.UserId))
            return Forbid();

        var subscription = await subscriptions.GetActiveForPlateAsync(
            session.LicensePlate, session.VehicleTypeId, session.ZoneId, ct);
        var coveredBySubscription = subscription is not null;

        var parkingFee = coveredBySubscription
            ? 0m
            : await pricing.CalculateFeeAsync(session.VehicleTypeId, session.EntryTime, DateTime.UtcNow, lostTicket, ct);
        var (penaltyFee, vipSurcharge) = await SessionCheckoutFees.GetExtrasAsync(
            db, id, session.ReservationId, ct);

        return Ok(new
        {
            parkingFee,
            penaltyFee,
            vipSurcharge,
            totalFee = parkingFee + penaltyFee + vipSurcharge,
            estimatedAtCheckIn = session.EstimatedFee,
            coveredBySubscription,
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
            if (!User.CanAccessSession(session.UserId))
                return Forbid();
        }
        else
        {
            var staffId = User.GetUserId();
            if (staffId.HasValue)
                request = request with { ExitStaffId = staffId };
        }

        return Ok(await sessionService.CheckOutAsync(id, request, ct));
    }
}
