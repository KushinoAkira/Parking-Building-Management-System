using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.DriverOrAbove)]
[Route("api/portal")]
public class PortalController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet("staff/overview")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
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
    [Authorize(Roles = RoleNames.StaffOrAbove)]
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
    [Authorize(Roles = RoleNames.StaffOrAbove)]
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
    [Authorize(Roles = RoleNames.StaffOrAbove)]
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

    [HttpGet("staff/reservations")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> GetStaffReservations(
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = db.Reservations.AsNoTracking()
            .Include(r => r.User)
            .Include(r => r.VehicleType)
            .Include(r => r.Zone)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.Status == status);
        else
            query = query.Where(r => r.Status == "Confirmed" || r.Status == "Pending");

        var items = await query
            .OrderBy(r => r.ReservedFrom)
            .Take(50)
            .Select(r => new
            {
                r.ReservationId,
                r.UserId,
                userName = r.User.FullName,
                r.LicensePlate,
                vehicleType = r.VehicleType.TypeCode,
                zoneCode = r.Zone != null ? r.Zone.ZoneCode : null,
                r.SlotId,
                r.ReservedFrom,
                r.ReservedTo,
                r.Status,
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("driver/{userId:int}/home")]
    public async Task<IActionResult> GetDriverHome(int userId, CancellationToken ct)
    {
        if (!User.CanAccessUserData(userId)) return Forbid();

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
        if (!User.CanAccessUserData(userId)) return Forbid();

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
        if (!User.CanAccessUserData(userId)) return Forbid();

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

    [HttpGet("manager/dashboard")]
    [Authorize(Roles = RoleNames.ManagerOnly)]
    public async Task<IActionResult> GetManagerDashboard(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var startOfMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var activeSessions = await db.ParkingSessions.CountAsync(s => s.Status == "Active", ct);

        var revenueToday = await db.Payments
            .Where(p => p.Status == "Completed" && p.PaymentTime >= today)
            .SumAsync(p => p.Amount, ct);

        var revenueMonth = await db.Payments
            .Where(p => p.Status == "Completed" && p.PaymentTime >= startOfMonth)
            .SumAsync(p => p.Amount, ct);

        var openIncidents = await db.Incidents.CountAsync(i => i.Status == "Open", ct);

        var totalSlots = await db.ParkingSlots.CountAsync(ct);
        var occupiedSlots = await db.ParkingSlots.CountAsync(s => s.Status == "Occupied", ct);
        var occupancyRate = totalSlots > 0 ? (double)occupiedSlots / totalSlots : 0;

        var recentTransactions = await db.Payments
            .AsNoTracking()
            .Where(p => p.Status == "Completed")
            .OrderByDescending(p => p.PaymentTime)
            .Take(5)
            .Select(p => new
            {
                p.PaymentId,
                p.Session.TicketCode,
                p.Amount,
                p.PaymentTime
            })
            .ToListAsync(ct);

        var recentIncidents = await db.Incidents
            .AsNoTracking()
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .Select(i => new
            {
                i.IncidentId,
                i.IncidentType,
                i.Status,
                i.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new
        {
            activeSessions,
            revenueToday,
            revenueMonth,
            openIncidents,
            occupancyRate,
            recentTransactions,
            recentIncidents
        });
    }

    [HttpGet("driver/{userId:int}/notifications")]
    public async Task<IActionResult> GetDriverNotifications(int userId, CancellationToken ct)
    {
        if (!User.CanAccessUserData(userId)) return Forbid();

        var notifications = new List<object>();

        var activeSession = await db.ParkingSessions
            .Include(s => s.Zone)
            .Where(s => s.UserId == userId && s.Status == "Active")
            .OrderByDescending(s => s.EntryTime)
            .FirstOrDefaultAsync(ct);

        if (activeSession != null)
        {
            notifications.Add(new
            {
                id = 1,
                title = "Đang đỗ xe",
                desc = $"Bạn đang đỗ xe tại {activeSession.Zone?.ZoneCode ?? "bãi"} - Slot {activeSession.SlotId}. Biển số {activeSession.LicensePlate}.",
                time = activeSession.EntryTime,
                unread = true,
                type = "session"
            });
        }

        notifications.Add(new
        {
            id = 2,
            title = "Giảm 20% phí đỗ xe",
            desc = "Áp dụng cho lần thanh toán tiếp theo qua ví.",
            time = DateTime.UtcNow.AddDays(-1),
            unread = false,
            type = "promotion"
        });

        return Ok(notifications);
    }
}
