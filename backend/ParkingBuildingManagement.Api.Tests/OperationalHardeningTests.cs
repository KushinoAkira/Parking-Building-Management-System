using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Models;
using ParkingBuildingManagement.Api.Services;

namespace ParkingBuildingManagement.Api.Tests;

public class OperationalHardeningTests : IClassFixture<PbmsWebApplicationFactory>
{
    private readonly PbmsWebApplicationFactory _factory;

    public OperationalHardeningTests(PbmsWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task CheckOut_WithinGracePeriod_ChargesZeroParkingFee()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await UpsertConfigAsync(db, PricingService.GracePeriodMinutesKey, "15");
            await db.SaveChangesAsync();
        }

        var staff = _factory.CreateClient();
        await TestAuth.AuthenticateAsStaffAsync(staff);

        const string plate = "51A-GRACE-01";
        var checkIn = await staff.PostAsJsonAsync("/api/parking-sessions/check-in", new CheckInRequest(
            plate, 2, "T2", null, null, null, null, "Gate-Test", null));
        Assert.Equal(HttpStatusCode.OK, checkIn.StatusCode);
        var session = await checkIn.Content.ReadFromJsonAsync<SessionDto>();
        Assert.NotNull(session);

        var checkOut = await staff.PostAsJsonAsync(
            $"/api/parking-sessions/{session.SessionId}/check-out",
            new CheckOutRequest(null, "Gate-Test", "Cash"));
        Assert.Equal(HttpStatusCode.OK, checkOut.StatusCode);
        var result = await checkOut.Content.ReadFromJsonAsync<CheckOutResultDto>();
        Assert.NotNull(result);
        Assert.Equal(0m, result.TotalFee);
    }

    [Fact]
    public async Task IncidentCancel_WhenNotOpen_Returns400()
    {
        var staff = _factory.CreateClient();
        await TestAuth.AuthenticateAsStaffAsync(staff);

        var create = await staff.PostAsJsonAsync("/api/incidents", new
        {
            sessionId = (int?)null,
            incidentType = "Test",
            description = "test",
            penaltyFee = 0m,
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var incident = await create.Content.ReadFromJsonAsync<IncidentDto>();
        Assert.NotNull(incident);

        var manager = _factory.CreateClient();
        await TestAuth.AuthenticateAsManagerAsync(manager);

        var resolve = await manager.PostAsync($"/api/incidents/{incident.IncidentId}/resolve", null);
        Assert.Equal(HttpStatusCode.OK, resolve.StatusCode);

        var cancel = await manager.PostAsync($"/api/incidents/{incident.IncidentId}/cancel", null);
        Assert.Equal(HttpStatusCode.BadRequest, cancel.StatusCode);
    }

    [Fact]
    public async Task CheckOut_EWallet_DeductsDriverBalance()
    {
        int driverId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await UpsertConfigAsync(db, PricingService.GracePeriodMinutesKey, "0");
            var driver = await db.Users.FirstAsync(u => u.Email == TestData.DriverEmail);
            driver.WalletBalance = 500_000m;
            driverId = driver.UserId;
            await db.SaveChangesAsync();
        }

        var staff = _factory.CreateClient();
        await TestAuth.AuthenticateAsStaffAsync(staff);

        const string plate = "51A-WALLET-01";
        var checkIn = await staff.PostAsJsonAsync("/api/parking-sessions/check-in", new CheckInRequest(
            plate, 2, "T2", null, driverId, null, null, "Gate-Test", null));
        Assert.Equal(HttpStatusCode.OK, checkIn.StatusCode);
        var session = await checkIn.Content.ReadFromJsonAsync<SessionDto>();
        Assert.NotNull(session);

        var driverClient = _factory.CreateClient();
        await TestAuth.AuthenticateAsDriverAsync(driverClient);

        var checkOut = await driverClient.PostAsJsonAsync(
            $"/api/parking-sessions/{session.SessionId}/check-out",
            new CheckOutRequest(null, "Gate-Test", "EWallet"));
        Assert.Equal(HttpStatusCode.OK, checkOut.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user = await db.Users.FirstAsync(u => u.UserId == driverId);
            Assert.True(user.WalletBalance < 500_000m);
            Assert.True(await db.Payments.AnyAsync(p =>
                p.SessionId == session.SessionId && p.PaymentMethod == "EWallet"));
        }
    }

    [Fact]
    public async Task Pricing_OvertimeFee_AddedAfterFirstDay()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await UpsertConfigAsync(db, PricingService.GracePeriodMinutesKey, "0");
            var policy = await db.PricingPolicies.FirstAsync(p => p.VehicleTypeId == 2);
            policy.OvertimeFee = 50_000m;
            policy.PricePerHour = 10_000m;
            policy.DailyMaxFee = 100_000m;
            await db.SaveChangesAsync();

            var pricing = scope.ServiceProvider.GetRequiredService<IPricingService>();
            var entry = DateTime.UtcNow.AddHours(-25);
            var exit = DateTime.UtcNow;
            var fee = await pricing.CalculateFeeAsync(2, entry, exit, false, CancellationToken.None);

            // 25h → hourly capped at daily max (100k) + 1 overtime day (50k)
            Assert.Equal(150_000m, fee);
        }
    }

    [Fact]
    public async Task ReportSnapshot_GenerateDaily_ReturnsOk()
    {
        var manager = _factory.CreateClient();
        await TestAuth.AuthenticateAsManagerAsync(manager);

        var response = await manager.PostAsync("/api/reports/snapshots/daily", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var list = await manager.GetAsync("/api/reports/snapshots?days=7");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
    }

    private record IncidentDto(int IncidentId, string Status);

    private static async Task UpsertConfigAsync(ApplicationDbContext db, string key, string value)
    {
        var config = await db.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == key);
        if (config is null)
        {
            db.SystemConfigs.Add(new SystemConfig
            {
                ConfigKey = key,
                ConfigValue = value,
                Description = "Test config",
            });
        }
        else
        {
            config.ConfigValue = value;
        }
    }
}
