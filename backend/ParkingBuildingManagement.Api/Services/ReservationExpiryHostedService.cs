namespace ParkingBuildingManagement.Api.Services;

/// <summary>Marks confirmed reservations past ReservedTo as Expired and frees their slots.</summary>
public sealed class ReservationExpiryHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<ReservationExpiryHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IReservationService>();
                var expired = await service.ExpireOverdueAsync(stoppingToken);
                if (expired > 0)
                    logger.LogInformation("Expired {Count} overdue reservation(s).", expired);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Reservation expiry sweep failed.");
            }

            await Task.Delay(SweepInterval, stoppingToken);
        }
    }
}
