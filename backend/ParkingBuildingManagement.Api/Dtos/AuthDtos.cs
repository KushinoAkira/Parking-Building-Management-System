namespace ParkingBuildingManagement.Api.Dtos;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string? Phone);

public record AuthResponse(
    string Token,
    int UserId,
    string FullName,
    string Email,
    string RoleName,
    DateTime ExpiresAt);
