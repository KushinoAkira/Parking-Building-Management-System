using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;
using ParkingBuildingManagement.Api.Services;

namespace ParkingBuildingManagement.Api.Tests;

public class ReservationFlowTests : IClassFixture<PbmsWebApplicationFactory>
{
    private readonly PbmsWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ReservationFlowTests(PbmsWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateAndConfirm_ReservesSlot()
    {
        var client = _factory.CreateClient();
        await TestAuth.AuthenticateAsDriverAsync(client);

        int driverId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            driverId = db.Users.First(u => u.Email == TestData.DriverEmail).UserId;
        }

        var from = DateTime.UtcNow.AddHours(1);
        var to = from.AddHours(2);
        var create = await client.PostAsJsonAsync("/api/reservations", new CreateReservationRequest(
            driverId, 2, null, null, "29C-RES-01", from, to));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var reservation = await create.Content.ReadFromJsonAsync<ReservationDto>();
        Assert.NotNull(reservation);
        Assert.Equal("Pending", reservation.Status);

        var confirm = await client.PostAsync($"/api/reservations/{reservation.ReservationId}/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirm.StatusCode);
        var confirmed = await confirm.Content.ReadFromJsonAsync<ReservationDto>();
        Assert.NotNull(confirmed);
        Assert.Equal("Confirmed", confirmed.Status);
        Assert.False(string.IsNullOrWhiteSpace(confirmed.SlotId));

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var slot = await db.ParkingSlots.FirstAsync(s => s.SlotId == confirmed.SlotId);
            Assert.Equal("Reserved", slot.Status);
        }
    }

    [Fact]
    public async Task CreateAndConfirm_WithVipPreference_AssignsVipSlotAndSurcharge()
    {
        var client = _factory.CreateClient();
        await TestAuth.AuthenticateAsDriverAsync(client);

        int driverId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            driverId = db.Users.First(u => u.Email == TestData.DriverEmail).UserId;
        }

        var from = DateTime.UtcNow.AddHours(1);
        var to = from.AddHours(2);
        var create = await client.PostAsJsonAsync("/api/reservations", new CreateReservationRequest(
            driverId, 2, null, null, "29C-VIP-01", from, to, PreferVipSlot: true));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var reservation = await create.Content.ReadFromJsonAsync<ReservationDto>();
        Assert.NotNull(reservation);
        Assert.True(reservation.PreferVipSlot);

        var confirm = await client.PostAsync($"/api/reservations/{reservation.ReservationId}/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirm.StatusCode);
        var confirmed = await confirm.Content.ReadFromJsonAsync<ReservationDto>();
        Assert.NotNull(confirmed);
        Assert.True(confirmed.IsVipSlot);
        Assert.NotNull(confirmed.VipSurcharge);
        Assert.True(confirmed.VipSurcharge > 0);
    }

    [Fact]
    public async Task ExpireOverdue_ReleasesSlot()
    {
        await TestAuth.AuthenticateAsDriverAsync(_client);

        int driverId;
        string slotId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            driverId = db.Users.First(u => u.Email == TestData.DriverEmail).UserId;
            slotId = db.ParkingSlots.First(s => s.Status == "Available").SlotId;
        }

        var from = DateTime.UtcNow.AddHours(-3);
        var to = DateTime.UtcNow.AddHours(-1);
        var create = await _client.PostAsJsonAsync("/api/reservations", new CreateReservationRequest(
            driverId, 2, null, slotId, "29C-EXP-01", from, to));
        var reservation = await create.Content.ReadFromJsonAsync<ReservationDto>();
        Assert.NotNull(reservation);

        await _client.PostAsync($"/api/reservations/{reservation.ReservationId}/confirm", null);

        int expired;
        using (var scope = _factory.Services.CreateScope())
        {
            var service = scope.ServiceProvider.GetRequiredService<IReservationService>();
            expired = await service.ExpireOverdueAsync(CancellationToken.None);
        }

        Assert.Equal(1, expired);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var updated = await db.Reservations.FirstAsync(r => r.ReservationId == reservation.ReservationId);
            var slot = await db.ParkingSlots.FirstAsync(s => s.SlotId == slotId);
            Assert.Equal("Expired", updated.Status);
            Assert.Equal("Available", slot.Status);
        }
    }
}
