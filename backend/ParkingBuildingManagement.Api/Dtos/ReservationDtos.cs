using System.ComponentModel.DataAnnotations;

namespace ParkingBuildingManagement.Api.Dtos;

public record CreateReservationRequest(
    [Range(1, int.MaxValue)] int UserId,
    [Range(1, int.MaxValue)] int VehicleTypeId,
    int? ZoneId,
    [MaxLength(20)] string? SlotId,
    [MaxLength(20)] string? LicensePlate,
    DateTime ReservedFrom,
    DateTime ReservedTo);

public record ReservationDto(
    int ReservationId,
    int UserId,
    string UserFullName,
    int VehicleTypeId,
    string VehicleTypeCode,
    int? ZoneId,
    string? ZoneCode,
    string? SlotId,
    string? LicensePlate,
    DateTime ReservedFrom,
    DateTime ReservedTo,
    string Status,
    DateTime CreatedAt);
