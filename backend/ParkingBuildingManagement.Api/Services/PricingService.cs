using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Services;

public interface IPricingService
{
    Task<decimal> CalculateFeeAsync(int vehicleTypeId, DateTime entryTime, DateTime exitTime, bool lostTicket, CancellationToken ct);
    Task<decimal> EstimateFeeAsync(int vehicleTypeId, DateTime entryTime, CancellationToken ct);
    Task<decimal> GetVipSlotSurchargeAsync(CancellationToken ct);
}

public class PricingService(ApplicationDbContext db) : IPricingService
{
    public const string VipSlotSurchargeKey = "VIP_SLOT_SURCHARGE";
    public const string GracePeriodMinutesKey = "GRACE_PERIOD_MINUTES";
    public const decimal DefaultVipSurcharge = 10_000m;

    public async Task<decimal> GetVipSlotSurchargeAsync(CancellationToken ct)
    {
        var config = await db.SystemConfigs.AsNoTracking()
            .FirstOrDefaultAsync(c => c.ConfigKey == VipSlotSurchargeKey, ct);

        return config is not null
            && decimal.TryParse(config.ConfigValue, System.Globalization.NumberStyles.Number,
                System.Globalization.CultureInfo.InvariantCulture, out var amount)
            && amount >= 0
            ? amount
            : DefaultVipSurcharge;
    }

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

        var graceMinutes = await GetGracePeriodMinutesAsync(ct);
        if (duration.TotalMinutes <= graceMinutes)
            return lostTicket ? policy.LostTicketFee : 0m;

        var hours = Math.Max(1, (int)Math.Ceiling(duration.TotalHours));
        var fee = hours * policy.PricePerHour;

        if (policy.DailyMaxFee.HasValue && fee > policy.DailyMaxFee.Value)
            fee = policy.DailyMaxFee.Value;

        if (lostTicket)
            fee += policy.LostTicketFee;

        if (policy.OvertimeFee > 0)
        {
            var extraDays = Math.Max(0, (int)Math.Ceiling(duration.TotalHours / 24) - 1);
            if (extraDays > 0)
                fee += extraDays * policy.OvertimeFee;
        }

        return fee;
    }

    private async Task<int> GetGracePeriodMinutesAsync(CancellationToken ct)
    {
        var config = await db.SystemConfigs.AsNoTracking()
            .FirstOrDefaultAsync(c => c.ConfigKey == GracePeriodMinutesKey, ct);

        return config is not null
            && int.TryParse(config.ConfigValue, out var minutes)
            && minutes >= 0
            ? minutes
            : 0;
    }
}
