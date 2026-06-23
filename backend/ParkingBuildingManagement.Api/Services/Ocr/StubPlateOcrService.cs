namespace ParkingBuildingManagement.Api.Services.Ocr;

public sealed class StubPlateOcrService : IPlateOcrService
{
    public bool IsAvailable => false;

    public Task WarmUpAsync(CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<PlateOcrResult> RecognizeAsync(Stream imageStream, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PlateOcrResult(null, string.Empty, false));
}
