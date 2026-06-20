using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Dtos;

namespace ParkingBuildingManagement.Api.Tests;

public class ParkingSessionFlowTests : IClassFixture<PbmsWebApplicationFactory>
{
    private readonly PbmsWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ParkingSessionFlowTests(PbmsWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<HttpClient> CreateStaffClientAsync()
    {
        var client = _factory.CreateClient();
        await TestAuth.AuthenticateAsStaffAsync(client);
        return client;
    }

    [Fact]
    public async Task CheckIn_ThenCheckOut_CompletesSessionAndFreesSlot()
    {
        var client = await CreateStaffClientAsync();
        const string plate = "51A-TEST-01";
        var checkIn = await client.PostAsJsonAsync("/api/parking-sessions/check-in", new CheckInRequest(
            plate, 2, null, null, null, null, null, "Gate-Test", null));

        Assert.Equal(HttpStatusCode.OK, checkIn.StatusCode);
        var session = await checkIn.Content.ReadFromJsonAsync<SessionDto>();
        Assert.NotNull(session);
        Assert.Equal("Active", session.Status);
        Assert.Equal(plate, session.LicensePlate);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var slot = await db.ParkingSlots.FirstAsync(s => s.SlotId == session.SlotId);
            Assert.Equal("Occupied", slot.Status);
        }

        var checkOut = await client.PostAsJsonAsync(
            $"/api/parking-sessions/{session.SessionId}/check-out",
            new CheckOutRequest(null, "Gate-Test", "Cash"));

        Assert.Equal(HttpStatusCode.OK, checkOut.StatusCode);
        var result = await checkOut.Content.ReadFromJsonAsync<CheckOutResultDto>();
        Assert.NotNull(result);
        Assert.Equal("Completed", result.Session.Status);
        Assert.True(result.TotalFee >= 0);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var slot = await db.ParkingSlots.FirstAsync(s => s.SlotId == session.SlotId);
            Assert.Equal("Available", slot.Status);
            Assert.True(await db.Payments.AnyAsync(p => p.SessionId == session.SessionId));
        }
    }

    [Fact]
    public async Task CheckIn_DuplicateActivePlate_Returns400()
    {
        var client = await CreateStaffClientAsync();
        const string plate = "51A-DUP-99";
        var first = await client.PostAsJsonAsync("/api/parking-sessions/check-in", new CheckInRequest(
            plate, 2, null, null, null, null, null, "Gate-Test", null));
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/parking-sessions/check-in", new CheckInRequest(
            plate, 2, null, null, null, null, null, "Gate-Test", null));

        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }
}
