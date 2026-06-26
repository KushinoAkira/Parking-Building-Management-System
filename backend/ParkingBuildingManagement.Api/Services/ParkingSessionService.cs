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
}

public class ParkingSessionService(
    ApplicationDbContext db,
    ISlotAllocationService slotAllocation,
    IPricingService pricing,
    IParkingRealtimeNotifier realtime) : IParkingSessionService
{
    public async Task<SessionDto> CheckInAsync(CheckInRequest request, CancellationToken ct)
    {
        var plate = request.LicensePlate.Trim().ToUpperInvariant();

        if (await db.ParkingSessions.AnyAsync(s => s.LicensePlate == plate && s.Status == "Active", ct))
            throw new BusinessException($"License plate '{plate}' already has an active session.");

        Reservation? reservation = null;
        if (request.ReservationId.HasValue)
        {
            reservation = await db.Reservations
                .Include(r => r.Slot)
                .FirstOrDefaultAsync(r => r.ReservationId == request.ReservationId.Value, ct)
                ?? throw new BusinessException("Reservation not found.", 404);

            if (reservation.Status is not ("Confirmed" or "Pending"))
                throw new BusinessException($"Reservation cannot be checked in (status: {reservation.Status}).");

            if (!string.IsNullOrWhiteSpace(reservation.LicensePlate) &&
                reservation.LicensePlate.ToUpperInvariant() != plate)
                throw new BusinessException("License plate does not match reservation.");
        }

        var slot = reservation?.SlotId is not null
            ? await db.ParkingSlots.Include(s => s.Zone)
                .FirstAsync(s => s.SlotId == reservation.SlotId, ct)
            : await slotAllocation.FindAvailableSlotAsync(
                request.VehicleTypeId, request.ZoneId, request.SlotId, ct);

        if (slot.Status is not ("Available" or "Reserved"))
            throw new BusinessException($"Slot '{slot.SlotId}' is not available.");

        ParkingSession? session = null;
        await db.ExecuteInTransactionAsync(async () =>
        {
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
        }, ct);

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
        var session = await db.ParkingSessions
            .Include(s => s.Slot)
            .FirstOrDefaultAsync(s => s.SessionId == sessionId, ct)
            ?? throw new BusinessException("Session not found.", 404);

        if (session.Status != "Active" && session.Status != "Unpaid")
            throw new BusinessException($"Session cannot be checked out (status: {session.Status}).");

        var exitTime = DateTime.UtcNow;
        var totalFee = await pricing.CalculateFeeAsync(
            session.VehicleTypeId, session.EntryTime, exitTime, request.LostTicket, ct);

        var penaltyFee = await db.Incidents
            .Where(i => i.SessionId == sessionId && i.Status == "Open")
            .SumAsync(i => i.PenaltyFee, ct);
        totalFee += penaltyFee;

        Payment? payment = null;
        await db.ExecuteInTransactionAsync(async () =>
        {
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
        }, ct);

        var dto = await MapSessionAsync(sessionId, ct)
            ?? throw new BusinessException("Failed to load session after check-out.", 500);

        if (payment is null)
            throw new BusinessException("Failed to persist payment after check-out.", 500);

        var result = new CheckOutResultDto(dto, totalFee, payment.PaymentId, payment.PaymentMethod);
        await realtime.NotifySessionCheckedOutAsync(result, ct);
        return result;
    }

    public async Task<SessionDto?> GetByTicketCodeAsync(string ticketCode, CancellationToken ct) =>
        await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.TicketCode == ticketCode)
            .Select(SessionProjection)
            .FirstOrDefaultAsync(ct);

    public async Task<SessionDto?> GetActiveByLicensePlateAsync(string licensePlate, CancellationToken ct) =>
        await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.LicensePlate == licensePlate.ToUpperInvariant() && s.Status == "Active")
            .Select(SessionProjection)
            .FirstOrDefaultAsync(ct);

    private async Task<SessionDto?> MapSessionAsync(int sessionId, CancellationToken ct) =>
        await db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.SessionId == sessionId)
            .Select(SessionProjection)
            .FirstOrDefaultAsync(ct);

    private static readonly System.Linq.Expressions.Expression<Func<ParkingSession, SessionDto>> SessionProjection =
        s => new SessionDto(
            s.SessionId,
            s.TicketCode,
            s.UserId,
            s.ReservationId,
            s.VehicleTypeId,
            s.VehicleType.TypeCode,
            s.ZoneId,
            s.Zone.ZoneCode,
            s.SlotId,
            s.LicensePlate,
            s.EntryTime,
            s.ExitTime,
            s.EntryGate,
            s.ExitGate,
            s.EstimatedFee,
            s.TotalFee,
            s.Status,
            s.EntryStaffId,
            s.ExitStaffId,
            s.Note);
}
