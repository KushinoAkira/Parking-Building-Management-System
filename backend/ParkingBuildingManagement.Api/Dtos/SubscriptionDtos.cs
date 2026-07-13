using System.ComponentModel.DataAnnotations;

namespace ParkingBuildingManagement.Api.Dtos;

public record CreateSubscriptionPlanRequest(
    [Required][MaxLength(100)] string PlanName,
    [Range(1, int.MaxValue)] int VehicleTypeId,
    int? ZoneId,
    [Range(1, 3650)] int DurationDays,
    [Range(0, double.MaxValue)] decimal Price);

public record UpdateSubscriptionPlanRequest(
    [Required][MaxLength(100)] string PlanName,
    [Range(1, 3650)] int DurationDays,
    [Range(0, double.MaxValue)] decimal Price,
    [Required] string Status);

public record SubscriptionPlanDto(
    int PlanId,
    string PlanName,
    int VehicleTypeId,
    string VehicleTypeCode,
    int? ZoneId,
    string? ZoneCode,
    int DurationDays,
    decimal Price,
    string Status,
    DateTime CreatedAt);

public record BuySubscriptionRequest(
    [Range(1, int.MaxValue)] int PlanId,
    [Required][MaxLength(20)] string LicensePlate);

public record SubscriptionDto(
    int SubscriptionId,
    int UserId,
    int PlanId,
    string PlanName,
    int VehicleTypeId,
    string VehicleTypeCode,
    int? ZoneId,
    string? ZoneCode,
    string LicensePlate,
    DateTime StartDate,
    DateTime EndDate,
    decimal PricePaid,
    string Status,
    bool IsActive,
    DateTime CreatedAt);
