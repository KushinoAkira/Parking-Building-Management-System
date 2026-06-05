using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var canConnect = await db.Database.CanConnectAsync(cancellationToken);

        return Ok(new
        {
            status = "ok",
            database = canConnect ? "connected" : "unavailable",
            timestamp = DateTime.UtcNow,
        });
    }
}
