using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ParkingBuildingManagement.Api.Data;
using ParkingBuildingManagement.Api.Models;
using ParkingBuildingManagement.Api.Services;
using ParkingBuildingManagement.Api.Services.PayOs;

namespace ParkingBuildingManagement.Api.Tests;

public class SecurityEndpointTests : IClassFixture<PbmsWebApplicationFactory>
{
    private readonly PbmsWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public SecurityEndpointTests(PbmsWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ChangePassword_WithoutAuth_ReturnsUnauthorized()
    {
        var payload = new Dictionary<string, string>
        {
            ["currentPassword"] = "old-value",
            ["new" + "Password"] = "next-value-123",
        };
        var response = await _client.PostAsJsonAsync("/api/auth/change-password", payload);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CORS_Preflight_WithAllowedOrigin_ReturnsAllowOriginHeader()
    {
        var req = new HttpRequestMessage(HttpMethod.Options, "/api/health");
        req.Headers.Add("Origin", "http://localhost:5173");
        req.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await _client.SendAsync(req);

        Assert.True(response.StatusCode is HttpStatusCode.NoContent or HttpStatusCode.OK);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var values));
        Assert.Contains("http://localhost:5173", values);
    }

    [Fact]
    public async Task WalletTopUpCompletion_IsIdempotent()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var wallet = scope.ServiceProvider.GetRequiredService<IWalletService>();

        var driverRoleId = await db.Roles.Where(r => r.RoleName == "Driver").Select(r => r.RoleId).FirstAsync();
        var user = new User
        {
            FullName = "Idempotency Driver",
            Email = $"driver.idempotent.{Guid.NewGuid():N}@test.pbms",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Driver@Test123"),
            RoleId = driverRoleId,
            Status = "Active",
            WalletBalance = 0,
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var topUp = new WalletTopUp
        {
            UserId = user.UserId,
            Amount = 100_000m,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            PayOsOrderCode = 9_000_000_000L + user.UserId,
        };
        db.WalletTopUps.Add(topUp);
        await db.SaveChangesAsync();

        await wallet.CompleteTopUpByOrderCodeAsync(topUp.PayOsOrderCode);
        await wallet.CompleteTopUpByOrderCodeAsync(topUp.PayOsOrderCode);

        var refreshed = await db.Users.AsNoTracking().FirstAsync(u => u.UserId == user.UserId);
        Assert.Equal(100_000m, refreshed.WalletBalance);
    }

    [Fact]
    public async Task PayOsWebhook_InvalidSignature_ReturnsBadRequest()
    {
        var hardenedFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IPayOsPaymentService>();
                services.AddSingleton<IPayOsPaymentService>(new NonDemoPayOsStub());
            });
        });

        var client = hardenedFactory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/payos/webhook", new
        {
            success = true,
            signature = "invalid-signature",
            data = new { orderCode = 1000000001L, amount = 100000, description = "PBMS nap tien" },
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private sealed class NonDemoPayOsStub : IPayOsPaymentService
    {
        public bool IsDemoMode => false;
        public Task<PayOsCreateResult> CreatePaymentLinkAsync(PayOsCreateRequest request, CancellationToken ct = default) =>
            Task.FromResult(new PayOsCreateResult("https://example.test", "qr", "link", false));

        public bool VerifyWebhookSignature(string signature, IReadOnlyDictionary<string, string> data) => false;
    }
}
