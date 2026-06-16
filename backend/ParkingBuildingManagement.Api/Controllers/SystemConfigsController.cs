using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Route("api/system-configs")]
public class SystemConfigsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await db.SystemConfigs.AsNoTracking().OrderBy(c => c.ConfigKey).ToListAsync(ct));

    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key, CancellationToken ct)
    {
        var config = await db.SystemConfigs.AsNoTracking()
            .FirstOrDefaultAsync(c => c.ConfigKey == key, ct);

        return config is null ? NotFound() : Ok(config);
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Upsert(string key, [FromBody] UpsertConfigRequest request, CancellationToken ct)
    {
        var config = await db.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == key, ct);

        if (config is null)
        {
            config = new Models.SystemConfig
            {
                ConfigKey = key,
                ConfigValue = request.ConfigValue,
                Description = request.Description,
            };
            db.SystemConfigs.Add(config);
        }
        else
        {
            config.ConfigValue = request.ConfigValue;
            config.Description = request.Description ?? config.Description;
        }

        await db.SaveChangesAsync(ct);
        return Ok(config);
    }
}

public record UpsertConfigRequest(string ConfigValue, string? Description);
