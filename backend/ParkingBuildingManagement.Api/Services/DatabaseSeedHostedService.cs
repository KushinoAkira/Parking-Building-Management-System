namespace ParkingBuildingManagement.Api.Services;

/// <summary>Runs migrations + catalog seed in background so HTTP (healthcheck) starts immediately.</summary>
public sealed class DatabaseSeedHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<DatabaseSeedHostedService> logger) : IHostedService
{
    private Task? _seedTask;

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _seedTask = SeedInBackgroundAsync(cancellationToken);
        return Task.CompletedTask;
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_seedTask is not null)
            await _seedTask.WaitAsync(cancellationToken);
    }

    private async Task SeedInBackgroundAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var seeder = scope.ServiceProvider.GetRequiredService<IDatabaseSeeder>();
            await seeder.SeedAsync(stoppingToken);
            logger.LogInformation("Database seed completed.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Database seed failed.");
        }
    }
}
