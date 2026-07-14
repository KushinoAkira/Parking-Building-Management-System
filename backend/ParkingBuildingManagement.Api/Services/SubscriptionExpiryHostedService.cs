namespace ParkingBuildingManagement.Api.Services;

/// <summary>Marks active subscriptions past EndDate as Expired.</summary>
public sealed class SubscriptionExpiryHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<SubscriptionExpiryHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
                var expired = await service.ExpireOverdueAsync(stoppingToken);
                if (expired > 0)
                    logger.LogInformation("Expired {Count} overdue subscription(s).", expired);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Subscription expiry sweep failed.");
            }

            await Task.Delay(SweepInterval, stoppingToken);
        }
    }
}
