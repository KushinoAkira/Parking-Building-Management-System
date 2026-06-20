using System.Net;
using System.Net.Http.Json;
using ParkingBuildingManagement.Api.Dtos;

namespace ParkingBuildingManagement.Api.Tests;

public class AuthEndpointTests : IClassFixture<PbmsWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthEndpointTests(PbmsWebApplicationFactory factory) =>
        _client = factory.CreateClient();

    [Fact]
    public async Task Login_WithValidStaff_ReturnsToken()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            TestData.StaffEmail, TestData.StaffPassword));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        Assert.Equal("Staff", auth.RoleName);
        Assert.False(string.IsNullOrWhiteSpace(auth.Token));
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            TestData.StaffEmail, "WrongPassword1"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Register_CreatesDriverAccount()
    {
        var email = $"newdriver.{Guid.NewGuid():N}@test.pbms";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            "New Driver", email, "Driver@Test123", "0900555666"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        Assert.Equal("Driver", auth.RoleName);
        Assert.Equal(email, auth.Email);
    }
}
