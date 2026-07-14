using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Services;

public interface ISubscriptionPlanService
{
    Task<List<SubscriptionPlanDto>> GetAllAsync(bool includeInactive, CancellationToken ct);
    Task<SubscriptionPlanDto> CreateAsync(CreateSubscriptionPlanRequest request, CancellationToken ct);
    Task<SubscriptionPlanDto> UpdateAsync(int planId, UpdateSubscriptionPlanRequest request, CancellationToken ct);
}

public class SubscriptionPlanService(ApplicationDbContext db) : ISubscriptionPlanService
{
    public async Task<List<SubscriptionPlanDto>> GetAllAsync(bool includeInactive, CancellationToken ct)
    {
        var query = db.SubscriptionPlans.AsNoTracking().AsQueryable();
        if (!includeInactive)
            query = query.Where(p => p.Status == "Active");

        return await query
            .OrderBy(p => p.PlanName)
            .Select(DtoProjections.SubscriptionPlan)
            .ToListAsync(ct);
    }

    public async Task<SubscriptionPlanDto> CreateAsync(CreateSubscriptionPlanRequest request, CancellationToken ct)
    {
        if (!await db.VehicleTypes.AnyAsync(v => v.VehicleTypeId == request.VehicleTypeId, ct))
            throw new BusinessException("Vehicle type not found.", 404);
        if (request.ZoneId.HasValue && !await db.ParkingZones.AnyAsync(z => z.ZoneId == request.ZoneId.Value, ct))
            throw new BusinessException("Zone not found.", 404);

        var plan = new SubscriptionPlan
        {
            PlanName = request.PlanName,
            VehicleTypeId = request.VehicleTypeId,
            ZoneId = request.ZoneId,
            DurationDays = request.DurationDays,
            Price = request.Price,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
        };
        db.SubscriptionPlans.Add(plan);
        await db.SaveChangesAsync(ct);

        return await MapAsync(plan.PlanId, ct);
    }

    public async Task<SubscriptionPlanDto> UpdateAsync(int planId, UpdateSubscriptionPlanRequest request, CancellationToken ct)
    {
        var plan = await db.SubscriptionPlans.FirstOrDefaultAsync(p => p.PlanId == planId, ct)
            ?? throw new BusinessException("Subscription plan not found.", 404);

        plan.PlanName = request.PlanName;
        plan.DurationDays = request.DurationDays;
        plan.Price = request.Price;
        plan.Status = request.Status;
        await db.SaveChangesAsync(ct);

        return await MapAsync(planId, ct);
    }

    private async Task<SubscriptionPlanDto> MapAsync(int planId, CancellationToken ct) =>
        await db.SubscriptionPlans.AsNoTracking()
            .Where(p => p.PlanId == planId)
            .Select(DtoProjections.SubscriptionPlan)
            .FirstAsync(ct);
}
