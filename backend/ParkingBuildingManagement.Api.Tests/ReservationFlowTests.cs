using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;

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
}
