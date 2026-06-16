using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? roleId, [FromQuery] string? status, CancellationToken ct)
    {
        var query = db.Users.AsNoTracking().Include(u => u.Role).AsQueryable();

        if (roleId.HasValue)
            query = query.Where(u => u.RoleId == roleId.Value);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(u => u.Status == status);

        var users = await query
            .OrderBy(u => u.FullName)
            .Select(u => new UserDto(
                u.UserId, u.FullName, u.Email, u.Phone,
                u.RoleId, u.Role.RoleName, u.Status, u.CreatedAt))
            .ToListAsync(ct);

        return Ok(users);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId == id, ct);

        return user is null ? NotFound() : Ok(ToDto(user));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email, ct))
            throw new BusinessException("Email already exists.");

        if (!await db.Roles.AnyAsync(r => r.RoleId == request.RoleId, ct))
            throw new BusinessException("Role not found.", 404);

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone = request.Phone,
            RoleId = request.RoleId,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        user.Role = await db.Roles.FirstAsync(r => r.RoleId == user.RoleId, ct);
        return CreatedAtAction(nameof(GetById), new { id = user.UserId }, ToDto(user));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == id, ct)
            ?? throw new BusinessException("User not found.", 404);

        if (!await db.Roles.AnyAsync(r => r.RoleId == request.RoleId, ct))
            throw new BusinessException("Role not found.", 404);

        user.FullName = request.FullName;
        user.Phone = request.Phone;
        user.RoleId = request.RoleId;
        user.Status = request.Status;

        await db.SaveChangesAsync(ct);
        user.Role = await db.Roles.FirstAsync(r => r.RoleId == user.RoleId, ct);

        return Ok(ToDto(user));
    }

    private static UserDto ToDto(User u) =>
        new(u.UserId, u.FullName, u.Email, u.Phone, u.RoleId, u.Role.RoleName, u.Status, u.CreatedAt);
}
