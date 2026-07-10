namespace ParkingBuildingManagement.Api.Dtos;

using System.ComponentModel.DataAnnotations;

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
    [MinLength(8)] string Password,
    string? Phone,
    int RoleId,
    string Status = "Active");

public record UpdateUserRequest(
    string FullName,
    string? Phone,
    int RoleId,
    string Status);

public record ResetPasswordRequest([MinLength(8)] string NewPassword);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
