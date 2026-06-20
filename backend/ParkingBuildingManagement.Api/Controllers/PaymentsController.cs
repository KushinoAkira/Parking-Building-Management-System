using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.StaffOrAbove)]
[Route("api/payments")]
public class PaymentsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? sessionId,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = db.Payments.AsNoTracking()
            .Include(p => p.Session)
            .AsQueryable();

        if (sessionId.HasValue)
            query = query.Where(p => p.SessionId == sessionId.Value);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status == status);

        var payments = await query
            .OrderByDescending(p => p.PaymentTime)
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

        return Ok(payments);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var payment = await db.Payments.AsNoTracking()
            .Include(p => p.Session)
            .FirstOrDefaultAsync(p => p.PaymentId == id, ct);

        return payment is null ? NotFound() : Ok(payment);
    }
}
