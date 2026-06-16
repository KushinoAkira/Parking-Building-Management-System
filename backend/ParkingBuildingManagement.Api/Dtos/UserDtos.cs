namespace ParkingBuildingManagement.Api.Dtos;

public record UserDto(
    int UserId,
    string FullName,
    string Email,
    string? Phone,
    int RoleId,
    string RoleName,
    string Status,
    DateTime CreatedAt);

public record CreateUserRequest(
    string FullName,
    string Email,
    string Password,
    string? Phone,
    int RoleId,
    string Status = "Active");

public record UpdateUserRequest(
    string FullName,
    string? Phone,
    int RoleId,
    string Status);
