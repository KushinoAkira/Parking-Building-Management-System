using Microsoft.AspNetCore.SignalR;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Hubs;
using ParkingBuildingManagement.Api.Realtime;

namespace ParkingBuildingManagement.Api.Services;

public interface IParkingRealtimeNotifier
{
    Task NotifySessionCheckedInAsync(SessionDto session, CancellationToken ct = default);
    Task NotifySessionCheckedOutAsync(CheckOutResultDto result, CancellationToken ct = default);
    Task NotifySlotUpdatedAsync(string slotId, int zoneId, string status, string? licensePlate, CancellationToken ct = default);
    Task NotifyReservationUpdatedAsync(ReservationDto reservation, string action, CancellationToken ct = default);
    Task NotifyIncidentUpdatedAsync(IncidentEventData incident, string action, CancellationToken ct = default);
    Task NotifyWalletTopUpAsync(int userId, int topUpId, decimal amount, decimal newBalance, CancellationToken ct = default);
}

public class ParkingRealtimeNotifier(IHubContext<ParkingHub> hub) : IParkingRealtimeNotifier
{
    private static SessionEventData MapSession(SessionDto s) => new(
        s.SessionId,
        s.TicketCode,
        s.LicensePlate,
        s.SlotId,
        s.ZoneId,
        s.Status,
        s.TotalFee,
        s.UserId);

    public async Task NotifySessionCheckedInAsync(SessionDto session, CancellationToken ct = default)
    {
        var data = MapSession(session);
        var evt = new RealtimeEvent(
            RealtimeEventTypes.SessionCheckedIn,
            "Vehicle checked in",
            $"{session.LicensePlate} → slot {session.SlotId}",
            data,
            DateTime.UtcNow);

        await hub.Clients.Group("operations").SendAsync("pbmsEvent", evt, ct);
        await NotifyDashboardRefreshAsync(ct);

        if (session.UserId.HasValue)
        {
            await hub.Clients.Group($"driver:{session.UserId.Value}")
                .SendAsync("pbmsEvent", evt, ct);
        }

        await hub.Clients.Group("all").SendAsync("slotUpdated", new SlotUpdateData(
            session.SlotId, session.ZoneId, "Occupied", session.LicensePlate), ct);
    }

    public async Task NotifySessionCheckedOutAsync(CheckOutResultDto result, CancellationToken ct = default)
    {
        var session = result.Session;
        var data = MapSession(session) with { TotalFee = result.TotalFee, Status = "Completed" };
        var evt = new RealtimeEvent(
            RealtimeEventTypes.SessionCheckedOut,
            "Vehicle checked out",
            $"{session.LicensePlate} — fee {result.TotalFee:N0}",
            data,
            DateTime.UtcNow);

        await hub.Clients.Group("operations").SendAsync("pbmsEvent", evt, ct);
        await NotifyDashboardRefreshAsync(ct);

        if (session.UserId.HasValue)
        {
            await hub.Clients.Group($"driver:{session.UserId.Value}")
                .SendAsync("pbmsEvent", evt, ct);
        }

        await hub.Clients.Group("all").SendAsync("slotUpdated", new SlotUpdateData(
            session.SlotId, session.ZoneId, "Available", null), ct);
    }

    public Task NotifySlotUpdatedAsync(string slotId, int zoneId, string status, string? licensePlate, CancellationToken ct = default)
    {
        var payload = new SlotUpdateData(slotId, zoneId, status, licensePlate);
        var evt = new RealtimeEvent(
            RealtimeEventTypes.SlotUpdated,
            "Slot updated",
            $"{slotId}: {status}",
            payload,
            DateTime.UtcNow);

        return hub.Clients.Group("operations").SendAsync("pbmsEvent", evt, ct);
    }

    public async Task NotifyReservationUpdatedAsync(ReservationDto reservation, string action, CancellationToken ct = default)
    {
        var data = new ReservationEventData(
            reservation.ReservationId,
            reservation.LicensePlate,
            reservation.Status,
            reservation.UserId,
            reservation.SlotId);

        var evt = new RealtimeEvent(
            RealtimeEventTypes.ReservationUpdated,
            $"Reservation {action}",
            reservation.LicensePlate ?? reservation.ReservationId.ToString(),
            data,
            DateTime.UtcNow);

        await hub.Clients.Group("operations").SendAsync("pbmsEvent", evt, ct);

        if (reservation.UserId > 0)
        {
            await hub.Clients.Group($"driver:{reservation.UserId}")
                .SendAsync("pbmsEvent", evt, ct);
        }

        if (!string.IsNullOrWhiteSpace(reservation.SlotId) && reservation.ZoneId.HasValue)
        {
            var slotStatus = reservation.Status switch
            {
                "Confirmed" => "Reserved",
                "Cancelled" or "Expired" => "Available",
                "CheckedIn" => "Occupied",
                _ => "Available",
            };
            await hub.Clients.Group("all").SendAsync("slotUpdated",
                new SlotUpdateData(reservation.SlotId, reservation.ZoneId.Value, slotStatus, reservation.LicensePlate), ct);
        }

        await NotifyDashboardRefreshAsync(ct);
    }

    public async Task NotifyIncidentUpdatedAsync(IncidentEventData incident, string action, CancellationToken ct = default)
    {
        var evt = new RealtimeEvent(
            RealtimeEventTypes.IncidentUpdated,
            $"Incident {action}",
            incident.IncidentType,
            incident,
            DateTime.UtcNow);

        await hub.Clients.Group("operations").SendAsync("pbmsEvent", evt, ct);
        await NotifyDashboardRefreshAsync(ct);
    }

    public Task NotifyWalletTopUpAsync(int userId, int topUpId, decimal amount, decimal newBalance, CancellationToken ct = default)
    {
        var evt = new RealtimeEvent(
            RealtimeEventTypes.WalletTopUpCompleted,
            "Wallet topped up",
            $"+{amount:N0} VND",
            new { topUpId, amount, balance = newBalance, userId },
            DateTime.UtcNow);

        return hub.Clients.Group($"driver:{userId}").SendAsync("pbmsEvent", evt, ct);
    }

    private Task NotifyDashboardRefreshAsync(CancellationToken ct = default)
    {
        var evt = new RealtimeEvent(
            RealtimeEventTypes.DashboardRefresh,
            null,
            null,
            null,
            DateTime.UtcNow);
        return hub.Clients.Group("operations").SendAsync("pbmsEvent", evt, ct);
    }
}
