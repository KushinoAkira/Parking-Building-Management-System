using System.Net.Http.Headers;
using System.Net.Http.Json;
using ParkingBuildingManagement.Api.Dtos;

namespace ParkingBuildingManagement.Api.Tests;

public static class TestAuth
{
    public static async Task AuthenticateAsStaffAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            TestData.StaffEmail, TestData.StaffPassword));
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>()
            ?? throw new InvalidOperationException("Login returned no auth payload.");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
    }

    public static async Task AuthenticateAsDriverAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            TestData.DriverEmail, TestData.DriverPassword));
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>()
            ?? throw new InvalidOperationException("Login returned no auth payload.");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
    }

    public static async Task AuthenticateAsManagerAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            TestData.ManagerEmail, TestData.ManagerPassword));
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>()
            ?? throw new InvalidOperationException("Login returned no auth payload.");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
    }
}
