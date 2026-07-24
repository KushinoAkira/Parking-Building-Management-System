using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Services;

public interface IReservationService
{
    Task<ReservationDto> CreateAsync(CreateReservationRequest request, CancellationToken ct);
    Task<ReservationDto> ConfirmAsync(int reservationId, CancellationToken ct);
    Task<ReservationDto> CancelAsync(int reservationId, CancellationToken ct);
    Task<int> ExpireOverdueAsync(CancellationToken ct);
}

public class ReservationService(
    ApplicationDbContext db,
    ISlotAllocationService slotAllocation,
    IPricingService pricing,
    IParkingRealtimeNotifier realtime) : IReservationService
{
    public async Task<ReservationDto> CreateAsync(CreateReservationRequest request, CancellationToken ct)
    {
        if (request.ReservedTo <= request.ReservedFrom)
            throw new BusinessException("ReservedTo must be after ReservedFrom.");

        var userExists = await db.Users.AnyAsync(u => u.UserId == request.UserId, ct);
        if (!userExists)
            throw new BusinessException("User not found.", 404);

        // ── Duplicate guard: no active (Pending/Confirmed) reservation for same plate ──
        var normalizedPlate = request.LicensePlate?.Trim().ToUpperInvariant();
        if (!string.IsNullOrEmpty(normalizedPlate))
        {
            var hasDuplicate = await db.Reservations.AnyAsync(r =>
                r.UserId == request.UserId &&
                r.LicensePlate == normalizedPlate &&
                (r.Status == "Pending" || r.Status == "Confirmed"),
                ct);

            if (hasDuplicate)
                throw new BusinessException(
                    $"Biển số '{normalizedPlate}' đã có đặt chỗ đang chờ hoặc đã xác nhận. " +
                    "Vui lòng huỷ đặt chỗ hiện tại trước khi tạo mới.", 409);
        }

        // ── Check global active reservation cap (from SystemConfig) ─────────────────
        var maxActive = await db.SystemConfigs
            .Where(c => c.ConfigKey == "MAX_ACTIVE_RESERVATIONS")
            .Select(c => c.ConfigValue)
            .FirstOrDefaultAsync(ct);

        if (int.TryParse(maxActive, out var cap) && cap > 0)
        {
            var activeCount = await db.Reservations.CountAsync(r =>
                r.UserId == request.UserId &&
                (r.Status == "Pending" || r.Status == "Confirmed"),
                ct);

            if (activeCount >= cap)
                throw new BusinessException(
                    $"Bạn đã đạt giới hạn {cap} đặt chỗ đang hoạt động. " +
                    "Vui lòng huỷ một đặt chỗ trước khi tạo mới.", 409);
        }

        ParkingSlot? slot = null;
        if (!string.IsNullOrWhiteSpace(request.SlotId))
        {
            slot = await slotAllocation.FindAvailableSlotAsync(
                request.VehicleTypeId, request.ZoneId, request.SlotId, request.PreferVipSlot, ct);
        }

        var reservation = new Reservation
        {
            UserId = request.UserId,
            VehicleTypeId = request.VehicleTypeId,
            ZoneId = slot?.ZoneId ?? request.ZoneId,
            SlotId = slot?.SlotId,
            LicensePlate = request.LicensePlate?.Trim().ToUpperInvariant(),
            ReservedFrom = request.ReservedFrom,
            ReservedTo = request.ReservedTo,
            PreferVipSlot = request.PreferVipSlot,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
        };

        db.Reservations.Add(reservation);
        await db.SaveChangesAsync(ct);

        return await MapAsync(reservation.ReservationId, ct) is { } dto
            ? await NotifyAsync(dto, "created", ct)
            : throw new BusinessException("Failed to load reservation.", 500);
    }

    public async Task<ReservationDto> ConfirmAsync(int reservationId, CancellationToken ct)
    {
        var reservation = await db.Reservations
            .Include(r => r.Slot)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId, ct)
            ?? throw new BusinessException("Reservation not found.", 404);

        if (reservation.Status != "Pending")
            throw new BusinessException($"Only pending reservations can be confirmed (status: {reservation.Status}).");

        await db.ExecuteInTransactionAsync(async () =>
        {
            if (string.IsNullOrWhiteSpace(reservation.SlotId))
            {
                var slot = await slotAllocation.FindAvailableSlotAsync(
                    reservation.VehicleTypeId, reservation.ZoneId, null, reservation.PreferVipSlot, ct);
                reservation.SlotId = slot.SlotId;
                reservation.ZoneId = slot.ZoneId;
                slot.Status = "Reserved";
            }
            else if (reservation.Slot is not null)
            {
                if (reservation.Slot.Status != "Available")
                    throw new BusinessException($"Slot '{reservation.SlotId}' is not available.");

                if (reservation.PreferVipSlot && reservation.Slot.Note != "VIP")
                    throw new BusinessException("Assigned slot is not a VIP slot.");

                reservation.Slot.Status = "Reserved";
            }

            if (reservation.PreferVipSlot)
                reservation.VipSurcharge = await pricing.GetVipSlotSurchargeAsync(ct);

            reservation.Status = "Confirmed";
            await db.SaveChangesAsync(ct);
        }, ct);

        return await MapAsync(reservationId, ct) is { } confirmed
            ? await NotifyAsync(confirmed, "confirmed", ct)
            : throw new BusinessException("Failed to load reservation.", 500);
    }

    public async Task<ReservationDto> CancelAsync(int reservationId, CancellationToken ct)
    {
        var reservation = await db.Reservations
            .Include(r => r.Slot)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId, ct)
            ?? throw new BusinessException("Reservation not found.", 404);

        if (reservation.Status is "CheckedIn" or "Cancelled" or "Expired")
            throw new BusinessException($"Reservation cannot be cancelled (status: {reservation.Status}).");

        await db.ExecuteInTransactionAsync(async () =>
        {
            if (reservation.Slot is not null && reservation.Slot.Status == "Reserved")
                reservation.Slot.Status = "Available";

            reservation.Status = "Cancelled";
            await db.SaveChangesAsync(ct);
        }, ct);

        return await MapAsync(reservationId, ct) is { } cancelled
            ? await NotifyAsync(cancelled, "cancelled", ct)
            : throw new BusinessException("Failed to load reservation.", 500);
    }

    public async Task<int> ExpireOverdueAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var overdue = await db.Reservations
            .Include(r => r.Slot)
            .Where(r => r.Status == "Confirmed" && r.ReservedTo < now)
            .ToListAsync(ct);

        if (overdue.Count == 0)
            return 0;

        await db.ExecuteInTransactionAsync(async () =>
        {
            foreach (var reservation in overdue)
            {
                if (reservation.Slot?.Status == SlotStatuses.Reserved)
                    reservation.Slot.Status = SlotStatuses.Available;
                reservation.Status = "Expired";
            }

            await db.SaveChangesAsync(ct);
        }, ct);

        foreach (var reservation in overdue)
        {
            if (await MapAsync(reservation.ReservationId, ct) is { } dto)
                await NotifyAsync(dto, "expired", ct);
        }

        return overdue.Count;
    }

    private async Task<ReservationDto> NotifyAsync(ReservationDto dto, string action, CancellationToken ct)
    {
        await realtime.NotifyReservationUpdatedAsync(dto, action, ct);
        return dto;
    }

    private async Task<ReservationDto?> MapAsync(int reservationId, CancellationToken ct) =>
        await db.Reservations
            .AsNoTracking()
            .Where(r => r.ReservationId == reservationId)
            .Select(DtoProjections.Reservation)
            .FirstOrDefaultAsync(ct);
}
