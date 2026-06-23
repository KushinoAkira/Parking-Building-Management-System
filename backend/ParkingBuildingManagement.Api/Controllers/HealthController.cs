using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/health")]
public class HealthController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var database = "connected";
        try
        {
            if (!await db.Database.CanConnectAsync())
                database = "disconnected";
        }
        catch
        {
            database = "disconnected";
        }

        return Ok(new { status = "ok", database, timestamp = DateTime.UtcNow });
    }
}
