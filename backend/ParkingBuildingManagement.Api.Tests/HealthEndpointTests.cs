using System.Net;
using System.Net.Http.Json;

namespace ParkingBuildingManagement.Api.Tests;

public class HealthEndpointTests : IClassFixture<PbmsWebApplicationFactory>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(PbmsWebApplicationFactory factory) =>
        _client = factory.CreateClient();

    [Fact]
    public async Task GetHealth_ReturnsOkWithDatabaseConnected()
    {
        var response = await _client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.NotNull(body);
        Assert.Equal("ok", body.Status);
        Assert.Equal("connected", body.Database);
    }

    private sealed record HealthResponse(string Status, string Database, DateTime Timestamp);
}
