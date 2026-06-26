namespace ParkingBuildingManagement.Api.Realtime;

public static class RealtimeEventTypes
{
    public const string SessionCheckedIn = "sessionCheckedIn";
    public const string SessionCheckedOut = "sessionCheckedOut";
    public const string SlotUpdated = "slotUpdated";
    public const string ReservationUpdated = "reservationUpdated";
    public const string IncidentUpdated = "incidentUpdated";
    public const string DashboardRefresh = "dashboardRefresh";
    public const string WalletTopUpCompleted = "walletTopUpCompleted";
}

public record RealtimeEvent(
    string Type,
    string? Title,
    string? Message,
    object? Data,
    DateTime AtUtc);

public record SlotUpdateData(
    string SlotId,
    int ZoneId,
    string Status,
    string? LicensePlate);

public record SessionEventData(
    int SessionId,
    string TicketCode,
    string LicensePlate,
    string SlotId,
    int ZoneId,
    string Status,
    decimal? TotalFee,
    int? UserId);

public record ReservationEventData(
    int ReservationId,
    string? LicensePlate,
    string Status,
    int? UserId,
    string? SlotId);

public record IncidentEventData(
    int IncidentId,
    string IncidentType,
    string Status,
    decimal PenaltyFee,
    string? LicensePlate);
