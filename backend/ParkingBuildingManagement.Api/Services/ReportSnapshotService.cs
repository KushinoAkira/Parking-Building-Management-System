using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Services;

public interface IReportSnapshotService
{
    Task<ReportSnapshot> GenerateDailyAsync(DateOnly date, CancellationToken ct = default);
    Task<IReadOnlyList<ReportSnapshot>> ListAsync(int days, CancellationToken ct = default);
}

public class ReportSnapshotService(ApplicationDbContext db) : IReportSnapshotService
{
    public async Task<ReportSnapshot> GenerateDailyAsync(DateOnly date, CancellationToken ct = default)
    {
        var start = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);

        var existing = await db.ReportSnapshots
            .FirstOrDefaultAsync(r => r.ReportDate == date && r.VehicleTypeId == null, ct);

        var totalEntries = await db.ParkingSessions.CountAsync(
            s => s.EntryTime >= start && s.EntryTime < end, ct);
        var totalExits = await db.ParkingSessions.CountAsync(
            s => s.ExitTime >= start && s.ExitTime < end, ct);
        var totalRevenue = await db.Payments
            .Where(p => p.PaymentTime >= start && p.PaymentTime < end && p.Status == "Completed")
            .SumAsync(p => p.Amount, ct);

        var totalSlots = await db.ParkingSlots.CountAsync(ct);
        var occupiedAtEnd = await db.ParkingSlots.CountAsync(s => s.Status == "Occupied", ct);
        var occupancyRate = totalSlots > 0
            ? Math.Round((decimal)occupiedAtEnd / totalSlots * 100, 2)
            : 0m;

        var peakHour = await db.ParkingSessions
            .Where(s => s.EntryTime >= start && s.EntryTime < end)
            .GroupBy(s => s.EntryTime.Hour)
            .OrderByDescending(g => g.Count())
            .Select(g => (int?)g.Key)
            .FirstOrDefaultAsync(ct);

        if (existing is not null)
        {
            existing.TotalEntries = totalEntries;
            existing.TotalExits = totalExits;
            existing.TotalRevenue = totalRevenue;
            existing.OccupancyRate = occupancyRate;
            existing.PeakHour = peakHour;
            await db.SaveChangesAsync(ct);
            return existing;
        }

        var snapshot = new ReportSnapshot
        {
            ReportDate = date,
            VehicleTypeId = null,
            TotalEntries = totalEntries,
            TotalExits = totalExits,
            TotalRevenue = totalRevenue,
            OccupancyRate = occupancyRate,
            PeakHour = peakHour,
            CreatedAt = DateTime.UtcNow,
        };
        db.ReportSnapshots.Add(snapshot);
        await db.SaveChangesAsync(ct);
        return snapshot;
    }

    public async Task<IReadOnlyList<ReportSnapshot>> ListAsync(int days, CancellationToken ct = default)
    {
        var since = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-Math.Clamp(days, 1, 365)));
        return await db.ReportSnapshots
            .AsNoTracking()
            .Where(r => r.ReportDate >= since && r.VehicleTypeId == null)
            .OrderByDescending(r => r.ReportDate)
            .ToListAsync(ct);
    }
}
