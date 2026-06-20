using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Common;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Services;

public interface ISlotAllocationService
{
    Task<ParkingSlot> FindAvailableSlotAsync(int vehicleTypeId, int? zoneId, string? slotId, CancellationToken ct);
}

public class SlotAllocationService(ApplicationDbContext db) : ISlotAllocationService
{
    public async Task<ParkingSlot> FindAvailableSlotAsync(int vehicleTypeId, int? zoneId, string? slotId, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(slotId))
        {
            var specific = await db.ParkingSlots
                .Include(s => s.Zone)
                .FirstOrDefaultAsync(s => s.SlotId == slotId, ct)
                ?? throw new BusinessException($"Slot '{slotId}' not found.", 404);

            if (specific.Zone.VehicleTypeId != vehicleTypeId)
                throw new BusinessException("Slot does not match the requested vehicle type.");

            if (specific.Status != "Available" && specific.Status != "Reserved")
                throw new BusinessException($"Slot '{slotId}' is not available (status: {specific.Status}).");

            return specific;
        }

        var zoneQuery = db.ParkingZones
            .Where(z => z.VehicleTypeId == vehicleTypeId && z.Status == "Active");

        if (zoneId.HasValue)
            zoneQuery = zoneQuery.Where(z => z.ZoneId == zoneId.Value);

        // Single query: join zones with available slot counts, pick zone with most availability ratio
        var bestZoneId = await zoneQuery
            .Select(z => new
            {
                z.ZoneId,
                z.Capacity,
                AvailableCount = z.ParkingSlots.Count(s => s.Status == "Available"),
            })
            .Where(x => x.AvailableCount > 0)
            .OrderByDescending(x => (double)x.AvailableCount / x.Capacity)
            .Select(x => (int?)x.ZoneId)
            .FirstOrDefaultAsync(ct)
            ?? throw new BusinessException("No available slots for this vehicle type.", 404);

        var slot = await db.ParkingSlots
            .Include(s => s.Zone)
            .FirstOrDefaultAsync(s => s.ZoneId == bestZoneId && s.Status == "Available", ct)
            ?? throw new BusinessException("No available slots found.", 404);

        return slot;
    }
}
