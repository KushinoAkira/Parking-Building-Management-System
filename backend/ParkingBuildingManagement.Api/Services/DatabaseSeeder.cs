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

        if (!await db.Users.AnyAsync(ct))
        {
            var now = DateTime.UtcNow;
            db.Users.AddRange(
                new User
                {
                    FullName = "System Manager",
                    Email = "manager@parking.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
                    Phone = "0900000001",
                    RoleId = 2,
                    Status = "Active",
                    CreatedAt = now,
                },
                new User
                {
                    FullName = "Station Staff",
                    Email = "staff@parking.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"),
                    Phone = "0900000002",
                    RoleId = 3,
                    Status = "Active",
                    CreatedAt = now,
                },
                new User
                {
                    FullName = "Driver Demo",
                    Email = "user@parking.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123"),
                    Phone = "0900000003",
                    RoleId = 4,
                    Status = "Active",
                    CreatedAt = now,
                });
        }

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
                new SystemConfig { ConfigKey = "RESERVATION_HOLD_MINUTES", ConfigValue = "15", Description = "Auto release reservation in minutes" });
        }

        await db.SaveChangesAsync(ct);
    }
}
