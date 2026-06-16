namespace ParkingBuildingManagement.Api.Dtos;

public record CheckInRequest(
    string LicensePlate,
    int VehicleTypeId,
    string? SlotId,
    int? ZoneId,
    int? UserId,
    int? ReservationId,
    int? EntryStaffId,
    string? EntryGate,
    string? Note);

public record CheckOutRequest(
    int? ExitStaffId,
    string? ExitGate,
    string PaymentMethod,
    bool LostTicket = false,
    string? Note = null);

public record SessionDto(
    int SessionId,
    string TicketCode,
    int? UserId,
    int? ReservationId,
    int VehicleTypeId,
    string VehicleTypeCode,
    int ZoneId,
    string ZoneCode,
    string SlotId,
    string LicensePlate,
    DateTime EntryTime,
    DateTime? ExitTime,
    string? EntryGate,
    string? ExitGate,
    decimal? EstimatedFee,
    decimal? TotalFee,
    string Status,
    int? EntryStaffId,
    int? ExitStaffId,
    string? Note);

public record CheckOutResultDto(
    SessionDto Session,
    decimal TotalFee,
    int PaymentId,
    string PaymentMethod);
