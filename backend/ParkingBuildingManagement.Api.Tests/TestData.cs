using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Tests;

public static class TestData
{
    public const string StaffEmail = "staff@test.pbms";
    public const string StaffPassword = "Staff@Test123";
    public const string DriverEmail = "driver@test.pbms";
    public const string DriverPassword = "Driver@Test123";
    public const string ManagerEmail = "manager@test.pbms";
    public const string ManagerPassword = "Manager@Test123";

    public static void Seed(ApplicationDbContext db)
    {
        if (db.Users.Any()) return;

        var staffRole = db.Roles.First(r => r.RoleName == "Staff");
        var driverRole = db.Roles.First(r => r.RoleName == "Driver");
        var managerRole = db.Roles.First(r => r.RoleName == "Manager");

        db.Users.AddRange(
            new User
            {
                FullName = "Test Staff",
                Email = StaffEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(StaffPassword),
                Phone = "0900111222",
                RoleId = staffRole.RoleId,
                Status = "Active",
                HasLocalPassword = true,
                CreatedAt = DateTime.UtcNow,
            },
            new User
            {
                FullName = "Test Driver",
                Email = DriverEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(DriverPassword),
                Phone = "0900333444",
                RoleId = driverRole.RoleId,
                Status = "Active",
                HasLocalPassword = true,
                CreatedAt = DateTime.UtcNow,
            },
            new User
            {
                FullName = "Test Manager",
                Email = ManagerEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(ManagerPassword),
                Phone = "0900555666",
                RoleId = managerRole.RoleId,
                Status = "Active",
                HasLocalPassword = true,
                CreatedAt = DateTime.UtcNow,
            });

        if (!db.ParkingZones.Any())
        {
            db.ParkingZones.Add(new ParkingZone
            {
                ZoneCode = "T",
                ZoneName = "Test Zone",
                VehicleTypeId = 2,
                Capacity = 5,
                Status = "Active",
            });
            db.SaveChanges();

            var zone = db.ParkingZones.First();
            db.ParkingSlots.AddRange(
                new ParkingSlot { SlotId = "T1", ZoneId = zone.ZoneId, Status = "Available", Note = "VIP" },
                new ParkingSlot { SlotId = "T2", ZoneId = zone.ZoneId, Status = "Available" });
        }

        if (!db.PricingPolicies.Any())
        {
            db.PricingPolicies.Add(new PricingPolicy
            {
                VehicleTypeId = 2,
                PolicyName = "Test Car Policy",
                PricePerHour = 10000,
                DailyMaxFee = 100000,
                LostTicketFee = 30000,
                OvertimeFee = 0,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
            });
        }

        db.SaveChanges();
    }
}
