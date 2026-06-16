namespace ParkingBuildingManagement.Api.Dtos;

public record CreateReservationRequest(
    int UserId,
    int VehicleTypeId,
    int? ZoneId,
    string? SlotId,
    string? LicensePlate,
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
