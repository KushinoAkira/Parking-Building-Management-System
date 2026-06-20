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
}

public class ReservationService(ApplicationDbContext db, ISlotAllocationService slotAllocation) : IReservationService
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
                request.VehicleTypeId, request.ZoneId, request.SlotId, ct);
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
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
        };

        db.Reservations.Add(reservation);
        await db.SaveChangesAsync(ct);

        return await MapAsync(reservation.ReservationId, ct)
            ?? throw new BusinessException("Failed to load reservation.", 500);
    }

    public async Task<ReservationDto> ConfirmAsync(int reservationId, CancellationToken ct)
    {
        var reservation = await db.Reservations
            .Include(r => r.Slot)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId, ct)
            ?? throw new BusinessException("Reservation not found.", 404);

        if (reservation.Status != "Pending")
            throw new BusinessException($"Only pending reservations can be confirmed (status: {reservation.Status}).");

        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? tx = null;
        if (db.Database.SupportsTransactions())
            tx = await db.Database.BeginTransactionAsync(ct);

        try
        {
        if (string.IsNullOrWhiteSpace(reservation.SlotId))
        {
            var slot = await slotAllocation.FindAvailableSlotAsync(
                reservation.VehicleTypeId, reservation.ZoneId, null, ct);
            reservation.SlotId = slot.SlotId;
            reservation.ZoneId = slot.ZoneId;
            slot.Status = "Reserved";
        }
        else if (reservation.Slot is not null)
        {
            if (reservation.Slot.Status != "Available")
                throw new BusinessException($"Slot '{reservation.SlotId}' is not available.");

            reservation.Slot.Status = "Reserved";
        }

        reservation.Status = "Confirmed";
        await db.SaveChangesAsync(ct);
        if (tx is not null) await tx.CommitAsync(ct);
        }
        finally
        {
            if (tx is not null) await tx.DisposeAsync();
        }

        return await MapAsync(reservationId, ct)
            ?? throw new BusinessException("Failed to load reservation.", 500);
    }

    public async Task<ReservationDto> CancelAsync(int reservationId, CancellationToken ct)
    {
        var reservation = await db.Reservations
            .Include(r => r.Slot)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId, ct)
            ?? throw new BusinessException("Reservation not found.", 404);

        if (reservation.Status is "CheckedIn" or "Cancelled" or "Expired")
            throw new BusinessException($"Reservation cannot be cancelled (status: {reservation.Status}).");

        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? tx = null;
        if (db.Database.SupportsTransactions())
            tx = await db.Database.BeginTransactionAsync(ct);

        try
        {
        if (reservation.Slot is not null && reservation.Slot.Status == "Reserved")
            reservation.Slot.Status = "Available";

        reservation.Status = "Cancelled";
        await db.SaveChangesAsync(ct);
        if (tx is not null) await tx.CommitAsync(ct);
        }
        finally
        {
            if (tx is not null) await tx.DisposeAsync();
        }

        return await MapAsync(reservationId, ct)
            ?? throw new BusinessException("Failed to load reservation.", 500);
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
                r.CreatedAt))
            .FirstOrDefaultAsync(ct);
}
