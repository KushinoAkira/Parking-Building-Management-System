using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct);
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct);
}

public class AuthService(ApplicationDbContext db, IConfiguration config) : IAuthService
{
    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email, ct)
            ?? throw new BusinessException("Invalid email or password.", 401);

        if (user.Status == "Locked")
            throw new BusinessException("Account is locked.", 403);

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new BusinessException("Invalid email or password.", 401);

        return CreateToken(user);
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var fullName = request.FullName?.Trim() ?? string.Empty;

        if (string.IsNullOrEmpty(fullName))
            throw new BusinessException("Full name is required.");

        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            throw new BusinessException("Email already registered.");

        var driverRole = await db.Roles.FirstOrDefaultAsync(r => r.RoleName == "Driver", ct)
            ?? throw new BusinessException("Driver role not configured.", 500);

        var user = new User
        {
            FullName = fullName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone = request.Phone?.Trim(),
            RoleId = driverRole.RoleId,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        user.Role = driverRole;
        return CreateToken(user);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct)
            ?? throw new BusinessException("User not found.", 404);

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new BusinessException("Current password is incorrect.", 400);

        if (request.NewPassword.Length < 8)
            throw new BusinessException("New password must be at least 8 characters.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await db.SaveChangesAsync(ct);
    }

    private AuthResponse CreateToken(User user)
    {
        var secret = config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
        var issuer = config["Jwt:Issuer"] ?? "PBMS";
        var audience = config["Jwt:Audience"] ?? "PBMS";
        var expiryHours = int.TryParse(config["Jwt:ExpiryHours"], out var h) ? h : 24;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddHours(expiryHours);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.RoleName),
        };

        var token = new JwtSecurityToken(issuer, audience, claims, expires: expiresAt, signingCredentials: credentials);
        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthResponse(tokenString, user.UserId, user.FullName, user.Email, user.Role.RoleName, expiresAt);
    }
}
