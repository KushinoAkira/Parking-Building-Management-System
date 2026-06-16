using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Services;

public interface IPricingService
{
    Task<decimal> CalculateFeeAsync(int vehicleTypeId, DateTime entryTime, DateTime exitTime, bool lostTicket, CancellationToken ct);
    Task<decimal> EstimateFeeAsync(int vehicleTypeId, DateTime entryTime, CancellationToken ct);
}

public class PricingService(ApplicationDbContext db) : IPricingService
{
    public Task<decimal> EstimateFeeAsync(int vehicleTypeId, DateTime entryTime, CancellationToken ct) =>
        CalculateFeeAsync(vehicleTypeId, entryTime, DateTime.UtcNow, false, ct);

    public async Task<decimal> CalculateFeeAsync(
        int vehicleTypeId,
        DateTime entryTime,
        DateTime exitTime,
        bool lostTicket,
        CancellationToken ct)
    {
        var policy = await db.PricingPolicies
            .AsNoTracking()
            .Where(p => p.VehicleTypeId == vehicleTypeId && p.Status == "Active")
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(ct)
            ?? throw new BusinessException("No active pricing policy for this vehicle type.", 404);

        var duration = exitTime - entryTime;
        if (duration < TimeSpan.Zero)
            throw new BusinessException("Exit time cannot be before entry time.");

        var hours = Math.Max(1, (int)Math.Ceiling(duration.TotalHours));
        var fee = hours * policy.PricePerHour;

        if (policy.DailyMaxFee.HasValue && fee > policy.DailyMaxFee.Value)
            fee = policy.DailyMaxFee.Value;

        if (lostTicket)
            fee += policy.LostTicketFee;

        return fee;
    }
}
