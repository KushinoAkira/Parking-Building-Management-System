using System.ComponentModel.DataAnnotations;

namespace ParkingBuildingManagement.Api.Dtos;

public record LoginRequest(
    [Required][EmailAddress][MaxLength(100)] string Email,
    [Required][MinLength(6)][MaxLength(100)] string Password);

public record GoogleLoginRequest(
    [Required][MaxLength(4096)] string IdToken);

public record AuthProvidersResponse(bool HasLocalPassword, bool GoogleLinked);

public record RegisterRequest(
    [Required][MaxLength(150)] string FullName,
    [Required][EmailAddress][MaxLength(100)] string Email,
    [Required][MinLength(8)][MaxLength(100)] string Password,
    [MaxLength(20)] string? Phone);

public record AuthResponse(
    string Token,
    int UserId,
    string FullName,
    string Email,
    string RoleName,
    DateTime ExpiresAt);
