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

        await EnsureDemoUsersAsync(ct);

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

        if (!await db.ParkingZones.AnyAsync(ct))
        {
            db.ParkingZones.AddRange(
                new ParkingZone { ZoneCode = "A", ZoneName = "Motorbike Zone A", VehicleTypeId = 1, Capacity = 20, Status = "Active" },
                new ParkingZone { ZoneCode = "B", ZoneName = "Car Zone B", VehicleTypeId = 2, Capacity = 20, Status = "Active" },
                new ParkingZone { ZoneCode = "C", ZoneName = "EV Zone C", VehicleTypeId = 3, Capacity = 10, Status = "Active" });
        }

        await db.SaveChangesAsync(ct);

        if (!await db.ParkingSlots.AnyAsync(ct))
        {
            var zones = await db.ParkingZones.AsNoTracking().ToListAsync(ct);
            foreach (var zone in zones)
            {
                var targetCount = Math.Min(zone.Capacity, 20);
                for (var i = 1; i <= targetCount; i++)
                {
                    db.ParkingSlots.Add(new ParkingSlot
                    {
                        SlotId = $"{zone.ZoneCode}{i}",
                        ZoneId = zone.ZoneId,
                        Status = "Available",
                    });
                }
            }
        }

        if (!await db.PricingPolicies.AnyAsync(ct))
        {
            var now = DateTime.UtcNow;
            db.PricingPolicies.AddRange(
                new PricingPolicy
                {
                    VehicleTypeId = 1,
                    PolicyName = "Motorbike Standard",
                    PricePerHour = 5000,
                    DailyMaxFee = 50000,
                    LostTicketFee = 20000,
                    OvertimeFee = 0,
                    Status = "Active",
                    CreatedAt = now,
                },
                new PricingPolicy
                {
                    VehicleTypeId = 2,
                    PolicyName = "Car Standard",
                    PricePerHour = 20000,
                    DailyMaxFee = 200000,
                    LostTicketFee = 50000,
                    OvertimeFee = 0,
                    Status = "Active",
                    CreatedAt = now,
                },
                new PricingPolicy
                {
                    VehicleTypeId = 3,
                    PolicyName = "EV Standard",
                    PricePerHour = 25000,
                    DailyMaxFee = 250000,
                    LostTicketFee = 50000,
                    OvertimeFee = 0,
                    Status = "Active",
                    CreatedAt = now,
                });
        }

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
                new SystemConfig { ConfigKey = "AI_WEIGHT_MODE", ConfigValue = "balanced", Description = "AI weight mode" });
        }
        else
        {
            await EnsureConfigAsync("GRACE_PERIOD_MINUTES", "15", "Free minutes after entry", ct);
            await EnsureConfigAsync("SYSTEM_STATUS", "Active", "System operational status", ct);
            await EnsureConfigAsync("OCCUPANCY_WARNING_PERCENT", "90", "Occupancy alert threshold", ct);
            await EnsureConfigAsync("AI_SLOT_SUGGESTION", "true", "Enable AI slot suggestion", ct);
            await EnsureConfigAsync("AI_WEIGHT_MODE", "balanced", "AI weight mode", ct);
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

    private async Task EnsureConfigAsync(string key, string value, string description, CancellationToken ct)
    {
        if (await db.SystemConfigs.AnyAsync(c => c.ConfigKey == key, ct)) return;
        db.SystemConfigs.Add(new SystemConfig { ConfigKey = key, ConfigValue = value, Description = description });
    }
}
