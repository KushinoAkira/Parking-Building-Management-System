using System.ComponentModel.DataAnnotations;

namespace ParkingBuildingManagement.Api.Dtos;

public record CheckInRequest(
    [Required][MaxLength(20)] string LicensePlate,
    [Range(1, int.MaxValue)] int VehicleTypeId,
    [MaxLength(20)] string? SlotId,
    int? ZoneId,
    int? UserId,
    int? ReservationId,
    int? EntryStaffId,
    [MaxLength(50)] string? EntryGate,
    [MaxLength(500)] string? Note,
    bool? PreferVipSlot = false);

public record CheckOutRequest(
    int? ExitStaffId,
    [MaxLength(50)] string? ExitGate,
    [RegularExpression("^(Cash|BankTransfer|EWallet)$")] string PaymentMethod,
    bool LostTicket = false,
    [MaxLength(500)] string? Note = null);

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
    string PaymentMethod,
    bool CoveredBySubscription);
