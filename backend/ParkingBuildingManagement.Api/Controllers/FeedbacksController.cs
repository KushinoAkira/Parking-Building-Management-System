using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Route("api/feedbacks")]
public class FeedbacksController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? userId,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = db.Feedbacks.AsNoTracking()
            .Include(f => f.User)
            .Include(f => f.Session)
            .AsQueryable();

        if (userId.HasValue)
            query = query.Where(f => f.UserId == userId.Value);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(f => f.Status == status);

        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new
            {
                f.FeedbackId,
                f.UserId,
                UserName = f.User != null ? f.User.FullName : null,
                f.SessionId,
                TicketCode = f.Session != null ? f.Session.TicketCode : null,
                f.FeedbackType,
                f.Content,
                f.Status,
                f.CreatedAt,
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Feedback request, CancellationToken ct)
    {
        request.CreatedAt = DateTime.UtcNow;
        request.Status = "New";
        db.Feedbacks.Add(request);
        await db.SaveChangesAsync(ct);
        return Ok(request);
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateFeedbackStatusRequest request, CancellationToken ct)
    {
        var feedback = await db.Feedbacks.FirstOrDefaultAsync(f => f.FeedbackId == id, ct)
            ?? throw new BusinessException("Feedback not found.", 404);

        feedback.Status = request.Status;
        await db.SaveChangesAsync(ct);
        return Ok(feedback);
    }
}

public record UpdateFeedbackStatusRequest(string Status);
