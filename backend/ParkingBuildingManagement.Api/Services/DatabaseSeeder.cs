using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Services;

public interface IDatabaseSeeder
{
    Task SeedAsync(CancellationToken ct = default);
}

public class DatabaseSeeder(ApplicationDbContext db) : IDatabaseSeeder
{
    public async Task SeedAsync(CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);
        await EnsureReservationVipColumnsAsync(ct);

        await EnsureDemoUsersAsync(ct);
        await EnsureEvVehicleTypesAsync(ct);

        if (!await db.ParkingFacilities.AnyAsync(ct))
        {
            db.ParkingFacilities.Add(new ParkingFacility
            {
                FacilityName = "PBMS Central Parking",
                Address = "Ho Chi Minh City",
                OpenTime = new TimeOnly(5, 0),
                CloseTime = new TimeOnly(23, 59),
                Status = "Active",
                Description = "Default facility for local development",
            });
        }

        await DeactivateNonCatalogZonesAsync(ct);
        await EnsureDefaultZonesAndSlotsAsync(ct);

        await EnsureDefaultPricingAsync(ct);
        await EnsureEvPricingAsync(ct);

        if (!await db.SystemConfigs.AnyAsync(ct))
        {
            db.SystemConfigs.AddRange(
                new SystemConfig { ConfigKey = "DEFAULT_CURRENCY", ConfigValue = "VND", Description = "Default currency" },
                new SystemConfig { ConfigKey = "MAX_ACTIVE_RESERVATIONS", ConfigValue = "2", Description = "Per driver reservation limit" },
                new SystemConfig { ConfigKey = "RESERVATION_HOLD_MINUTES", ConfigValue = "15", Description = "Auto release reservation in minutes" },
                new SystemConfig { ConfigKey = "GRACE_PERIOD_MINUTES", ConfigValue = "15", Description = "Free minutes after entry" },
                new SystemConfig { ConfigKey = "SYSTEM_STATUS", ConfigValue = "Active", Description = "System operational status" },
                new SystemConfig { ConfigKey = "OCCUPANCY_WARNING_PERCENT", ConfigValue = "90", Description = "Occupancy alert threshold" },
                new SystemConfig { ConfigKey = "AI_SLOT_SUGGESTION", ConfigValue = "true", Description = "Enable AI slot suggestion" },
                new SystemConfig { ConfigKey = "AI_WEIGHT_MODE", ConfigValue = "balanced", Description = "AI weight mode" },
                new SystemConfig { ConfigKey = PricingService.VipSlotSurchargeKey, ConfigValue = "10000", Description = "Extra fee (VND) for VIP slot reservation" });
        }
        else
        {
            await EnsureConfigAsync("GRACE_PERIOD_MINUTES", "15", "Free minutes after entry", ct);
            await EnsureConfigAsync("SYSTEM_STATUS", "Active", "System operational status", ct);
            await EnsureConfigAsync("OCCUPANCY_WARNING_PERCENT", "90", "Occupancy alert threshold", ct);
            await EnsureConfigAsync("AI_SLOT_SUGGESTION", "true", "Enable AI slot suggestion", ct);
            await EnsureConfigAsync("AI_WEIGHT_MODE", "balanced", "AI weight mode", ct);
            await EnsureConfigAsync(PricingService.VipSlotSurchargeKey, "10000", "Extra fee (VND) for VIP slot reservation", ct);
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task DeactivateNonCatalogZonesAsync(CancellationToken ct)
    {
        foreach (var zone in await db.ParkingZones.ToListAsync(ct))
        {
            if (!ParkingFloorCatalog.IsCatalogZoneCode(zone.ZoneCode))
                zone.Status = "Inactive";
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureDefaultZonesAndSlotsAsync(CancellationToken ct)
    {
        var globalSlotIds = (await db.ParkingSlots.AsNoTracking()
            .Select(s => s.SlotId)
            .ToListAsync(ct)).ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var template in ParkingFloorCatalog.Zones)
        {
            var zone = await db.ParkingZones.FirstOrDefaultAsync(z => z.ZoneCode == template.Code, ct);
            if (zone is null)
            {
                zone = new ParkingZone
                {
                    ZoneCode = template.Code,
                    ZoneName = ParkingFloorCatalog.ZoneDisplayName(template),
                    VehicleTypeId = template.VehicleTypeId,
                    Capacity = template.Capacity,
                    Status = "Active",
                };
                db.ParkingZones.Add(zone);
                await db.SaveChangesAsync(ct);
            }
            else
            {
                zone.ZoneName = ParkingFloorCatalog.ZoneDisplayName(template);
                zone.VehicleTypeId = template.VehicleTypeId;
                zone.Capacity = template.Capacity;
                zone.Status = "Active";
            }

            await EnsureZoneSlotsAsync(zone, globalSlotIds, ct);
            await EnsureVipSlotNotesAsync(zone.ZoneId, ct);
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureZoneSlotsAsync(ParkingZone zone, HashSet<string> globalSlotIds, CancellationToken ct)
    {
        var existingIds = (await db.ParkingSlots
            .Where(s => s.ZoneId == zone.ZoneId)
            .Select(s => s.SlotId)
            .ToListAsync(ct)).ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (existingIds.Count >= zone.Capacity) return;

        var batch = new List<ParkingSlot>(capacity: 100);
        for (var i = 1; i <= zone.Capacity; i++)
        {
            var slotId = $"{zone.ZoneCode}{i}";
            if (existingIds.Contains(slotId) || globalSlotIds.Contains(slotId)) continue;

            batch.Add(new ParkingSlot
            {
                SlotId = slotId,
                ZoneId = zone.ZoneId,
                Status = "Available",
                Note = ParkingSlotRules.IsVipSlot(slotId) ? "VIP" : null,
            });
            globalSlotIds.Add(slotId);

            if (batch.Count < 100) continue;
            db.ParkingSlots.AddRange(batch);
            await db.SaveChangesAsync(ct);
            batch.Clear();
        }

        if (batch.Count == 0) return;
        db.ParkingSlots.AddRange(batch);
        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureVipSlotNotesAsync(int zoneId, CancellationToken ct)
    {
        var slots = await db.ParkingSlots.Where(s => s.ZoneId == zoneId).ToListAsync(ct);
        foreach (var slot in slots)
        {
            var shouldBeVip = ParkingSlotRules.IsVipSlot(slot.SlotId);
            slot.Note = shouldBeVip ? "VIP" : null;
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureEvVehicleTypesAsync(CancellationToken ct)
    {
        var evTypes = new[]
        {
            (4, "EV_MOTORBIKE", "Electric Motorbike"),
            (5, "EV_CAR", "Electric Car"),
        };
        foreach (var (id, code, name) in evTypes)
        {
            if (await db.VehicleTypes.AnyAsync(v => v.VehicleTypeId == id, ct)) continue;
            db.VehicleTypes.Add(new VehicleType
            {
                VehicleTypeId = id,
                TypeCode = code,
                TypeName = name,
                Status = "Active",
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureDefaultPricingAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var defaults = new (int TypeId, string Name, decimal Hour, decimal Daily, decimal Lost)[]
        {
            (1, "Motorbike Standard", 5000, 50000, 20000),
            (2, "Car Standard", 20000, 200000, 50000),
            (3, "EV Standard", 25000, 250000, 50000),
        };

        foreach (var (typeId, name, hour, daily, lost) in defaults)
        {
            if (await db.PricingPolicies.AnyAsync(p => p.VehicleTypeId == typeId && p.Status == "Active", ct))
                continue;

            db.PricingPolicies.Add(new PricingPolicy
            {
                VehicleTypeId = typeId,
                PolicyName = name,
                PricePerHour = hour,
                DailyMaxFee = daily,
                LostTicketFee = lost,
                OvertimeFee = 0,
                Status = "Active",
                CreatedAt = now,
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureEvPricingAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        foreach (var typeId in new[] { 4, 5 })
        {
            if (await db.PricingPolicies.AnyAsync(p => p.VehicleTypeId == typeId, ct)) continue;
            var baseEv = await db.PricingPolicies.AsNoTracking()
                .FirstOrDefaultAsync(p => p.VehicleTypeId == 3 && p.Status == "Active", ct);
            db.PricingPolicies.Add(new PricingPolicy
            {
                VehicleTypeId = typeId,
                PolicyName = typeId == 4 ? "EV Motorbike Standard" : "EV Car Standard",
                PricePerHour = baseEv?.PricePerHour ?? (typeId == 4 ? 6000m : 25000m),
                DailyMaxFee = baseEv?.DailyMaxFee ?? (typeId == 4 ? 60000m : 250000m),
                LostTicketFee = baseEv?.LostTicketFee ?? 20000m,
                OvertimeFee = 0,
                Status = "Active",
                CreatedAt = now,
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureDemoUsersAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var demos = new[]
        {
            ("admin@parking.com", "System Admin", "Admin@123", 1, "0900000000"),
            ("manager@parking.com", "System Manager", "Manager@123", 2, "0900000001"),
            ("staff@parking.com", "Station Staff", "Staff@123", 3, "0900000002"),
            ("user@parking.com", "Driver Demo", "User@123", 4, "0900000003"),
        };

        foreach (var (email, fullName, password, roleId, phone) in demos)
        {
            var normalized = email.ToLowerInvariant();
            var existing = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalized, ct);
            if (existing is null)
            {
                db.Users.Add(new User
                {
                    FullName = fullName,
                    Email = normalized,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                    Phone = phone,
                    RoleId = roleId,
                    Status = "Active",
                    CreatedAt = now,
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureReservationVipColumnsAsync(CancellationToken ct)
    {
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "Reservations" ADD COLUMN IF NOT EXISTS "PreferVipSlot" boolean NOT NULL DEFAULT FALSE;
            ALTER TABLE "Reservations" ADD COLUMN IF NOT EXISTS "VipSurcharge" numeric(12,2);
            """, ct);
    }

    private async Task EnsureConfigAsync(string key, string value, string description, CancellationToken ct)
    {
        if (await db.SystemConfigs.AnyAsync(c => c.ConfigKey == key, ct)) return;
        db.SystemConfigs.Add(new SystemConfig { ConfigKey = key, ConfigValue = value, Description = description });
    }
}
