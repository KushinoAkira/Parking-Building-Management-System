namespace ParkingBuildingManagement.Api.Services.Ocr;

/// <summary>Pre-loads PaddleOCR at startup so the first staff scan is not blocked.</summary>
public sealed class PlateOcrWarmupHostedService(
    IPlateOcrService ocr,
    ILogger<PlateOcrWarmupHostedService> logger) : IHostedService
{
    public Task StartAsync(CancellationToken cancellationToken)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                logger.LogInformation("Pre-loading PaddleOCR in background...");
                await ocr.WarmUpAsync(cancellationToken);
                logger.LogInformation("PaddleOCR warmup finished. Available={Available}", ocr.IsAvailable);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "PaddleOCR background warmup failed.");
            }
        }, cancellationToken);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
