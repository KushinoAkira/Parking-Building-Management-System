using System.Data;
using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Services;

public interface IParkingSessionService
{
    Task<SessionDto> CheckInAsync(CheckInRequest request, CancellationToken ct);
    Task<CheckOutResultDto> CheckOutAsync(int sessionId, CheckOutRequest request, CancellationToken ct);
    Task<SessionDto?> GetByTicketCodeAsync(string ticketCode, CancellationToken ct);
    Task<SessionDto?> GetActiveByLicensePlateAsync(string licensePlate, CancellationToken ct);
    Task<List<SessionDto>> SearchActiveByPlateAsync(string plateTerm, CancellationToken ct);
}

public class ParkingSessionService(
    ApplicationDbContext db,
    ISlotAllocationService slotAllocation,
    IPricingService pricing,
    ISubscriptionService subscriptions,
    IParkingRealtimeNotifier realtime) : IParkingSessionService
{
    public async Task<SessionDto> CheckInAsync(CheckInRequest request, CancellationToken ct)
    {
        // Normalize: strip all internal whitespace so "45F  28889" == "45F28889"
        var plate = System.Text.RegularExpressions.Regex.Replace(
            request.LicensePlate.Trim().ToUpperInvariant(), @"\s+", "");

        Reservation? reservation = null;
        if (request.ReservationId.HasValue)
        {
            reservation = await db.Reservations
                .Include(r => r.Slot)
                .FirstOrDefaultAsync(r => r.ReservationId == request.ReservationId.Value, ct)
                ?? throw new BusinessException("Reservation not found.", 404);

            if (reservation.Status is not ("Confirmed" or "Pending"))
                throw new BusinessException($"Reservation cannot be checked in (status: {reservation.Status}).");

            if (!string.IsNullOrWhiteSpace(reservation.LicensePlate))
            {
                var reservedPlate = System.Text.RegularExpressions.Regex.Replace(
                    reservation.LicensePlate.Trim().ToUpperInvariant(), @"\s+", "");
                if (reservedPlate != plate)
                    throw new BusinessException("License plate does not match reservation.");
            }
        }

        var slotId = reservation?.SlotId
            ?? (await slotAllocation.FindAvailableSlotAsync(
                request.VehicleTypeId, request.ZoneId, request.SlotId, request.PreferVipSlot ?? (reservation?.PreferVipSlot ?? false), ct)).SlotId;

        ParkingSession? session = null;
        await db.ExecuteInTransactionAsync(async () =>
        {
            if (await db.ParkingSessions.AnyAsync(s => s.LicensePlate == plate && s.Status == "Active", ct))
                throw new BusinessException($"License plate '{plate}' already has an active session.");

            var slot = await db.ParkingSlots.Include(s => s.Zone)
                .FirstAsync(s => s.SlotId == slotId, ct);

            if (slot.Status is not ("Available" or "Reserved"))
                throw new BusinessException($"Slot '{slot.SlotId}' is not available.");

            session = new ParkingSession
            {
                TicketCode = TicketCodeGenerator.Generate(),
                UserId = request.UserId ?? reservation?.UserId,
                ReservationId = request.ReservationId ?? reservation?.ReservationId,
                VehicleTypeId = request.VehicleTypeId,
                ZoneId = slot.ZoneId,
                SlotId = slot.SlotId,
                LicensePlate = plate,
                EntryTime = DateTime.UtcNow,
                EntryGate = request.EntryGate,
                EntryStaffId = request.EntryStaffId,
                Note = request.Note,
                Status = "Active",
            };

            session.EstimatedFee = await pricing.EstimateFeeAsync(request.VehicleTypeId, session.EntryTime, ct);

            slot.Status = "Occupied";
            db.ParkingSessions.Add(session);

            if (reservation is not null)
                reservation.Status = "CheckedIn";

            await db.SaveChangesAsync(ct);
        }, IsolationLevel.Serializable, ct);

        return session is not null && await MapSessionAsync(session.SessionId, ct)
            is { } dto
            ? await NotifyCheckInAsync(dto, ct)
            : throw new BusinessException("Failed to load session after check-in.", 500);
    }

    private async Task<SessionDto> NotifyCheckInAsync(SessionDto dto, CancellationToken ct)
    {
        await realtime.NotifySessionCheckedInAsync(dto, ct);
        return dto;
    }

    public async Task<CheckOutResultDto> CheckOutAsync(int sessionId, CheckOutRequest request, CancellationToken ct)
    {
        var exitTime = DateTime.UtcNow;
        Payment? payment = null;
        decimal totalFee = 0;
        var coveredBySubscription = false;

        await db.ExecuteInTransactionAsync(async () =>
        {
            var session = await db.ParkingSessions
                .Include(s => s.Slot)
                .FirstOrDefaultAsync(s => s.SessionId == sessionId, ct)
                ?? throw new BusinessException("Session not found.", 404);

            if (session.Status != "Active" && session.Status != "Unpaid")
                throw new BusinessException($"Session cannot be checked out (status: {session.Status}).");

            var subscription = await subscriptions.GetActiveForPlateAsync(
                session.LicensePlate, session.VehicleTypeId, session.ZoneId, ct);
            coveredBySubscription = subscription is not null;

            var parkingFee = coveredBySubscription
                ? 0m
                : await pricing.CalculateFeeAsync(
                    session.VehicleTypeId, session.EntryTime, exitTime, request.LostTicket, ct);

            var (penaltyFee, vipSurcharge) = await SessionCheckoutFees.GetExtrasAsync(
                db, sessionId, session.ReservationId, ct);
            totalFee = parkingFee + penaltyFee + vipSurcharge;

            if (request.PaymentMethod == "EWallet")
            {
                if (!session.UserId.HasValue)
                    throw new BusinessException("EWallet requires a registered driver account.", 400);

                var driver = await db.Users.FirstAsync(u => u.UserId == session.UserId.Value, ct);
                if (driver.WalletBalance < totalFee)
                    throw new BusinessException("Insufficient wallet balance. Please top up your account.", 400);
                driver.WalletBalance -= totalFee;
            }

            payment = new Payment
            {
                SessionId = sessionId,
                Amount = totalFee,
                PaymentMethod = request.PaymentMethod,
                PaymentTime = exitTime,
                Status = "Completed",
            };

            session.ExitTime = exitTime;
            session.ExitGate = request.ExitGate;
            session.ExitStaffId = request.ExitStaffId;
            session.TotalFee = totalFee;
            session.Status = "Completed";
            session.Note = request.Note ?? session.Note;
            session.Slot.Status = "Available";

            db.Payments.Add(payment);
            await db.SaveChangesAsync(ct);
        }, IsolationLevel.Serializable, ct);

        var dto = await MapSessionAsync(sessionId, ct)
            ?? throw new BusinessException("Failed to load session after check-out.", 500);

        if (payment is null)
            throw new BusinessException("Failed to persist payment after check-out.", 500);

        var result = new CheckOutResultDto(dto, totalFee, payment.PaymentId, payment.PaymentMethod, coveredBySubscription);
        await realtime.NotifySessionCheckedOutAsync(result, ct);
        return result;
    }

    public async Task<SessionDto?> GetByTicketCodeAsync(string ticketCode, CancellationToken ct) =>
        await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.TicketCode == ticketCode)
            .Select(DtoProjections.Session)
            .FirstOrDefaultAsync(ct);

    public async Task<SessionDto?> GetActiveByLicensePlateAsync(string licensePlate, CancellationToken ct) =>
        await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.LicensePlate == licensePlate.ToUpperInvariant() && s.Status == "Active")
            .Select(DtoProjections.Session)
            .FirstOrDefaultAsync(ct);

    public async Task<List<SessionDto>> SearchActiveByPlateAsync(string plateTerm, CancellationToken ct)
    {
        // Strip internal whitespace to match how plates are stored (check-in normalizes the same way).
        // e.g. user types "99-E1 222.68" → term becomes "99-E1222.68" → matches DB value.
        var term = System.Text.RegularExpressions.Regex.Replace(
            plateTerm.Trim().ToUpperInvariant(), @"\s+", "");
        if (term.Length == 0)
            return [];

        return await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.Status == "Active" && s.LicensePlate.Contains(term))
            .OrderBy(s => s.LicensePlate)
            .Take(20)
            .Select(DtoProjections.Session)
            .ToListAsync(ct);
    }

    private async Task<SessionDto?> MapSessionAsync(int sessionId, CancellationToken ct) =>
        await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.SessionId == sessionId)
            .Select(DtoProjections.Session)
            .FirstOrDefaultAsync(ct);

}
