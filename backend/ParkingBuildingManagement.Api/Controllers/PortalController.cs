using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Route("api/portal")]
public class PortalController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet("staff/overview")]
    public async Task<IActionResult> GetStaffOverview(CancellationToken ct)
    {
        var activeSessions = await db.ParkingSessions.CountAsync(s => s.Status == "Active", ct);
        var openIncidents = await db.Incidents.CountAsync(i => i.Status == "Open", ct);
        var occupiedSlots = await db.ParkingSlots.CountAsync(s => s.Status == "Occupied", ct);
        var availableSlots = await db.ParkingSlots.CountAsync(s => s.Status == "Available", ct);

        return Ok(new
        {
            activeSessions,
            openIncidents,
            occupiedSlots,
            availableSlots,
            serverTime = DateTime.UtcNow,
        });
    }

    [HttpGet("staff/floors")]
    public async Task<IActionResult> GetStaffFloors(CancellationToken ct)
    {
        var floors = await db.ParkingZones
            .AsNoTracking()
            .Include(z => z.VehicleType)
            .OrderBy(z => z.ZoneCode)
            .Select(z => new
            {
                zoneId = z.ZoneId,
                zoneCode = z.ZoneCode,
                zoneName = z.ZoneName,
                vehicleType = z.VehicleType.TypeCode,
                capacity = z.Capacity,
                slots = z.ParkingSlots.OrderBy(s => s.SlotId).Select(s => new
                {
                    slotId = s.SlotId,
                    status = s.Status,
                    note = s.Note,
                    activeSession = s.ParkingSessions
                        .Where(ps => ps.Status == "Active")
                        .Select(ps => new { ps.SessionId, ps.LicensePlate, ps.EntryTime, ps.TicketCode })
                        .FirstOrDefault(),
                }),
            })
            .ToListAsync(ct);

        return Ok(floors);
    }

    [HttpGet("staff/violations")]
    public async Task<IActionResult> GetStaffViolations(CancellationToken ct)
    {
        var incidents = await db.Incidents
            .AsNoTracking()
            .Where(i => i.Status == "Open" || i.Status == "Resolved")
            .OrderByDescending(i => i.CreatedAt)
            .Take(100)
            .Select(i => new
            {
                i.IncidentId,
                i.SessionId,
                i.IncidentType,
                i.Description,
                i.PenaltyFee,
                i.Status,
                i.CreatedAt,
                i.ResolvedAt,
                plate = i.Session != null ? i.Session.LicensePlate : null,
            })
            .ToListAsync(ct);

        return Ok(incidents);
    }

    [HttpGet("staff/history")]
    public async Task<IActionResult> GetStaffHistory(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var start = from ?? DateTime.UtcNow.Date.AddDays(-7);
        var end = to ?? DateTime.UtcNow.Date.AddDays(1);

        var sessions = await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.EntryTime >= start && s.EntryTime < end)
            .OrderByDescending(s => s.EntryTime)
            .Take(200)
            .Select(s => new
            {
                s.SessionId,
                s.TicketCode,
                s.LicensePlate,
                s.SlotId,
                s.EntryTime,
                s.ExitTime,
                s.Status,
                s.TotalFee,
                zoneCode = s.Zone.ZoneCode,
            })
            .ToListAsync(ct);

        return Ok(sessions);
    }

    [HttpGet("driver/{userId:int}/home")]
    public async Task<IActionResult> GetDriverHome(int userId, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user is null) return NotFound();

        var activeSession = await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.Status == "Active")
            .OrderByDescending(s => s.EntryTime)
            .Select(s => new
            {
                s.SessionId,
                s.TicketCode,
                s.LicensePlate,
                s.EntryTime,
                s.EstimatedFee,
                s.SlotId,
                zoneCode = s.Zone.ZoneCode,
                vehicleType = s.VehicleType.TypeCode,
            })
            .FirstOrDefaultAsync(ct);

        var slotsSummary = await db.ParkingSlots
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new
            {
                total = g.Count(),
                available = g.Count(s => s.Status == "Available"),
                occupied = g.Count(s => s.Status == "Occupied"),
                reserved = g.Count(s => s.Status == "Reserved"),
            })
            .FirstOrDefaultAsync(ct);

        return Ok(new
        {
            user = new { user.UserId, user.FullName, user.Email, user.Phone },
            activeSession,
            slots = slotsSummary ?? new { total = 0, available = 0, occupied = 0, reserved = 0 },
        });
    }

    [HttpGet("driver/{userId:int}/tickets")]
    public async Task<IActionResult> GetDriverTickets(int userId, CancellationToken ct)
    {
        var tickets = await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.EntryTime)
            .Take(100)
            .Select(s => new
            {
                s.SessionId,
                s.TicketCode,
                s.LicensePlate,
                s.EntryTime,
                s.ExitTime,
                s.Status,
                s.TotalFee,
                s.SlotId,
                zoneCode = s.Zone.ZoneCode,
            })
            .ToListAsync(ct);

        return Ok(tickets);
    }

    [HttpGet("driver/{userId:int}/transactions")]
    public async Task<IActionResult> GetDriverTransactions(int userId, CancellationToken ct)
    {
        var transactions = await db.Payments
            .AsNoTracking()
            .Where(p => p.Session.UserId == userId)
            .OrderByDescending(p => p.PaymentTime)
            .Take(100)
            .Select(p => new
            {
                p.PaymentId,
                p.SessionId,
                p.Session.TicketCode,
                p.Session.LicensePlate,
                p.Amount,
                p.PaymentMethod,
                p.PaymentTime,
                p.Status,
            })
            .ToListAsync(ct);

        return Ok(transactions);
    }
}
