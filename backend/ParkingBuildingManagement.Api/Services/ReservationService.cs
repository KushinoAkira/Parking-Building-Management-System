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
            .Select(r => new ReservationDto(
                r.ReservationId,
                r.UserId,
                r.User.FullName,
                r.VehicleTypeId,
                r.VehicleType.TypeCode,
                r.ZoneId,
                r.Zone != null ? r.Zone.ZoneCode : null,
                r.SlotId,
                r.LicensePlate,
                r.ReservedFrom,
                r.ReservedTo,
                r.Status,
                r.PreferVipSlot,
                r.VipSurcharge,
                r.Slot != null && r.Slot.Note == "VIP",
                r.CreatedAt))
            .FirstOrDefaultAsync(ct);
}
