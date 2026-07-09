using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Services;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.ManagerOnly)]
[Route("api/reports")]
public class ReportsController(ApplicationDbContext db, IReportSnapshotService snapshots) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var activeSessions = await db.ParkingSessions.CountAsync(s => s.Status == "Active", ct);
        var todayEntries = await db.ParkingSessions.CountAsync(
            s => s.EntryTime >= today && s.EntryTime < tomorrow, ct);
        var todayExits = await db.ParkingSessions.CountAsync(
            s => s.ExitTime >= today && s.ExitTime < tomorrow, ct);
        var todayRevenue = await db.Payments
            .Where(p => p.PaymentTime >= today && p.PaymentTime < tomorrow && p.Status == "Completed")
            .SumAsync(p => p.Amount, ct);

        var totalSlots = await db.ParkingSlots.CountAsync(ct);
        var occupiedSlots = await db.ParkingSlots.CountAsync(s => s.Status == "Occupied", ct);
        var reservedSlots = await db.ParkingSlots.CountAsync(s => s.Status == "Reserved", ct);
        var availableSlots = await db.ParkingSlots.CountAsync(s => s.Status == "Available", ct);

        var openIncidents = await db.Incidents.CountAsync(i => i.Status == "Open", ct);
        var pendingReservations = await db.Reservations.CountAsync(
            r => r.Status == "Pending" || r.Status == "Confirmed", ct);

        var occupancyRate = totalSlots > 0
            ? Math.Round((decimal)occupiedSlots / totalSlots * 100, 2)
            : 0m;

        return Ok(new
        {
            activeSessions,
            todayEntries,
            todayExits,
            todayRevenue,
            slots = new { totalSlots, availableSlots, occupiedSlots, reservedSlots, occupancyRate },
            openIncidents,
            pendingReservations,
        });
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenue(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var start = from ?? DateTime.UtcNow.Date.AddDays(-30);
        var end = to ?? DateTime.UtcNow.Date.AddDays(1);

        var revenue = await db.Payments
            .AsNoTracking()
            .Where(p => p.PaymentTime >= start && p.PaymentTime < end && p.Status == "Completed")
            .GroupBy(p => p.PaymentTime.Date)
            .Select(g => new { Date = g.Key, Total = g.Sum(p => p.Amount), Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync(ct);

        return Ok(revenue);
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessionStats(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var start = from ?? DateTime.UtcNow.Date.AddDays(-30);
        var end = to ?? DateTime.UtcNow.Date.AddDays(1);

        var stats = await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.EntryTime >= start && s.EntryTime < end)
            .GroupBy(s => s.VehicleType.TypeCode)
            .Select(g => new
            {
                VehicleTypeCode = g.Key,
                TotalSessions = g.Count(),
                Completed = g.Count(s => s.Status == "Completed"),
                Active = g.Count(s => s.Status == "Active"),
                TotalRevenue = g.Where(s => s.TotalFee != null).Sum(s => s.TotalFee ?? 0),
            })
            .ToListAsync(ct);

        return Ok(stats);
    }

    [HttpGet("occupancy")]
    public async Task<IActionResult> GetOccupancyByZone(CancellationToken ct)
    {
        var zones = await db.ParkingZones
            .AsNoTracking()
            .Include(z => z.VehicleType)
            .Select(z => new
            {
                z.ZoneId,
                z.ZoneCode,
                z.ZoneName,
                VehicleTypeCode = z.VehicleType.TypeCode,
                z.Capacity,
                Occupied = z.ParkingSlots.Count(s => s.Status == "Occupied"),
                Reserved = z.ParkingSlots.Count(s => s.Status == "Reserved"),
                Available = z.ParkingSlots.Count(s => s.Status == "Available"),
                OccupancyRate = z.Capacity > 0
                    ? Math.Round((decimal)z.ParkingSlots.Count(s => s.Status == "Occupied") / z.Capacity * 100, 2)
                    : 0m,
            })
            .OrderBy(z => z.ZoneCode)
            .ToListAsync(ct);

        return Ok(zones);
    }

    [HttpGet("snapshots")]
    public async Task<IActionResult> GetSnapshots([FromQuery] int days = 30, CancellationToken ct = default)
    {
        var items = await snapshots.ListAsync(days, ct);
        return Ok(items.Select(s => new
        {
            s.ReportId,
            s.ReportDate,
            s.TotalEntries,
            s.TotalExits,
            s.TotalRevenue,
            s.OccupancyRate,
            s.PeakHour,
            s.CreatedAt,
        }));
    }

    [HttpPost("snapshots/daily")]
    public async Task<IActionResult> GenerateDailySnapshot(
        [FromQuery] DateOnly? date,
        CancellationToken ct = default)
    {
        var target = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var snapshot = await snapshots.GenerateDailyAsync(target, ct);
        return Ok(snapshot);
    }
}
