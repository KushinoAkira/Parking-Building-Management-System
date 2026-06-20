using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.ManagerOrAdmin)]
[Route("api/pricing-policies")]
public class PricingPoliciesController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? vehicleTypeId, [FromQuery] string? status, CancellationToken ct)
    {
        var query = db.PricingPolicies.AsNoTracking().Include(p => p.VehicleType).AsQueryable();

        if (vehicleTypeId.HasValue)
            query = query.Where(p => p.VehicleTypeId == vehicleTypeId.Value);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status == status);

        var policies = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.PolicyId,
                p.VehicleTypeId,
                VehicleTypeCode = p.VehicleType.TypeCode,
                p.PolicyName,
                p.PricePerHour,
                p.DailyMaxFee,
                p.LostTicketFee,
                p.OvertimeFee,
                p.Status,
                p.CreatedAt,
            })
            .ToListAsync(ct);

        return Ok(policies);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var policy = await db.PricingPolicies.AsNoTracking()
            .Include(p => p.VehicleType)
            .FirstOrDefaultAsync(p => p.PolicyId == id, ct);

        return policy is null ? NotFound() : Ok(policy);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PricingPolicy request, CancellationToken ct)
    {
        if (!await db.VehicleTypes.AnyAsync(v => v.VehicleTypeId == request.VehicleTypeId, ct))
            throw new BusinessException("Vehicle type not found.", 404);

        request.CreatedAt = DateTime.UtcNow;
        db.PricingPolicies.Add(request);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = request.PolicyId }, request);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PricingPolicy request, CancellationToken ct)
    {
        var policy = await db.PricingPolicies.FirstOrDefaultAsync(p => p.PolicyId == id, ct)
            ?? throw new BusinessException("Pricing policy not found.", 404);

        policy.PolicyName = request.PolicyName;
        policy.PricePerHour = request.PricePerHour;
        policy.DailyMaxFee = request.DailyMaxFee;
        policy.LostTicketFee = request.LostTicketFee;
        policy.OvertimeFee = request.OvertimeFee;
        policy.Status = request.Status;

        await db.SaveChangesAsync(ct);
        return Ok(policy);
    }
}
