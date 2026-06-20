using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Services;

using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.DriverOrAbove)]
[Route("api/incidents")]
public class IncidentsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] int? sessionId,
        CancellationToken ct)
    {
        var query = db.Incidents.AsNoTracking()
            .Include(i => i.Session)
            .Include(i => i.ReportedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(i => i.Status == status);
        if (sessionId.HasValue)
            query = query.Where(i => i.SessionId == sessionId.Value);

        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new
            {
                i.IncidentId,
                i.SessionId,
                TicketCode = i.Session != null ? i.Session.TicketCode : null,
                i.ReportedById,
                ReportedByName = i.ReportedBy != null ? i.ReportedBy.FullName : null,
                i.IncidentType,
                i.Description,
                i.PenaltyFee,
                i.Status,
                i.CreatedAt,
                i.ResolvedAt,
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await db.Incidents.AsNoTracking()
            .Include(i => i.Session).Include(i => i.ReportedBy)
            .FirstOrDefaultAsync(i => i.IncidentId == id, ct);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.StaffOrAbove)]
    public async Task<IActionResult> Create([FromBody] CreateIncidentRequest request, CancellationToken ct)
    {
        var incident = new Incident
        {
            SessionId = request.SessionId,
            ReportedById = request.ReportedById ?? User.GetUserId(),
            IncidentType = request.IncidentType,
            Description = request.Description,
            PenaltyFee = request.PenaltyFee,
            Status = "Open",
            CreatedAt = DateTime.UtcNow,
        };
        db.Incidents.Add(incident);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = incident.IncidentId }, incident);
    }

    [HttpPost("{id:int}/resolve")]
    [Authorize(Roles = RoleNames.ManagerOnly)]
    public async Task<IActionResult> Resolve(int id, CancellationToken ct)
    {
        var incident = await db.Incidents.FirstOrDefaultAsync(i => i.IncidentId == id, ct)
            ?? throw new BusinessException("Incident not found.", 404);

        if (incident.Status != "Open")
            throw new BusinessException($"Incident is not open (status: {incident.Status}).");

        incident.Status = "Resolved";
        incident.ResolvedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(incident);
    }

    [HttpPost("{id:int}/cancel")]
    [Authorize(Roles = RoleNames.ManagerOnly)]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
    {
        var incident = await db.Incidents.FirstOrDefaultAsync(i => i.IncidentId == id, ct)
            ?? throw new BusinessException("Incident not found.", 404);

        incident.Status = "Cancelled";
        incident.ResolvedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(incident);
    }
}

public record CreateIncidentRequest(
    int? SessionId,
    int? ReportedById,
    string IncidentType,
    string? Description,
    decimal PenaltyFee = 0m);
