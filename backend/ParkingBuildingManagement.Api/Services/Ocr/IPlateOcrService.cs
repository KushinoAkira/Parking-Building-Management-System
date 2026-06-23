namespace ParkingBuildingManagement.Api.Services.Ocr;

public record PlateOcrResult(string? Plate, string RawText, bool Available);

public interface IPlateOcrService
{
    bool IsAvailable { get; }
    Task WarmUpAsync(CancellationToken cancellationToken = default);
    Task<PlateOcrResult> RecognizeAsync(Stream imageStream, CancellationToken cancellationToken = default);
}
