using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Services;

public interface ISubscriptionService
{
    Task<List<SubscriptionDto>> GetForUserAsync(int userId, CancellationToken ct);
    Task<SubscriptionDto> BuyAsync(int userId, BuySubscriptionRequest request, CancellationToken ct);
    Task<SubscriptionDto> CancelAsync(int userId, int subscriptionId, CancellationToken ct);
    Task<Subscription?> GetActiveForPlateAsync(string licensePlate, int vehicleTypeId, int? zoneId, CancellationToken ct);
    Task<int> ExpireOverdueAsync(CancellationToken ct);
}

public class SubscriptionService(
    ApplicationDbContext db,
    IWalletService wallet) : ISubscriptionService
{
    public async Task<List<SubscriptionDto>> GetForUserAsync(int userId, CancellationToken ct) =>
        await db.Subscriptions.AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(DtoProjections.Subscription)
            .ToListAsync(ct);

    public async Task<SubscriptionDto> BuyAsync(int userId, BuySubscriptionRequest request, CancellationToken ct)
    {
        var plan = await db.SubscriptionPlans.AsNoTracking()
            .FirstOrDefaultAsync(p => p.PlanId == request.PlanId && p.Status == "Active", ct)
            ?? throw new BusinessException("Subscription plan not found or inactive.", 404);

        var plate = request.LicensePlate.Trim().ToUpperInvariant();
        var now = DateTime.UtcNow;

        var hasActive = await db.Subscriptions.AsNoTracking().AnyAsync(s =>
            s.LicensePlate == plate && s.VehicleTypeId == plan.VehicleTypeId && s.Status == "Active" && s.EndDate > now, ct);
        if (hasActive)
            throw new BusinessException("This license plate already has an active subscription for this vehicle type.");

        Subscription subscription = null!;
        await db.ExecuteInTransactionAsync(async () =>
        {
            await wallet.DeductWalletAsync(userId, plan.Price, ct);

            subscription = new Subscription
            {
                UserId = userId,
                PlanId = plan.PlanId,
                VehicleTypeId = plan.VehicleTypeId,
                ZoneId = plan.ZoneId,
                LicensePlate = plate,
                StartDate = now,
                EndDate = now.AddDays(plan.DurationDays),
                PricePaid = plan.Price,
                Status = "Active",
                CreatedAt = now,
            };
            db.Subscriptions.Add(subscription);
            await db.SaveChangesAsync(ct);
        }, ct);

        return await MapAsync(subscription.SubscriptionId, ct);
    }

    public async Task<SubscriptionDto> CancelAsync(int userId, int subscriptionId, CancellationToken ct)
    {
        var subscription = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriptionId == subscriptionId, ct)
            ?? throw new BusinessException("Subscription not found.", 404);

        if (subscription.UserId != userId)
            throw new BusinessException("Subscription does not belong to this user.", 403);
        if (subscription.Status != "Active")
            throw new BusinessException($"Subscription cannot be cancelled (status: {subscription.Status}).");

        subscription.Status = "Cancelled";
        await db.SaveChangesAsync(ct);

        return await MapAsync(subscriptionId, ct);
    }

    public async Task<Subscription?> GetActiveForPlateAsync(string licensePlate, int vehicleTypeId, int? zoneId, CancellationToken ct)
    {
        var plate = licensePlate.Trim().ToUpperInvariant();
        var now = DateTime.UtcNow;

        return await db.Subscriptions
            .Where(s => s.LicensePlate == plate
                && s.VehicleTypeId == vehicleTypeId
                && s.Status == "Active"
                && s.EndDate > now
                && (s.ZoneId == null || s.ZoneId == zoneId))
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<int> ExpireOverdueAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var overdue = await db.Subscriptions
            .Where(s => s.Status == "Active" && s.EndDate < now)
            .ToListAsync(ct);

        if (overdue.Count == 0)
            return 0;

        foreach (var subscription in overdue)
            subscription.Status = "Expired";

        await db.SaveChangesAsync(ct);
        return overdue.Count;
    }

    private async Task<SubscriptionDto> MapAsync(int subscriptionId, CancellationToken ct) =>
        await db.Subscriptions.AsNoTracking()
            .Where(s => s.SubscriptionId == subscriptionId)
            .Select(DtoProjections.Subscription)
            .FirstAsync(ct);
}
