using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Route("api/roles")]
public class RolesController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var roles = await db.Roles
            .AsNoTracking()
            .OrderBy(r => r.RoleId)
            .Select(r => new { r.RoleId, r.RoleName })
            .ToListAsync(ct);

        return Ok(roles);
    }
}
